# Netlify Functions OpenTelemetry Setup <!-- omit from toc -->

This guide provides comprehensive OpenTelemetry instrumentation for Netlify Functions using TypeScript. It demonstrates how to collect and export traces, metrics, and logs from serverless functions using OTLP exporters, with optimizations specific to the Netlify Functions runtime environment.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration Overview](#-configuration-overview)
- [🧪 Netlify Functions OpenTelemetry Setup](#-netlify-functions-opentelemetry-setup)
  - [Key Components](#key-components)
  - [Serverless Optimizations](#serverless-optimizations)
- [📋 Recommended Code Patterns](#-recommended-code-patterns)
  - [Function Instrumentation Pattern](#function-instrumentation-pattern)
  - [Error Handling Pattern](#error-handling-pattern)
  - [Logging Pattern](#logging-pattern)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🧪 Example Usage](#-example-usage)
  - [Basic Instrumented Function](#basic-instrumented-function)
  - [Advanced Function with Custom Spans](#advanced-function-with-custom-spans)
- [🚀 Deployment](#-deployment)
- [📚 References](#-references)

## 📦 Dependencies

Install all dependencies using the preferred package manager of the repository.
The dependencies are listed in the [`package.json`](package.json) file.

Always install these packages using the preferred package manager of the repository.
After installing all dependencies, run `{preferred package manager} install` one last time.

**Version Compatibility Notes**:

- Use recent versions of OpenTelemetry packages (v1.9.0+ for API, v0.203.0+ for SDK packages).
- **For working, tested versions**: Check the project's [`package.json`](package.json) file which contains a set of compatible versions that have been verified to work together.
- Netlify Functions run on AWS Lambda, so ensure compatibility with Node.js runtime versions supported by Netlify.

**Critical Import Rules for Netlify Functions**:

- ❌ **DO NOT** import `logs` from `@opentelemetry/api` (not available in versions 1.7.0 and earlier)
- ✅ **DO** use `logger` from your otel setup module
- ❌ **DO NOT** use `trace.SpanStatusCode` or `trace.active()`
- ✅ **DO** import `SpanStatusCode` and `context` directly from `@opentelemetry/api`

## 🔧 Configuration Overview

The setup utilizes the OTLP HTTP exporter by default, with the endpoint configurable via environment variables. Configuration is optimized for serverless environments with faster export intervals and batch processing.

## 🧪 Netlify Functions OpenTelemetry Setup

The [otel.ts](otel.ts) file demonstrates how to set up OpenTelemetry specifically for Netlify Functions. It includes serverless-optimized configurations and helper functions for common Netlify Function patterns.

### Key Components

- **Tracing**: Configured using NodeSDK and OTLPTraceExporter with serverless optimizations.
- **Metrics**: Set up with PeriodicExportingMetricReader and shorter export intervals (5 seconds).
- **Logging**: Implemented via LoggerProvider and OTLPLogExporter with faster batch processing.
- **Resource Attributes**: Includes Netlify-specific attributes like `cloud.provider: "netlify"` and FaaS attributes.
- **Helper Functions**: Provides `createFunctionSpan()` and `recordFunctionMetrics()` for common patterns.

### Serverless Optimizations

- **Faster Export Intervals**: 5-second metric export interval vs. default 60 seconds
- **Optimized Batch Processing**: Smaller batch sizes and faster timeouts for logs
- **Container Reuse**: Prevents multiple SDK initializations in the same Lambda container
- **Minimal Instrumentations**: Reduces cold start time by avoiding unnecessary auto-instrumentations

## 📋 Recommended Code Patterns

### Function Instrumentation Pattern

```typescript
import { Handler } from "@netlify/functions";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { initOtel, logger, createFunctionSpan, recordFunctionMetrics } from "./otel";

// Initialize OpenTelemetry once
initOtel();

export const handler: Handler = async (event, context) => {
  const startTime = Date.now();
  const functionName = "hello";
  
  // Create function span
  const span = createFunctionSpan(functionName, event, context);
  
  try {
    // Set span in context
    trace.setSpan(context.active(), span);
    
    // Your function logic here
    const result = await processRequest(event);
    
    // Record success metrics
    const duration = Date.now() - startTime;
    recordFunctionMetrics(functionName, 200, duration);
    
    span.setStatus({ code: SpanStatusCode.OK });
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Handle errors
    const duration = Date.now() - startTime;
    recordFunctionMetrics(functionName, 500, duration);
    
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
    
    if (error instanceof Error) {
      span.recordException(error);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  } finally {
    span.end();
  }
};
```

### Error Handling Pattern

```typescript
// Proper error handling with OpenTelemetry
try {
  // Function logic
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  span.recordException(error);
  
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    body: "Function execution failed",
    attributes: {
      "function.name": functionName,
      "error.message": error.message,
      "error.stack": error.stack,
    },
  });
  
  throw error;
}
```

### Logging Pattern

```typescript
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "./otel";

// Structured logging with trace correlation
logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: "INFO",
  body: "Processing request",
  attributes: {
    "function.name": "hello",
    "request.id": context.awsRequestId,
    "user.id": event.headers?.["x-user-id"],
  },
});
```

## ⚙️ Environment Configuration

Set these environment variables in your Netlify site settings:

```bash
# Required
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector:4318
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_bearer_token

# Optional
OTEL_SERVICE_NAME=my-netlify-functions
OTEL_SERVICE_VERSION=1.0.0
```

## 🧪 Example Usage

### Basic Instrumented Function

```typescript
import { Handler } from "@netlify/functions";
import { initOtel, logger, createFunctionSpan, recordFunctionMetrics } from "./otel";
import { SeverityNumber } from "@opentelemetry/api-logs";

// Initialize once
initOtel();

export const handler: Handler = async (event, context) => {
  const startTime = Date.now();
  const span = createFunctionSpan("hello", event, context);
  
  try {
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "Hello function invoked",
      attributes: { requestId: context.awsRequestId },
    });
    
    const duration = Date.now() - startTime;
    recordFunctionMetrics("hello", 200, duration);
    
    return {
      statusCode: 200,
      body: "Hello, World!",
    };
  } finally {
    span.end();
  }
};
```

### Advanced Function with Custom Spans

```typescript
import { Handler } from "@netlify/functions";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { initOtel, tracer, logger, recordFunctionMetrics } from "./otel";

initOtel();

export const handler: Handler = async (event, context) => {
  const startTime = Date.now();
  
  return tracer.startActiveSpan("netlify.function.advanced", async (span) => {
    try {
      // Custom business logic span
      await tracer.startActiveSpan("business.logic", async (businessSpan) => {
        businessSpan.setAttributes({
          "operation.type": "data_processing",
          "input.size": event.body?.length || 0,
        });
        
        // Simulate business logic
        await new Promise(resolve => setTimeout(resolve, 100));
        
        businessSpan.end();
      });
      
      const duration = Date.now() - startTime;
      recordFunctionMetrics("advanced", 200, duration);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Advanced processing complete" }),
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    }
  });
};
```

## 🚀 Deployment

1. **Add the otel.ts file** to your Netlify Functions project
2. **Install dependencies** from the package.json
3. **Set environment variables** in Netlify site settings
4. **Import and initialize** in each function file
5. **Deploy** using Netlify CLI or Git integration

## 📚 References

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [AWS Lambda OpenTelemetry Layer](https://aws-otel.github.io/docs/getting-started/lambda) (Netlify Functions run on Lambda)
