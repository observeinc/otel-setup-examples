# OpenTelemetry FastAPI Setup Example

This directory provides a practical example for instrumenting FastAPI applications with OpenTelemetry. It demonstrates how to set up comprehensive observability with traces, metrics, and logs using OTLP exporters.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration](#-configuration)  
- [🧪 Setup](#-setup)
- [📋 Usage Patterns](#-usage-patterns)
- [🧪 Example Application](#-example-application)

## 📦 Dependencies

Install the required packages using pip:

```bash
pip install \
  fastapi==0.104.1 \
  uvicorn==0.24.0 \
  opentelemetry-api>=1.30.0,<1.33.0 \
  opentelemetry-sdk>=1.30.0,<1.33.0 \
  opentelemetry-exporter-otlp-proto-grpc>=1.30.0,<1.33.0 \
  opentelemetry-instrumentation-fastapi>=0.51b0,<=0.53b0 \
  opentelemetry-instrumentation-logging>=0.51b0,<=0.53b0
```

**Important**: Use the exact versions specified in [`requirements.txt`](requirements.txt) which contains tested and verified compatible versions.

## 🔧 Configuration

The setup uses OTLP gRPC exporter with endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. Default: `http://localhost:4317`.

## 🧪 Setup

The [otel.py](otel.py) file provides a complete OpenTelemetry setup for FastAPI applications.

### Key Components

- **Tracing**: TracerProvider + OTLPSpanExporter (automatic request/response spans)
- **Metrics**: MeterProvider + OTLPMetricExporter (custom counters/histograms)  
- **Logging**: LoggerProvider + OTLPLogExporter (structured logs with trace correlation)
- **Instrumentation**: FastAPIInstrumentor (zero-code HTTP instrumentation)

### Basic Setup

```python
from fastapi import FastAPI
from otel import setup_instrumentation

app = FastAPI()
logger, tracer, meter = setup_instrumentation(app, "your-service-name")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello World"}
```

## 📋 Usage Patterns

### Custom Spans

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    with tracer.start_as_current_span("get_user_operation") as span:
        span.set_attribute("user.id", user_id)
        try:
            user = await fetch_user(user_id)
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

@app.get("/api/data")
async def get_data():
    start_time = time.time()
    
    # Increment counter
    request_counter.add(1, {"method": "GET", "endpoint": "/api/data"})
    
    # Your logic here
    result = await process_data()
    
    # Record duration
    duration = time.time() - start_time
    request_duration.record(duration, {"method": "GET"})
    
    return result
```

### Background Tasks

```python
from fastapi import BackgroundTasks

async def process_data_async(data_id: str):
    with tracer.start_as_current_span("background_processing") as span:
        span.set_attribute("data.id", data_id)
        # Processing logic here
        logger.info(f"Processed data {data_id}")

@app.post("/process/{data_id}")
async def start_processing(data_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_data_async, data_id)
    return {"message": f"Processing started for {data_id}"}
```

## 🧪 Example Application

Complete example with OpenTelemetry instrumentation:

```python
import time
import asyncio
from fastapi import FastAPI, HTTPException
from otel import setup_instrumentation

app = FastAPI(title="OpenTelemetry FastAPI Example", version="1.0.0")
logger, tracer, meter = setup_instrumentation(app, "fastapi-example")

# Create metrics
request_counter = meter.create_counter("requests_total")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    request_counter.add(1, {"endpoint": "/"})
    return {"message": "Hello, OpenTelemetry & FastAPI!"}

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    if user_id < 1:
        logger.error(f"Invalid user ID: {user_id}")
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Simulate work
    await asyncio.sleep(0.1)
    
    request_counter.add(1, {"endpoint": "/users/{user_id}"})
    return {"user_id": user_id, "name": f"User {user_id}"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}
```

**Run the application**:

```bash
# Set endpoint (optional)
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000

# Test endpoints
curl http://localhost:8000/
curl http://localhost:8000/users/123
curl http://localhost:8000/health
```

The application automatically provides:
- HTTP request/response tracing
- Structured logging with trace correlation  
- Custom metrics capability
- Manual span creation for business logic
- OTLP export to your observability backend

## References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenTelemetry FastAPI Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/fastapi/fastapi.html)
