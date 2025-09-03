# OpenTelemetry Flask Setup Example

This directory provides a practical example for instrumenting Flask applications with OpenTelemetry. It demonstrates how to set up comprehensive observability with traces, metrics, and logs using OTLP exporters.

- [OpenTelemetry Flask Setup Example](#opentelemetry-flask-setup-example)
  - [📦 Dependencies](#-dependencies)
  - [🔧 Configuration](#-configuration)
  - [🧪 Setup](#-setup)
    - [Key Components](#key-components)
    - [Basic Setup](#basic-setup)
  - [📋 Usage Patterns](#-usage-patterns)
    - [Custom Spans](#custom-spans)
    - [Custom Metrics](#custom-metrics)
    - [Error Handling](#error-handling)
  - [🧪 Example Application](#-example-application)
  - [References](#references)

## 📦 Dependencies

Install the required packages using pip:

```bash
pip install \
  flask==2.3.3 \
  opentelemetry-api>=1.30.0,<1.33.0 \
  opentelemetry-sdk>=1.30.0,<1.33.0 \
  opentelemetry-exporter-otlp-proto-grpc>=1.30.0,<1.33.0 \
  opentelemetry-instrumentation-flask>=0.51b0,<=0.53b0 \
  opentelemetry-instrumentation-logging>=0.51b0,<=0.53b0
```

**Important**: Use the exact versions specified in [`requirements.txt`](requirements.txt) which contains tested and verified compatible versions.

## 🔧 Configuration

The setup uses OTLP gRPC exporter with endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. Default: `http://localhost:4317`.

## 🧪 Setup

The [otel.py](otel.py) file provides a complete OpenTelemetry setup for Flask applications.

### Key Components

- **Tracing**: TracerProvider + OTLPSpanExporter (automatic request/response spans)
- **Metrics**: MeterProvider + OTLPMetricExporter (custom counters/histograms)
- **Logging**: LoggerProvider + OTLPLogExporter (structured logs with trace correlation)
- **Instrumentation**: FlaskInstrumentor (zero-code HTTP instrumentation)

### Basic Setup

```python
from flask import Flask
from otel import setup_instrumentation

app = Flask(__name__)
logger, tracer, meter = setup_instrumentation(app, "your-service-name")

@app.route("/")
def root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello World"}
```

## 📋 Usage Patterns

### Custom Spans

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

@app.route("/users/<int:user_id>")
def get_user(user_id):
    with tracer.start_as_current_span("get_user_operation") as span:
        span.set_attribute("user.id", user_id)
        try:
            user = fetch_user(user_id)
            return user
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise
```

### Custom Metrics

```python
# Create instruments once
request_counter = meter.create_counter("requests_total")
request_duration = meter.create_histogram("request_duration_seconds")

@app.route("/api/data")
def get_data():
    start_time = time.time()

    # Increment counter
    request_counter.add(1, {"method": "GET", "endpoint": "/api/data"})

    # Your logic here
    result = process_data()

    # Record duration
    duration = time.time() - start_time
    request_duration.record(duration, {"method": "GET"})

    return result
```

### Error Handling

```python
from flask import jsonify

@app.errorhandler(404)
def not_found(error):
    logger.error(f"404 error: {error}")
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    return jsonify({"error": "Internal server error"}), 500
```

## 🧪 Example Application

Complete example with OpenTelemetry instrumentation:

```python
import time
from flask import Flask, jsonify, abort
from otel import setup_instrumentation

app = Flask(__name__)
logger, tracer, meter = setup_instrumentation(app, "flask-example")

# Create metrics
request_counter = meter.create_counter("requests_total")

@app.route("/")
def root():
    logger.info("Root endpoint accessed")
    request_counter.add(1, {"endpoint": "/"})
    return jsonify({"message": "Hello, OpenTelemetry & Flask!"})

@app.route("/users/<int:user_id>")
def get_user(user_id):
    if user_id < 1:
        logger.error(f"Invalid user ID: {user_id}")
        abort(400, description="Invalid user ID")

    # Simulate work
    time.sleep(0.1)

    request_counter.add(1, {"endpoint": "/users/<user_id>"})
    return jsonify({"user_id": user_id, "name": f"User {user_id}"})

@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "timestamp": time.time()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

**Run the application**:

```bash
# Set endpoint (optional)
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"

# Start server
python app.py

# Test endpoints
curl http://localhost:5000/
curl http://localhost:5000/users/123
curl http://localhost:5000/health
```

The application automatically provides:
- HTTP request/response tracing
- Structured logging with trace correlation
- Custom metrics capability
- Manual span creation for business logic
- OTLP export to your observability backend

## References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenTelemetry Flask Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/flask/flask.html)
