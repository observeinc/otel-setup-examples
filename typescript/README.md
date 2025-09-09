# OpenTelemetry TypeScript Setup Examples <!-- omit from toc -->

This repository offers practical examples for instrumenting TypeScript/Node.js applications with OpenTelemetry (OTel). It demonstrates automatic instrumentation using the NodeSDK, which works with any Node.js HTTP framework (Express, Fastify, Koa, etc.), showing how to collect and export traces, metrics, and logs using OTLP exporters.

Whenever performing command line operations using `npm`, `pnpm`, or `yarn`, use the package manager that the repository prefers.
Can identify the preferred package manager by looking at the `package.json` file or the `*-lock.json` file.

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
- [🚀 Serverless Functions Adaptations](#-serverless-functions-adaptations)
  - [1. Export NodeSDK for serverless forceFlush](#1-export-nodesdk-for-serverless-forceflush)
  - [2. Optimize Batch Processing for Serverless](#2-optimize-batch-processing-for-serverless)
  - [3. Serverless Function Handler Pattern](#3-serverless-function-handler-pattern)
  - [4. Dependencies for Serverless Functions](#4-dependencies-for-serverless-functions)
- [📚 References](#-references)
  - [Server](#server)
  - [Client](#client)

## 📦 Dependencies

Install all dependencies using the preferred package manager of the repository.
For server side, install the dependencies from the [`server/package.json`](server/package.json) file.
For client side, install the dependencies from the [`client/package.json`](client/package.json) file.

Always install these packages using the preferred package manager of the repository.
After installing all dependencies, run `{preferred package manager} install` one last time.

**Version Compatibility Notes**:

- Use recent versions of OpenTelemetry packages (v1.9.0+ for API, v0.52.0+ for SDK packages).
- **For working, tested versions**: Check the project's [`server/package.json`](server/package.json) and [`client/package.json`](client/package.json) files which contains a set of compatible versions that have been verified to work together. You can add both the client and server dependencies to your project.
- Some package combinations may require specific version compatibility - check the [OpenTelemetry JavaScript compatibility matrix](https://github.com/open-telemetry/opentelemetry-js#supported-runtimes) if you encounter version conflicts.

**Critical Import Rules**:

- ❌ **DO NOT** import `logs` from `@opentelemetry/api` (not available in versions 1.7.0 and earlier)
- ✅ **DO** use `loggerProvider.getLogger()` directly from your setup module
- ❌ **DO NOT** use `trace.SpanStatusCode` or `trace.active()`
- ✅ **DO** import `SpanStatusCode` and `context` directly from `@opentelemetry/api`

For development, you'll also need:

```bash
npm install --save-dev \ # or `pnpm add -D` or `yarn add -D`
  typescript \
  @types/node
```

## 🔧 Configuration Overview

The example utilizes the OTLP HTTP exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4318`.

## 🧪 Generic OpenTelemetry Setup

The [server/otel-server.ts](server/otel-server.ts) file demonstrates how to set up OpenTelemetry in any Node.js application. It uses the NodeSDK with automatic instrumentation, which works with Express, Fastify, Koa, and other Node.js frameworks without framework-specific configuration.
The [client/otel-client.ts](client/otel-client.ts) file demonstrates how to set up OpenTelemetry in any TypeScript web client. It uses the WebTracerProvider with automatic instrumentation for browser-based applications.

For server side applications, add a similar file as `otel-server.ts`
For client side applications, add a similar file as `otel-client.ts`
Or add both if needed for fullstack applications.

For framework specific details, refer to the framework-specific documentation:

- Next.js: [`nextjs/README.md`](nextjs/README.md)
- Tanstack Start: [`tanstack-start/README.md`](tanstack-start/README.md)

### Key Components

- **Tracing**: Configured using NodeSDK and OTLPTraceExporter.
- **Metrics**: Set up with PeriodicExportingMetricReader and OTLPMetricExporter.
- **Logging**: Implemented via LoggerProvider and OTLPLogExporter. _Note: Import logger instances from your setup module, not from `@opentelemetry/api`._
- **Instrumentation**: Applied automatically using getNodeAutoInstrumentations().
- **Spans**: Import `SpanStatusCode` directly from `@opentelemetry/api` rather than accessing it as a property of the trace API.

### Common API Patterns

**Context Management**: Use `context.active()` to get the active context, not `trace.active()`. The active context is managed by the context API:

```typescript
import { trace, context } from "@opentelemetry/api";
// Correct: context.active()
trace.setSpan(context.active(), span);
```

## 🔧 Common Compilation Error Fixes

### Error: `Module has no exported member 'logs'`

```typescript
// ❌ Wrong
import { logs } from "@opentelemetry/api";
const logger = logs.getLogger("service");

// ✅ Correct
import { loggerProvider } from "./otel";
const logger = loggerProvider.getLogger("service");
```

### Error: `Property 'SpanStatusCode' does not exist on type 'TraceAPI'`

```typescript
// ❌ Wrong
span.setStatus({ code: trace.SpanStatusCode.ERROR });

// ✅ Correct
import { SpanStatusCode } from "@opentelemetry/api";
span.setStatus({ code: SpanStatusCode.ERROR });
```

### Error: `Property 'active' does not exist on type 'TraceAPI'`

```typescript
// ❌ Wrong
trace.setSpan(trace.active(), span);

// ✅ Correct
import { context } from "@opentelemetry/api";
trace.setSpan(context.active(), span);
```

The setup is framework-agnostic and works with any Node.js HTTP framework.

## 📋 Recommended Code Patterns

When implementing OpenTelemetry instrumentation, follow these patterns to ensure TypeScript compatibility:

**Required Imports Pattern**:

```typescript
// Always import these together for full functionality
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { logger, tracer, meter } from "./otel"; // from setup module
```

**Span Management Pattern**:

```typescript
const span = tracer.startSpan("operation_name");
try {
  // Set span in context
  trace.setSpan(context.active(), span);

  // Set status on errors
  span.setStatus({ code: SpanStatusCode.ERROR, message: "error details" });
} finally {
  span.end();
}
```

**Logger Usage Pattern**:

```typescript
// Use logger from setup module, not from @opentelemetry/api
import { SeverityNumber } from "@opentelemetry/api-logs";
logger.emit({
  severityNumber: SeverityNumber.INFO, // INFO, WARN, ERROR
  severityText: "INFO",
  body: "log message",
  attributes: { key: "value" },
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

The setup is configured to export telemetry data using the OTLP HTTP protocol. Ensure that your OpenTelemetry Collector or backend is set up to receive data at the specified endpoint (`http://localhost:4318` by default).

## 🧪 Example Usage

Set the OTLP Endpoint (if different from default):

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://your-otel-collector:4318"
```

### HTTP Server Application

```typescript
import * as http from "http";
import * as os from "os";
import { trace } from "@opentelemetry/api";
import { logger, meter, initOtel, shutdownOtel } from "./otel-server";

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

const server = httpRuntime.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === "/hello") {
      hello(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found\n");
    }
  }
);

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

## 🚀 Serverless Functions Adaptations

Build output note: ensure your TypeScript builds place compiled function JavaScript into the `functions` directory (e.g., via tsconfig `outDir` or netlify.toml). This is independent of OpenTelemetry but required for serverless function runtimes like Netlify Functions.

For serverless functions (e.g., Netlify Functions, AWS Lambda, Vercel Functions), the base server setup works as-is! Just make these small adaptations:

### 1. Export NodeSDK for serverless forceFlush

Ensure your otel module also exports `sdk` (NodeSDK) as in the server example; the handler uses it for `forceFlush()`.


### 2. Optimize Batch Processing for Serverless

```typescript
const loggerProvider = new LoggerProvider({
  resource: resource,
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${otlpEndpoint}/v1/logs`,
        headers: authHeader,
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
```

Note (serverless): runtimes may tear down the container immediately after responding.

- Always force a flush before returning:

```ts
// inside your function handler
try {
  // …your logic…
} finally {
  span.end();
  await sdk.forceFlush().catch(() => {}); // don’t impact user response
}
```

- Optional (traces): make the batch processor a bit more aggressive

```bash
export OTEL_BSP_SCHEDULE_DELAY=1000      # flush sooner (ms)
export OTEL_BSP_EXPORT_TIMEOUT=2000      # don’t wait too long (ms)
```

### 3. Serverless Function Handler Pattern

Why this is needed vs. the regular server otel:
- Regular server examples show SDK init for long-lived processes (e.g., Express).
- Serverless invocations are short-lived; you often need a root span per invocation and must flush before returning to avoid dropped telemetry.
- This pattern shows how to create a per-invocation span, emit structured logs, and force-flush telemetry reliably in serverless runtimes.


```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { initOtel, sdk } from "./otel"; // sdk = NodeSDK from your otel setup
import { logs } from "@opentelemetry/api-logs";
const logger = logs.getLogger("function");
const tracer = trace.getTracer("function");

initOtel();

export async function handler(event: any, context: any) {
  const startTime = Date.now();

  return tracer.startActiveSpan("function.handler", async (span) => {
    try {
      // your logic
      const result = await processRequest(event);

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Function executed successfully",
        attributes: { requestId: context?.awsRequestId, duration: Date.now() - startTime },
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
      span.recordException(error);

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Function execution failed",
        attributes: { error: error?.message, requestId: context?.awsRequestId },
      });

      return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    } finally {
      span.end();
      await sdk.forceFlush().catch(() => {}); // Important for serverless
    }
  });
}
```

### 4. Dependencies for Serverless Functions

Netlify-specific packages:
- `@netlify/functions` (tested: `^4.2.5`)
- `netlify-cli` (devDependency; tested: `^22.4.0`) for local development via `netlify dev`

For the rest of the OpenTelemetry dependencies, refer to the server/package.json in this directory for the canonical list and versions:
- [`server/package.json`](server/package.json)

## 📚 References

- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)

### Server

- [OpenTelemetry Node.js SDK](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-node)
- [OpenTelemetry Auto Instrumentations](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-node)
- [Express.js OpenTelemetry Instrumentation](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-express)
- [Fastify OpenTelemetry Instrumentation](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-fastify)

### Client

- [OpenTelemetry Web Tracer Provider](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-web)
