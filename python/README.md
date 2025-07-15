# OpenTelemetry Python Setup Examples <!-- omit from toc -->

This repository offers practical examples for instrumenting Python web applications with OpenTelemetry (OTel). It covers both manual and automatic instrumentation methods for Flask and FastAPI frameworks, demonstrating how to collect and export traces, metrics, and logs using OTLP exporters.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration Overview](#-configuration-overview)
- [🧪 Flask Application Example](#-flask-application-example)
  - [Key Components](#key-components)
- [⚡ FastAPI Application Example](#-fastapi-application-example)
  - [Key Components](#key-components-1)
- [⚙️ Automatic Instrumentation](#️-automatic-instrumentation)
  - [Setup](#setup)
- [📈 Exporting Telemetry Data](#-exporting-telemetry-data)
- [🧪 Example Usage](#-example-usage)
  - [Flask Application](#flask-application)
  - [FastAPI Application](#fastapi-application)
- [📚 References](#-references)


## 📦 Dependencies

Ensure the following packages are installed:

```bash
pip install \
  opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http \
  opentelemetry-exporter-otlp-proto-grpc \
  opentelemetry-instrumentation-flask \
  opentelemetry-instrumentation-fastapi \
  opentelemetry-instrumentation-logging
```

For automatic instrumentation (and only for that, if you don't use auto instrumentation don't install them), additional packages are required:

```bash
pip install \
  opentelemetry-distro \
  opentelemetry-instrumentation
```

**Version Compatibility Notes**:
- **For working, tested versions**: Check the project's [`requirements.txt`](requirements.txt) file which contains a set of compatible versions that have been verified to work together

## 🔧 Configuration Overview

The examples utilize the OTLP gRPC exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4317`.

## 🧪 Flask Application Example

The [flask/otel.py](flask/otel.py) file demonstrates how to set up OpenTelemetry in a Flask application. It includes configurations for tracing, metrics, and logging, along with instrumentation for Flask and logging modules.

### Key Components
- **Tracing**: Configured using TracerProvider and OTLPSpanExporter.
- **Metrics**: Set up with MeterProvider and OTLPMetricExporter.
- **Logging**: Implemented via LoggerProvider and OTLPLogExporter.
- **Instrumentation**: Applied to Flask and logging using FlaskInstrumentor and LoggingInstrumentor.

The setup functions are modular, allowing for reuse and clarity.

## ⚡ FastAPI Application Example

The [fastapi/otel.py](fastapi/otel.py) file illustrates the OpenTelemetry setup for a FastAPI application. The configuration is analogous to the Flask example, with adjustments for FastAPI's asynchronous nature.

### Key Components
- **Tracing**: Utilizes TracerProvider and OTLPSpanExporter.
- **Metrics**: Configured with MeterProvider and OTLPMetricExporter.
- **Logging**: Set up using LoggerProvider and OTLPLogExporter.
- **Instrumentation**: Applied to FastAPI and logging via FastAPIInstrumentor and LoggingInstrumentor.

The setup functions mirror those in the Flask example, ensuring consistency across different frameworks.

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

This approach automatically instruments supported libraries and frameworks, capturing telemetry data without manual setup.

## 📈 Exporting Telemetry Data

Both examples are configured to export telemetry data using the OTLP gRPC protocol. Ensure that your OpenTelemetry Collector or backend is set up to receive data at the specified endpoint (`http://localhost:4317` by default).

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

## 📚 References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [OpenTelemetry Flask Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/flask/flask.html)
- [OpenTelemetry FastAPI Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/fastapi/fastapi.html)
- [Automatic Instrumentation Guide](https://opentelemetry.io/docs/zero-code/python/)

