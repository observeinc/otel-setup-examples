# OpenTelemetry TypeScript Setup Examples

This document offers practical examples for instrumenting TypeScript/Node.js applications with OpenTelemetry (OTel). It demonstrates automatic instrumentation using the NodeSDK, which works with any Node.js HTTP framework (Express, Fastify, Koa, etc.), showing how to collect and export traces, metrics, and logs using OTLP exporters.

Whenever performing command line operations using `npm`, `pnpm`, or `yarn`, use the package manager that the repository prefers.
Can identify the preferred package manager by looking at the `package.json` file or the `*-lock.json` file.

**Version Compatibility Notes**:

- Use recent versions of OpenTelemetry packages (v1.9.0+ for API, v0.52.0+ for SDK packages).

**Critical Import Rules**:

- ❌ **DO NOT** import `logs` from `@opentelemetry/api` (not available in versions 1.7.0 and earlier)
- ✅ **DO** use `loggerProvider.getLogger()` directly from your setup module
- ❌ **DO NOT** use `trace.SpanStatusCode` or `trace.active()`
- ✅ **DO** import `SpanStatusCode` and `context` directly from `@opentelemetry/api`

**Critical Implementation Rules**

- **DO NOT** add additional routes, endpoints, or APIs when instrumenting
- If existing otel instrumentation already has a logger provider with a log processor, add the appropriate log processor
  to their existing processors array as explained in the client/server example files.
- If existing otel instrumentation already has a span processor, add the appropriate span processor and
  trace exporter to their existing spanProcessors array as explained in the client/server example files.
- If existing otel instrumentation already has a metric reader, add the appropriate metric reader to their existing
  metricReaders array. If they use the deprecated metricReader field instead of metricReaders, replace it with the
  metricReaders field and add both readers to the array as explained in the client/server example files.

## 🔧 Configuration Overview

The example utilizes the OTLP HTTP exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4318`.

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
