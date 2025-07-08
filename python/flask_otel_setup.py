import logging
import os
from typing import Tuple

from flask import Flask
from opentelemetry import metrics, trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_tracing(resource: Resource, otlp_endpoint: str) -> trace.Tracer:
    """
    Set up OpenTelemetry tracing.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP trace exporter.

    Returns:
        An OpenTelemetry Tracer instance.
    """
    trace_provider = TracerProvider(resource=resource)
    otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
    otlp_processor = BatchSpanProcessor(otlp_exporter)
    trace_provider.add_span_processor(otlp_processor)
    trace.set_tracer_provider(trace_provider)
    return trace.get_tracer(__name__)


def setup_metrics(resource: Resource, otlp_endpoint: str) -> metrics.Meter:
    """
    Set up OpenTelemetry metrics.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP metric exporter.

    Returns:
        An OpenTelemetry Meter instance.
    """
    metric_reader = PeriodicExportingMetricReader(OTLPMetricExporter(endpoint=otlp_endpoint))
    metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[metric_reader]))
    return metrics.get_meter(__name__)


def setup_logging(resource: Resource, otlp_endpoint: str) -> logging.Logger:
    """
    Set up OpenTelemetry logging.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP log exporter.

    Returns:
        A configured root logger.
    """
    logger_provider = LoggerProvider(resource=resource)
    set_logger_provider(logger_provider)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter(endpoint=otlp_endpoint)))

    handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)
    logging.getLogger().addHandler(handler)
    logging.getLogger().setLevel(logging.INFO)

    LoggingInstrumentor().instrument(set_logging_format=True)

    return logging.getLogger(__name__)


def setup_instrumentation(app: Flask, service_name: str) -> Tuple[logging.Logger, trace.Tracer, metrics.Meter]:
    """
    Instrument a Flask application with OpenTelemetry.

    Args:
        app: The Flask application instance to instrument.
        service_name: Logical service name for resource attributes.

    Returns:
        Tuple containing (logger, tracer, meter) instances.
    """
    FlaskInstrumentor().instrument_app(app)

    resource = Resource(attributes={SERVICE_NAME: service_name})
    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

    tracer = setup_tracing(resource, otlp_endpoint)
    meter = setup_metrics(resource, otlp_endpoint)
    logger = setup_logging(resource, otlp_endpoint)

    return logger, tracer, meter
