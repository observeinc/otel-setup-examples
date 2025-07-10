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
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, metrics } from "@opentelemetry/api";

// Configuration
const serviceName = "ts-http-hello";
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317";

// Create resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
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

// Initialize Logger Provider
export const loggerProvider = new LoggerProvider({
  resource: resource,
});
const logExporter = new OTLPLogExporter({
  url: otlpEndpoint,
  credentials: credentials.createInsecure(),
});
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Get tracer, meter, and logger
export const tracer = trace.getTracer(serviceName);
export const meter = metrics.getMeter(serviceName);
export const logger = loggerProvider.getLogger(serviceName);

// Initialize OpenTelemetry
export function initOtel(): void {
  try {
    sdk.start();
    logger.emit({
      severityNumber: 9, // INFO
      severityText: "INFO",
      body: "OpenTelemetry SDK started",
    });
  } catch (error) {
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
    logger.emit({
      severityNumber: 9, // INFO
      severityText: "INFO",
      body: "OpenTelemetry SDK shut down",
    });
  } catch (error) {
    logger.emit({
      severityNumber: 17, // ERROR
      severityText: "ERROR",
      body: "Error shutting down OpenTelemetry SDK",
      attributes: { error: (error as Error).message },
    });
    throw error;
  }
}
