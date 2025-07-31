import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { credentials } from "@grpc/grpc-js";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, metrics, Tracer, Meter } from "@opentelemetry/api";
import { Logger } from "@opentelemetry/api-logs";

// Configuration
const serviceName = "example-service"; // replace with your service name
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317";

// Create resource
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
});

// Initialize OpenTelemetry SDK
export const sdk = new NodeSDK({
  resource: resource,
  traceExporter: new OTLPTraceExporter({
    url: otlpEndpoint,
    credentials: credentials.createInsecure(),
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: otlpEndpoint,
      credentials: credentials.createInsecure(),
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

const logExporter = new OTLPLogExporter({
  url: otlpEndpoint,
  credentials: credentials.createInsecure(),
});

// Initialize Logger Provider
export const loggerProvider = new LoggerProvider({
  resource: resource,
  processors: [new BatchLogRecordProcessor(logExporter)],
});

// Initialize OpenTelemetry and return initialized components
export function initOtel(): { tracer: Tracer; logger: Logger; meter: Meter } {
  try {
    sdk.start();

    // Initialize tracer, logger, and meter after SDK is started
    const tracer = trace.getTracer(serviceName);
    const logger = loggerProvider.getLogger(serviceName);
    const meter = metrics.getMeter(serviceName);

    logger.emit({
      severityNumber: 9, // INFO
      severityText: "INFO",
      body: "OpenTelemetry SDK started",
    });

    return { tracer, logger, meter };
  } catch (error) {
    const logger = loggerProvider.getLogger(serviceName);
    logger.emit({
      severityNumber: 17, // ERROR
      severityText: "ERROR",
      body: "Error starting OpenTelemetry SDK",
      attributes: { error: (error as Error).message },
    });
    throw error;
  }
}

// Graceful shutdown
export function shutdownOtel(): void {
  try {
    sdk.shutdown();
  } catch (error) {
    const logger = loggerProvider.getLogger(serviceName);
    logger.emit({
      severityNumber: 17, // ERROR
      severityText: "ERROR",
      body: "Error shutting down OpenTelemetry SDK",
      attributes: { error: (error as Error).message },
    });
    throw error;
  }
}
