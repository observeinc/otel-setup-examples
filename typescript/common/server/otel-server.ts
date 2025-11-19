import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// Configuration
const serviceName = "example-service"; // replace with your service name

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const otlpEndpointBearerToken = process.env.OTEL_EXPORTER_OTLP_BEARER_TOKEN;

const authHeader = otlpEndpointBearerToken
  ? { Authorization: `Bearer ${otlpEndpointBearerToken}` }
  : {};

// Create resource
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
});

// Only initialize SDK and providers if endpoint is configured
let sdk: NodeSDK | undefined;
let loggerProvider: LoggerProvider | undefined;

if (otlpEndpoint) {
  // Initialize OpenTelemetry SDK
  sdk = new NodeSDK({
    resource,
    /* DO NOT include this comment block when copying the code in this file, just take into account the instructions
      <INSTRUCTION>
        If existing otel instrumentation already has a span processor, add the following span processor and
        trace exporter to their existing spanProcessors array.
      </INSTRUCTION>
    */
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
          headers: {
            ...authHeader,
            "x-observe-target-package": "Tracing",
          },
        })
      ),
    ],
    /* DO NOT include this comment block when copying the code in this file, just take into account the instructions
      <INSTRUCTION>
        If existing otel instrumentation already has a metric reader, add the following metric reader to their existing
        metricReaders array. If they use the deprecated metricReader field instead of metricReaders, replace it with the
        metricReaders field and add both readers to the array.
      </INSTRUCTION>
    */
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${otlpEndpoint}/v1/metrics`,
          headers: {
            ...authHeader,
            "x-observe-target-package": "Metrics",
            "Content-Type": "application/x-protobuf",
          },
        }),
      }),
    ],
    instrumentations: [getNodeAutoInstrumentations()],
  });

  // Initialize Logger Provider
  loggerProvider = new LoggerProvider({
    resource,
    /* DO NOT include this comment block when copying the code in this file, just take into account the instructions
      <INSTRUCTION>
        If existing otel instrumentation already has a logger provider with a log processor, add the following log
        processor to their existing processors array.
      </INSTRUCTION>
    */
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${otlpEndpoint}/v1/logs`,
          headers: {
            ...authHeader,
            "x-observe-target-package": "Logs",
          },
        })
      ),
    ],
  });
}

// Export the SDK (may be undefined if not configured)
export { sdk };

// Initialize OpenTelemetry and return initialized components
export function initOtel() {
  if (!otlpEndpoint) {
    console.warn("OpenTelemetry disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set");
    return;
  }

  if (!sdk || !loggerProvider) {
    console.warn("OpenTelemetry SDK not initialized");
    return;
  }

  try {
    logs.setGlobalLoggerProvider(loggerProvider);
    sdk.start();

    const logger = logs.getLogger(serviceName);
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "OpenTelemetry SDK started",
    });
  } catch (error) {
    console.error(
      "Error starting OpenTelemetry SDK:",
      (error as Error).message
    );
    // Don't throw the error - allow the app to continue without telemetry
  }
}

// Graceful shutdown
export function shutdownOtel(): void {
  if (!sdk) {
    return; // Nothing to shutdown if SDK wasn't initialized
  }

  try {
    sdk.shutdown();
  } catch (error) {
    console.error(
      "Error shutting down OpenTelemetry SDK:",
      (error as Error).message
    );
    // Don't throw the error during shutdown
  }
}
