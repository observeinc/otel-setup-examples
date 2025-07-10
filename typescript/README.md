# OpenTelemetry TypeScript Setup Examples <!-- omit from toc -->

This repository offers practical examples for instrumenting TypeScript/Node.js applications with OpenTelemetry (OTel). It demonstrates automatic instrumentation using the NodeSDK, which works with any Node.js HTTP framework (Express, Fastify, Koa, etc.), showing how to collect and export traces, metrics, and logs using OTLP exporters.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration Overview](#-configuration-overview)
- [🧪 Generic OpenTelemetry Setup](#-generic-opentelemetry-setup)
  - [Key Components](#key-components)
  - [Common API Patterns](#common-api-patterns)
- [🔧 Common Compilation Error Fixes](#-common-compilation-error-fixes)
  - [Error: `Module has no exported member 'logs'`](#error-module-has-no-exported-member-logs)
  - [Error: `Property 'SpanStatusCode' does not exist on type 'TraceAPI'`](#error-property-spanstatuscode-does-not-exist-on-type-traceapi)
  - [Error: `Property 'active' does not exist on type 'TraceAPI'`](#error-property-active-does-not-exist-on-type-traceapi)
- [📋 Recommended Code Patterns](#-recommended-code-patterns)
- [⚙️ Automatic Instrumentation](#️-automatic-instrumentation)
- [📈 Exporting Telemetry Data](#-exporting-telemetry-data)
- [🧪 Example Usage](#-example-usage)
  - [HTTP Server Application](#http-server-application)
- [📚 References](#-references)


## 📦 Dependencies

Ensure the following packages are installed:

```bash
npm install \
  @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-grpc \
  @opentelemetry/exporter-logs-otlp-grpc \
  @opentelemetry/exporter-metrics-otlp-grpc \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/sdk-logs \
  @grpc/grpc-js
```

**Version Compatibility Notes**:
- Use recent versions of OpenTelemetry packages (v1.9.0+ for API, v0.52.0+ for SDK packages).
- Some package combinations may require specific version compatibility - check the [OpenTelemetry JavaScript compatibility matrix](https://github.com/open-telemetry/opentelemetry-js#supported-runtimes) if you encounter version conflicts.

**Critical Import Rules**:
- ❌ **DO NOT** import `logs` from `@opentelemetry/api` (not available in versions 1.7.0 and earlier)
- ✅ **DO** use `loggerProvider.getLogger()` directly from your setup module
- ❌ **DO NOT** use `trace.SpanStatusCode` or `trace.active()`
- ✅ **DO** import `SpanStatusCode` and `context` directly from `@opentelemetry/api`

For development, you'll also need:

```bash
npm install --save-dev \
  typescript \
  @types/node
```

## 🔧 Configuration Overview

The example utilizes the OTLP gRPC exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4317`.

## 🧪 Generic OpenTelemetry Setup

The [otel_setup.ts](otel_setup.ts) file demonstrates how to set up OpenTelemetry in any Node.js application. It uses the NodeSDK with automatic instrumentation, which works with Express, Fastify, Koa, and other Node.js frameworks without framework-specific configuration.

### Key Components

- **Tracing**: Configured using NodeSDK and OTLPTraceExporter.
- **Metrics**: Set up with PeriodicExportingMetricReader and OTLPMetricExporter.
- **Logging**: Implemented via LoggerProvider and OTLPLogExporter. *Note: Import logger instances from your setup module, not from `@opentelemetry/api`.*
- **Instrumentation**: Applied automatically using getNodeAutoInstrumentations().
- **Spans**: Import `SpanStatusCode` directly from `@opentelemetry/api` rather than accessing it as a property of the trace API.

### Common API Patterns

**Context Management**: Use `context.active()` to get the active context, not `trace.active()`. The active context is managed by the context API:
```typescript
import { trace, context } from '@opentelemetry/api';
// Correct: context.active()
trace.setSpan(context.active(), span);
```

## 🔧 Common Compilation Error Fixes

### Error: `Module has no exported member 'logs'`
```typescript
// ❌ Wrong
import { logs } from '@opentelemetry/api';
const logger = logs.getLogger('service');

// ✅ Correct
import { loggerProvider } from './otel_setup';
const logger = loggerProvider.getLogger('service');
```

### Error: `Property 'SpanStatusCode' does not exist on type 'TraceAPI'`
```typescript
// ❌ Wrong
span.setStatus({ code: trace.SpanStatusCode.ERROR });

// ✅ Correct
import { SpanStatusCode } from '@opentelemetry/api';
span.setStatus({ code: SpanStatusCode.ERROR });
```

### Error: `Property 'active' does not exist on type 'TraceAPI'`
```typescript
// ❌ Wrong
trace.setSpan(trace.active(), span);

// ✅ Correct
import { context } from '@opentelemetry/api';
trace.setSpan(context.active(), span);
```

The setup is framework-agnostic and works with any Node.js HTTP framework.

## 📋 Recommended Code Patterns

When implementing OpenTelemetry instrumentation, follow these patterns to ensure TypeScript compatibility:

**Required Imports Pattern**:
```typescript
// Always import these together for full functionality
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { logger, tracer, meter } from './otel_setup'; // from setup module
```

**Span Management Pattern**:
```typescript
const span = tracer.startSpan('operation_name');
try {
  // Set span in context
  trace.setSpan(context.active(), span);

  // Set status on errors
  span.setStatus({ code: SpanStatusCode.ERROR, message: 'error details' });
} finally {
  span.end();
}
```

**Logger Usage Pattern**:
```typescript
// Use logger from setup module, not from @opentelemetry/api
logger.emit({
  severityNumber: 9, // INFO=9, WARN=13, ERROR=17
  severityText: 'INFO',
  body: 'log message',
  attributes: { key: 'value' }
});
```

## ⚙️ Automatic Instrumentation

OpenTelemetry for Node.js supports comprehensive automatic instrumentation through the `@opentelemetry/auto-instrumentations-node` package, which automatically detects and instruments supported libraries and frameworks without code modifications.

The automatic instrumentation detects and instruments:
- HTTP/HTTPS requests and responses
- Express.js, Fastify, Koa, and other web frameworks
- Database connections (MySQL, PostgreSQL, MongoDB, etc.)
- Redis operations
- And many more Node.js libraries

## 📈 Exporting Telemetry Data

The setup is configured to export telemetry data using the OTLP gRPC protocol. Ensure that your OpenTelemetry Collector or backend is set up to receive data at the specified endpoint (`http://localhost:4317` by default).

## 🧪 Example Usage

Set the OTLP Endpoint (if different from default):
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://your-otel-collector:4317"
```

### HTTP Server Application
```typescript
import * as http from "http";
import * as os from "os";
import { trace } from "@opentelemetry/api";
import { logger, meter, initOtel, shutdownOtel } from "./otel_setup";

// CRITICAL: Initialize OpenTelemetry FIRST
initOtel();

// Re-require modules after OpenTelemetry initialization for auto-instrumentation
const httpRuntime = require("http");
const osRuntime = require("os");

// Initialize metrics
const requestCounter = meter.createCounter("hello_request_count", {
  description: "Total number of requests to the hello service",
});

function hello(req: http.IncomingMessage, res: http.ServerResponse): void {
  const hostname = osRuntime.hostname();
  const span = trace.getActiveSpan();

  if (span) {
    span.setAttributes({ hostname });
  }

  logger.emit({
    severityNumber: 9, // INFO
    severityText: "INFO",
    body: "Hello endpoint accessed",
    attributes: { hostname },
  });

  requestCounter.add(1, { status: "success" });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: `Hello from ${hostname}` }));
}

const server = httpRuntime.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.url === "/hello") {
    hello(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found\n");
  }
});

server.listen(8090, () => {
  console.log("Server running at http://localhost:8090/");
});

// Graceful shutdown
process.on("SIGTERM", () => shutdownOtel());
process.on("SIGINT", () => shutdownOtel());
```

```bash
npx tsc && node http_server.js
```

## 📚 References

- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [OpenTelemetry Node.js SDK](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-node)
- [OpenTelemetry Auto Instrumentations](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-node)
- [Express.js OpenTelemetry Instrumentation](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-express)
- [Fastify OpenTelemetry Instrumentation](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-fastify)
