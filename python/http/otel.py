import logging
import os
from typing import Tuple

from opentelemetry import metrics, trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import (
    OTLPLogExporter,
)
from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
    OTLPMetricExporter,
)
from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
    OTLPSpanExporter,
)

from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.urllib3 import URLLib3Instrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor

from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def _create_otlp_headers(
    target_package: str, bearer_token: str = None
) -> dict:
    """
    Create OTLP headers with authentication and target package.

    Args:
        target_package: The target package for x-observe-target-package header.
        bearer_token: Optional bearer token for authentication.

    Returns:
        Dictionary of headers for OTLP exporters.
    """
    headers = {"x-observe-target-package": target_package}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    return headers


def setup_tracing(
    resource: Resource, otlp_endpoint: str, bearer_token: str = None
) -> trace.Tracer:
    """
    Set up OpenTelemetry tracing with OTLP HTTP exporter.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP trace exporter.
        bearer_token: Bearer token for authentication.

    Returns:
        trace.Tracer: An OpenTelemetry Tracer instance.
    """
    headers = _create_otlp_headers("Tracing", bearer_token)

    trace_provider = TracerProvider(resource=resource)
    otlp_exporter = OTLPSpanExporter(
        endpoint=f"{otlp_endpoint}/v1/traces", headers=headers
    )
    otlp_processor = BatchSpanProcessor(otlp_exporter)
    trace_provider.add_span_processor(otlp_processor)
    trace.set_tracer_provider(trace_provider)
    return trace.get_tracer(__name__)


def setup_metrics(
    resource: Resource, otlp_endpoint: str, bearer_token: str = None
) -> metrics.Meter:
    """
    Set up OpenTelemetry metrics with OTLP HTTP exporter.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP metric exporter.
        bearer_token: Bearer token for authentication.

    Returns:
        metrics.Meter: An OpenTelemetry Meter instance.
    """
    headers = _create_otlp_headers("Metrics", bearer_token)

    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(
            endpoint=f"{otlp_endpoint}/v1/metrics", headers=headers
        )
    )
    metrics.set_meter_provider(
        MeterProvider(resource=resource, metric_readers=[metric_reader])
    )
    return metrics.get_meter(__name__)


def setup_logging(
    resource: Resource, otlp_endpoint: str, bearer_token: str = None
) -> logging.Logger:
    """
    Set up OpenTelemetry logging with OTLP HTTP exporter.

    Args:
        resource: OpenTelemetry resource with service attributes.
        otlp_endpoint: Endpoint for the OTLP log exporter.
        bearer_token: Bearer token for authentication.

    Returns:
        logging.Logger: A configured logger instance.
    """
    headers = _create_otlp_headers("Logs", bearer_token)

    logger_provider = LoggerProvider(resource=resource)
    set_logger_provider(logger_provider)
    logger_provider.add_log_record_processor(
        BatchLogRecordProcessor(
            OTLPLogExporter(
                endpoint=f"{otlp_endpoint}/v1/logs", headers=headers
            )
        )
    )

    handler = LoggingHandler(
        level=logging.NOTSET, logger_provider=logger_provider
    )
    # App loggers should propagate to root; avoid logging.basicConfig()
    logging.getLogger().addHandler(handler)
    logging.getLogger().setLevel(logging.INFO)

    LoggingInstrumentor().instrument(set_logging_format=True)

    return logging.getLogger(__name__)


def setup_instrumentation(
    service_name: str,
) -> Tuple[logging.Logger, trace.Tracer, metrics.Meter]:
    """
    Instrument an HTTP service with OpenTelemetry.

    Args:
        service_name: Logical service name for resource attributes.

    Returns:
        Tuple containing (logger, tracer, meter) instances.
    """
    # Instrument HTTP libraries for automatic tracing
    RequestsInstrumentor().instrument()
    URLLib3Instrumentor().instrument()

    resource = Resource(attributes={SERVICE_NAME: service_name})
    otlp_endpoint = os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318"
    )
    bearer_token = os.environ.get("OTEL_EXPORTER_OTLP_BEARER_TOKEN")

    tracer = setup_tracing(resource, otlp_endpoint, bearer_token)
    meter = setup_metrics(resource, otlp_endpoint, bearer_token)
    logger = setup_logging(resource, otlp_endpoint, bearer_token)

    return logger, tracer, meter
