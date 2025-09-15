# OpenTelemetry HTTP Setup Example

This directory provides a practical example for instrumenting HTTP applications with OpenTelemetry. It demonstrates how to set up comprehensive observability with traces, metrics, and logs using OTLP exporters for HTTP clients and servers.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration](#-configuration)
- [🧪 Setup](#-setup)
- [📋 Usage Patterns](#-usage-patterns)
- [🧪 Example Application](#-example-application)

## 📦 Dependencies

Install the required packages using pip:

```bash
pip install \
  requests>=2.25.0 \
  urllib3>=1.26.0 \
  opentelemetry-api>=1.30.0,<1.33.0 \
  opentelemetry-sdk>=1.30.0,<1.33.0 \
  opentelemetry-exporter-otlp-proto-http>=1.30.0,<1.33.0 \
  opentelemetry-instrumentation-requests>=0.40b0 \
  opentelemetry-instrumentation-urllib3>=0.40b0 \
  opentelemetry-instrumentation-logging>=0.51b0,<=0.53b0
```

**Important**: Use the exact versions specified in [`requirements.txt`](requirements.txt) which contains tested and verified compatible versions.

## 🔧 Configuration

The setup uses OTLP HTTP exporter with endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. Default: `http://localhost:4318`.

## 🧪 Setup

The [otel.py](otel.py) file provides a complete OpenTelemetry setup for HTTP applications.

### Key Components

- **Tracing**: TracerProvider + OTLPSpanExporter (automatic HTTP request/response spans)
- **Metrics**: MeterProvider + OTLPMetricExporter (custom counters/histograms)
- **Logging**: LoggerProvider + OTLPLogExporter (structured logs with trace correlation)
- **Instrumentation**: RequestsInstrumentor/URLLib3Instrumentor (zero-code HTTP instrumentation)

### Basic Setup

**For HTTP Client**:
```python
import requests
from otel import setup_instrumentation

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("your-http-client")

# Make HTTP requests (automatically instrumented)
response = requests.get("https://api.example.com/data")
```

**For HTTP Server (with Flask/FastAPI)**:
```python
from flask import Flask
from otel import setup_instrumentation

app = Flask(__name__)

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("your-http-service")

@app.route("/")
def hello():
    logger.info("Hello endpoint accessed")
    return "Hello, World!"
```

## 📋 Usage Patterns

### Custom Spans in HTTP Handlers

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
import requests

def make_api_call(url: str):
    with tracer.start_as_current_span("external_api_call") as span:
        span.set_attribute("http.url", url)
        try:
            logger.info(f"Making request to {url}")
            response = requests.get(url)
            span.set_attribute("http.status_code", response.status_code)
            span.set_attribute("http.response_size", len(response.content))
            
            if response.status_code >= 400:
                span.set_status(Status(StatusCode.ERROR, f"HTTP {response.status_code}"))
            
            return response
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise
```

### Custom Metrics

```python
# Create instruments once
request_counter = meter.create_counter("http_requests_total")
request_duration = meter.create_histogram("http_request_duration_seconds")

def handle_request(url: str):
    start_time = time.time()

    # Increment counter
    request_counter.add(1, {
        "method": "POST",
        "endpoint": "/hello"
    })

    # Make request
    response = requests.post(url, json={"name": "World"})

    # Record duration
    duration = time.time() - start_time
    request_duration.record(duration, {
        "method": "POST",
        "endpoint": "/hello"
    })

    return response
```

### Error Handling

```python
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

def robust_http_call(url: str, timeout: int = 30):
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()  # Raises HTTPError for bad responses
        
        logger.info(f"Successfully called {url}", extra={
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        })
        
        return response
        
    except Timeout:
        logger.error(f"Timeout calling {url}")
        raise
    except ConnectionError:
        logger.error(f"Connection error calling {url}")
        raise
    except requests.HTTPError as e:
        logger.error(f"HTTP error calling {url}: {e}")
        raise
    except RequestException as e:
        logger.error(f"Request error calling {url}: {e}")
        raise
```

## 🧪 Example Application

Complete example with OpenTelemetry instrumentation:

**HTTP Client (client.py)**:
```python
import requests
from otel import setup_instrumentation

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("http-client-example")

def run():
    url = "http://localhost:8080/hello"
    payload = {"name": "World"}

    logger.info("Sending hello request")
    response = requests.post(url, json=payload)

    logger.info(f"Received response: {response.json()}")
    print(f"HTTP client received: {response.json()['message']}")

if __name__ == '__main__':
    run()
```

**HTTP Server with Flask (server.py)**:
```python
import time
from flask import Flask, jsonify, request
from otel import setup_instrumentation

app = Flask(__name__)

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("http-server-example")

# Create metrics
request_counter = meter.create_counter("http_requests_total")

@app.route("/hello", methods=['POST'])
def say_hello():
    data = request.get_json() or {}
    name = data.get('name', 'World')

    logger.info(f"Received hello request for {name}")
    request_counter.add(1, {"method": "SayHello"})

    # Simulate some work
    time.sleep(0.1)

    return jsonify({
        "message": f'Hello, {name}! From OpenTelemetry HTTP server.'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

**Run the application**:

```bash
# Set endpoint (optional)
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"

# Terminal 1 - Start server
python server.py

# Terminal 2 - Run client
python client.py
```

The application automatically provides:
- HTTP request/response tracing (both client and server)
- Structured logging with trace correlation
- Custom metrics capability
- Manual span creation for business logic
- OTLP export to your observability backend

## References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [Requests Documentation](https://docs.python-requests.org/)
- [OpenTelemetry HTTP Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/requests/requests.html)
