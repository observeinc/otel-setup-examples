import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// Configuration - Netlify Functions specific
const serviceName = process.env.OTEL_SERVICE_NAME ?? "netlify-functions";
const serviceVersion = process.env.OTEL_SERVICE_VERSION ?? "1.0.0";

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
const otlpEndpointBearerToken = process.env.OTEL_EXPORTER_OTLP_BEARER_TOKEN;

const authHeader = otlpEndpointBearerToken
  ? { Authorization: `Bearer ${otlpEndpointBearerToken}` }
  : null;

// Create resource with Netlify-specific attributes
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion,
  "cloud.provider": "netlify",
  "faas.name": serviceName,
  "faas.version": serviceVersion,
});

// Initialize OpenTelemetry SDK with Netlify optimizations
export const sdk = new NodeSDK({
  resource: resource,
  traceExporter: new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
    headers: {
      ...authHeader,
      "x-observe-target-package": "Tracing",
    },
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${otlpEndpoint}/v1/metrics`,
      headers: {
        ...authHeader,
        "x-observe-target-package": "Metrics",
      },
    }),
    // Shorter export interval for serverless functions
    exportIntervalMillis: 5000,
  }),
  // Minimal instrumentations for Netlify Functions
  instrumentations: [],
});

// Initialize Logger Provider
const loggerProvider = new LoggerProvider({
  resource: resource,
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${otlpEndpoint}/v1/logs`,
        headers: {
          ...authHeader,
          "x-observe-target-package": "Logs",
        },
      }),
      {
        // Faster batch processing for serverless
        maxExportBatchSize: 100,
        exportTimeoutMillis: 2000,
        scheduledDelayMillis: 1000,
      }
    ),
  ],
});

// Global instances for reuse across function invocations
let isInitialized = false;
export let logger: ReturnType<typeof logs.getLogger>;
export let tracer: ReturnType<typeof import("@opentelemetry/api").trace.getTracer>;
export let meter: ReturnType<typeof import("@opentelemetry/api").metrics.getMeter>;

// Initialize OpenTelemetry (optimized for Netlify Functions)
export function initOtel() {
  // Prevent multiple initializations in the same Lambda container
  if (isInitialized) {
    return { logger, tracer, meter };
  }

  try {
    logs.setGlobalLoggerProvider(loggerProvider);
    sdk.start();

    // Initialize global instances
    const { trace, metrics } = require("@opentelemetry/api");
    logger = logs.getLogger(serviceName);
    tracer = trace.getTracer(serviceName, serviceVersion);
    meter = metrics.getMeter(serviceName, serviceVersion);

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "OpenTelemetry SDK started for Netlify Functions",
      attributes: {
        "netlify.function.name": process.env.AWS_LAMBDA_FUNCTION_NAME || "unknown",
        "netlify.function.version": process.env.AWS_LAMBDA_FUNCTION_VERSION || "unknown",
      },
    });

    isInitialized = true;
    return { logger, tracer, meter };
  } catch (error) {
    console.error("Error starting OpenTelemetry SDK:", error);
    throw error;
  }
}

// Graceful shutdown (important for Netlify Functions)
export function shutdownOtel(): Promise<void> {
  return new Promise((resolve) => {
    try {
      sdk.shutdown().then(() => {
        logger?.emit({
          severityNumber: SeverityNumber.INFO,
          severityText: "INFO",
          body: "OpenTelemetry SDK shut down successfully",
        });
        resolve();
      });
    } catch (error) {
      console.error("Error shutting down OpenTelemetry SDK:", error);
      resolve();
    }
  });
}

// Helper function to create spans for Netlify Functions
export function createFunctionSpan(
  functionName: string,
  event: any,
  context: any
) {
  const span = tracer.startSpan(`netlify.function.${functionName}`, {
    kind: 1, // SERVER
    attributes: {
      "faas.execution": context.awsRequestId || "unknown",
      "faas.id": context.functionName || functionName,
      "http.method": event.httpMethod || "unknown",
      "http.route": event.path || "unknown",
      "user_agent.original": event.headers?.["user-agent"] || "unknown",
      "client.address":
        event.headers?.["client-ip"] ||
        event.headers?.["x-forwarded-for"] ||
        "unknown",
    },
  });

  return span;
}

// Helper function to record function metrics
export function recordFunctionMetrics(
  functionName: string,
  statusCode: number,
  duration: number
) {
  const requestCounter = meter.createCounter("netlify.function.requests", {
    description: "Count of Netlify function requests",
  });

  const requestDuration = meter.createHistogram("netlify.function.duration", {
    description: "Duration of Netlify function requests in milliseconds",
    unit: "ms",
  });

  requestCounter.add(1, {
    "function.name": functionName,
    "http.status_code": statusCode.toString(),
    "status_class": `${Math.floor(statusCode / 100)}xx`,
  });

  requestDuration.record(duration, {
    "function.name": functionName,
    "http.status_code": statusCode.toString(),
    "status_class": `${Math.floor(statusCode / 100)}xx`,
  });
}