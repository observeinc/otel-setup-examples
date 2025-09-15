# OpenTelemetry Python Setup Examples <!-- omit from toc -->

This repository offers practical examples for instrumenting Python applications with OpenTelemetry (OTel). It covers both manual and automatic instrumentation methods for Flask, FastAPI, and HTTP client frameworks, demonstrating how to collect and export traces, metrics, and logs using OTLP exporters.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration Overview](#-configuration-overview)
- [🧪 Flask Application Example](#-flask-application-example)
  - [Key Components](#key-components)
- [⚡ FastAPI Application Example](#-fastapi-application-example)
  - [Key Components](#key-components-1)
- [🌐 HTTP Client Application Example](#-http-client-application-example)
  - [Key Components](#key-components-2)
- [⚙️ Automatic Instrumentation](#️-automatic-instrumentation)
  - [Setup](#setup)
- [📈 Exporting Telemetry Data](#-exporting-telemetry-data)
- [🧪 Example Usage](#-example-usage)
  - [Flask Application](#flask-application)
  - [FastAPI Application](#fastapi-application)
  - [HTTP Client Application](#http-client-application)
- [📚 References](#-references)


## 📦 Dependencies

Ensure the following packages are installed:

```bash
pip install \
  opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http \
  opentelemetry-instrumentation-flask \
  opentelemetry-instrumentation-fastapi \
  opentelemetry-instrumentation-requests \
  opentelemetry-instrumentation-urllib3 \
  opentelemetry-instrumentation-logging
```

For automatic instrumentation (and only for that, if you don't use auto instrumentation don't install them), additional packages are required:

```bash
pip install \
  opentelemetry-distro \
  opentelemetry-instrumentation
```

**Version Compatibility Notes**:
- **For working, tested versions**: Check the framework-specific requirements files which contain sets of compatible versions that have been verified to work together:
  - Flask: [`flask/requirements.txt`](flask/requirements.txt)
  - FastAPI: [`fastapi/requirements.txt`](fastapi/requirements.txt)
  - HTTP Client: [`http/requirements.txt`](http/requirements.txt)

## 🔧 Configuration Overview

The examples utilize the OTLP HTTP exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4318`.

### Required Environment Variables

To use with Observe or other OTLP-compatible backends, set these two environment variables:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://185003257558.collect.observeinc.com/v2/otel
export OTEL_EXPORTER_OTLP_BEARER_TOKEN=<your-token-here>
```

The implementation automatically includes the required headers:
- `Authorization: Bearer <token>` (when `OTEL_EXPORTER_OTLP_BEARER_TOKEN` is set)
- `x-observe-target-package: Tracing|Metrics|Logs` (depending on the telemetry type)

## 🧪 Flask Application Example

The [flask/otel.py](flask/otel.py) file demonstrates how to set up OpenTelemetry in a Flask application. It includes configurations for tracing, metrics, and logging, along with instrumentation for Flask and logging modules.

### Key Components
- **Tracing**: Configured using TracerProvider and OTLP HTTP SpanExporter with bearer token authentication.
- **Metrics**: Set up with MeterProvider and OTLP HTTP MetricExporter with required headers.
- **Logging**: Implemented via LoggerProvider and OTLP HTTP LogExporter with proper authentication.
- **Instrumentation**: Applied to Flask and logging using FlaskInstrumentor and LoggingInstrumentor.
- **Authentication**: Automatic Bearer token authentication when `OTEL_EXPORTER_OTLP_BEARER_TOKEN` is provided.
- **Headers**: Includes required `x-observe-target-package` headers for proper telemetry routing.

The setup functions are modular, allowing for reuse and clarity.

## ⚡ FastAPI Application Example

The [fastapi/otel.py](fastapi/otel.py) file illustrates the OpenTelemetry setup for a FastAPI application. The configuration is analogous to the Flask example, with adjustments for FastAPI's asynchronous nature.

### Key Components
- **Tracing**: Utilizes TracerProvider and OTLP HTTP SpanExporter with bearer token authentication.
- **Metrics**: Configured with MeterProvider and OTLP HTTP MetricExporter with required headers.
- **Logging**: Set up using LoggerProvider and OTLP HTTP LogExporter with proper authentication.
- **Instrumentation**: Applied to FastAPI and logging via FastAPIInstrumentor and LoggingInstrumentor.
- **Authentication**: Automatic Bearer token authentication when `OTEL_EXPORTER_OTLP_BEARER_TOKEN` is provided.
- **Headers**: Includes required `x-observe-target-package` headers for proper telemetry routing.

The setup functions mirror those in the Flask example, ensuring consistency across different frameworks.

## 🌐 HTTP Client Application Example

The [http/otel.py](http/otel.py) file demonstrates OpenTelemetry setup for HTTP client applications. The configuration follows the same patterns as Flask and FastAPI examples, with adjustments for HTTP client libraries like requests and urllib3.

### Key Components
- **Tracing**: Configured using TracerProvider and OTLPSpanExporter.
- **Metrics**: Set up with MeterProvider and OTLPMetricExporter.
- **Logging**: Implemented via LoggerProvider and OTLPLogExporter.
- **Instrumentation**: Applied to HTTP clients using RequestsInstrumentor and URLLib3Instrumentor.

The setup functions maintain consistency with other framework examples while providing HTTP client-specific instrumentation.

## ⚙️ Automatic Instrumentation

OpenTelemetry supports automatic instrumentation, which allows you to instrument your application without modifying the source code. This is achieved using the opentelemetry-instrument command-line tool.

### Setup

1. Install the necessary packages:

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
```

2. Install instrumentation packages for detected libraries:

```bash
opentelemetry-bootstrap -a install
```

3. Run your application with automatic instrumentation:

For Flask:
```bash
opentelemetry-instrument python flask_app.py
```

For FastAPI:
```bash
opentelemetry-instrument uvicorn fastapi_app:app --host 0.0.0.0 --port 8000
```

For HTTP clients:
```bash
opentelemetry-instrument python http_client.py
```

This approach automatically instruments supported libraries and frameworks, capturing telemetry data without manual setup.

## 📈 Exporting Telemetry Data

All examples are configured to export telemetry data using the OTLP HTTP protocol. Ensure that your OpenTelemetry Collector or backend is set up to receive data at the specified endpoint (`http://localhost:4318` by default).

## 🧪 Example Usage

Set the OTLP Endpoint (if different from default):
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://your-otel-collector:4317"
```

### Flask Application
```python
from flask import Flask
from flask.otel import setup_instrumentation

app = Flask(__name__)
logger, tracer, meter = setup_instrumentation(app, service_name="my-flask-service")

@app.route("/")
def hello():
    logger.info("Root endpoint accessed")
    return "Hello, OpenTelemetry & Flask!"
```

```bash
python flask_app.py
```

### FastAPI Application
```python
from fastapi import FastAPI
from fastapi.otel import setup_instrumentation

app = FastAPI()
logger, tracer, meter = setup_instrumentation(app, service_name="my-fastapi-service")

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello, OpenTelemetry & FastAPI!"}
```

```bash
uvicorn fastapi_app:app --host 0.0.0.0 --port 8000
```

### HTTP Client Application
```python
import requests
from http.otel import setup_instrumentation

# Setup OpenTelemetry for HTTP client
logger, tracer, meter = setup_instrumentation(service_name="my-http-client")

# Make HTTP requests (automatically instrumented)
def make_api_calls():
    urls = [
        "https://httpbin.org/get",
        "https://httpbin.org/json",
        "https://api.github.com/users/octocat"
    ]

    for url in urls:
        logger.info(f"Making request to {url}")
        response = requests.get(url)
        logger.info(f"Response: {response.status_code}")
        print(f"Response from {url}: {response.status_code}")

if __name__ == '__main__':
    make_api_calls()
```

```bash
python http_client.py
```

## 📚 References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [OpenTelemetry Flask Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/flask/flask.html)
- [OpenTelemetry FastAPI Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/fastapi/fastapi.html)
- [OpenTelemetry Requests Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/requests/requests.html)
- [Automatic Instrumentation Guide](https://opentelemetry.io/docs/zero-code/python/)

