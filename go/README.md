# OpenTelemetry Go Setup Examples <!-- omit from toc -->

This repository offers practical examples for instrumenting Go applications with OpenTelemetry (OTel). It demonstrates how to set up comprehensive observability with traces, metrics, and logs using OTLP exporters, along with HTTP instrumentation that works with any Go HTTP framework or the standard library.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration Overview](#-configuration-overview)
- [🧪 Generic OpenTelemetry Setup](#-generic-opentelemetry-setup)
  - [Key Components](#key-components)
  - [Common Usage Patterns](#common-usage-patterns)
- [🔧 Common Implementation Notes](#-common-implementation-notes)
  - [Structured Logging with slog](#structured-logging-with-slog)
  - [HTTP Instrumentation](#http-instrumentation)
  - [Resource Configuration](#resource-configuration)
- [🔧 Common Build Issues](#-common-build-issues)
  - [Unused Import Errors](#unused-import-errors)
  - [Version Conflicts](#version-conflicts)
  - [Module Resolution Issues](#module-resolution-issues)
- [📋 Recommended Code Patterns](#-recommended-code-patterns)
- [⚙️ Automatic vs Manual Instrumentation](#️-automatic-vs-manual-instrumentation)
  - [Setup Steps](#setup-steps)
- [📈 Exporting Telemetry Data](#-exporting-telemetry-data)
- [🧪 Example Usage](#-example-usage)
  - [Setup Steps](#setup-steps-1)
  - [HTTP Server Application](#http-server-application)
- [📚 References](#-references)


## 📦 Dependencies

Ensure the following packages are installed in your `go.mod`:

```bash
go get \
  go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk \
  go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp \
  go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp \
  go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp \
  go.opentelemetry.io/otel/sdk/log \
  go.opentelemetry.io/otel/sdk/metric \
  go.opentelemetry.io/otel/log \
  go.opentelemetry.io/otel/metric \
  go.opentelemetry.io/otel/trace \
  go.opentelemetry.io/contrib/bridges/otelslog
```

For (framework-specific) HTTP instrumentation, add:

```bash
# For net/http
go get go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp

# For Gin
go get github.com/gin-gonic/gin \
  go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin

# For Echo
go get github.com/labstack/echo/v4 \
  go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho
```

**Version Compatibility Notes**:
- Use Go 1.21+ for best OpenTelemetry support
- OpenTelemetry Go packages use different versioning schemes:
  - Core packages (otel, sdk) use v1.x.x versioning
  - Log exporters use v0.x.x versioning (e.g., otlploghttp v0.14.0)
  - Contrib packages may have different version cycles
- **For working, tested versions**: Check the project's [`go.mod`](go.mod) file which contains a set of compatible versions that have been verified to work together
- Check the [OpenTelemetry Go Compatibility Matrix](https://github.com/open-telemetry/opentelemetry-go#compatibility) for supported version combinations
- Refer to [OpenTelemetry Go Releases](https://github.com/open-telemetry/opentelemetry-go/releases) for the latest stable versions
- The `otelslog` bridge requires Go 1.21+ for structured logging support

## 🔧 Configuration Overview

The example utilizes the OTLP HTTP exporter by default, with the endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. If not set, it defaults to `http://localhost:4318`.

### Required Environment Variables

To use with Observe or other OTLP-compatible backends, set these two environment variables:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://185003257558.collect.observeinc.com/v2/otel
export OTEL_EXPORTER_OTLP_BEARER_TOKEN=<your-token-here>
```

The implementation automatically includes the required headers:
- `Authorization: Bearer <token>` (when `OTEL_EXPORTER_OTLP_BEARER_TOKEN` is set)
- `x-observe-target-package: Tracing|Metrics|Logs` (depending on the telemetry type)

## 🧪 Generic OpenTelemetry Setup

The [otel_setup.go](otel_setup.go) file demonstrates how to set up OpenTelemetry in any Go application. It provides a comprehensive setup that works with the standard library's `net/http` package and any Go web framework.

### Key Components

- **Tracing**: Configured using TracerProvider and OTLP HTTP TraceExporter with batch processing.
- **Metrics**: Set up with MeterProvider and OTLP HTTP MetricExporter using periodic export.
- **Logging**: Implemented via LoggerProvider, OTLP HTTP LogExporter, and structured logging with `slog`.
- **Authentication**: Automatic Bearer token authentication when `OTEL_EXPORTER_OTLP_BEARER_TOKEN` is provided.
- **Headers**: Includes required `x-observe-target-package` headers for proper telemetry routing.
- **Instrumentation**: HTTP instrumentation via `otelhttp` middleware that works with any HTTP handler.
- **Resource**: Proper service identification using semantic conventions.

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://185003257558.collect.observeinc.com/v2/otel
export OTEL_EXPORTER_OTLP_BEARER_TOKEN=<your-token-here>
```

### 2. Initialize OpenTelemetry

```go
package main

import (
    "log"
    // ... other imports
)

func main() {
    // Initialize OpenTelemetry - reads environment variables automatically
    cleanup := setupInstrumentation("my-service")
    defer cleanup()

    // Get telemetry instances
    tracer := GetTracer()
    meter := GetMeter()
    logger := GetLogger()

    // Use them in your application...
}
```

### 3. Use Telemetry in Your Code

```go
// Create spans for tracing
ctx, span := tracer.Start(ctx, "operation_name")
defer span.End()

// Add metrics
counter, _ := meter.Int64Counter("requests_total")
counter.Add(ctx, 1)

// Structured logging
logger.InfoContext(ctx, "Operation completed", "result", "success")
```

See the usage examples above for implementation details.

### Common Usage Patterns

**Global Variables Pattern**:
```go
var (
    appTracer trace.Tracer
    appMeter  metric.Meter
    appLogger *slog.Logger
)
```

**Setup Function Pattern**:
```go
func setupInstrumentation() func() {
    // Setup code...
    return shutdownFunc // Return cleanup function
}
```

## 🔧 Common Implementation Notes

### Structured Logging with slog

Go's OpenTelemetry integration leverages the standard `log/slog` package with the `otelslog` bridge:
- Use `otelslog.NewHandler()` to create an OpenTelemetry-aware slog handler
- Logs automatically include trace correlation when spans are active
- Standard slog methods (`Info`, `Error`, `Warn`) work seamlessly

### HTTP Instrumentation

The `otelhttp` package provides automatic HTTP instrumentation:
- Wrap handlers with `otelhttp.NewHandler()` for automatic span creation
- Works with standard library and any framework that uses `http.Handler`
- Automatically captures HTTP method, status code, and timing metrics

### Resource Configuration

Proper resource configuration is crucial for service identification:
- Use semantic conventions from `go.opentelemetry.io/otel/semconv`
- Include service name, version, and environment information
- Resources are shared across traces, metrics, and logs

## 🔧 Common Build Issues

### Unused Import Errors

Go strictly enforces that all imports must be used. Remove any unused imports:

```go
// ❌ Wrong - unused import
import (
    "context"  // unused in this file
    "fmt"
)

// ✅ Correct - only import what you use
import (
    "fmt"
)
```

### Version Conflicts

If you encounter module version errors like "unknown revision" or "invalid version":

1. **Use tested version combinations** from the Dependencies section above
2. **Verify compatibility online**:
   - Check [OpenTelemetry Go Compatibility Matrix](https://github.com/open-telemetry/opentelemetry-go#compatibility) for supported version combinations
   - Browse [OpenTelemetry Go Releases](https://github.com/open-telemetry/opentelemetry-go/releases) to find the latest stable versions
   - Review [OpenTelemetry Go Contrib Releases](https://github.com/open-telemetry/opentelemetry-go-contrib/releases) for contrib package versions
3. **Cross-reference versions** between core packages and exporters to ensure compatibility

### Module Resolution Issues

Ensure your `go.mod` includes all required dependencies:

1. **Reference working examples**: Use the complete dependency list from the Dependencies section above
2. **Verify module paths**: Check [pkg.go.dev](https://pkg.go.dev) to confirm correct module import paths
3. **Validate versions exist**: Browse the GitHub releases pages linked above to confirm version numbers are valid

## 📋 Recommended Code Patterns

When implementing OpenTelemetry instrumentation, follow these patterns:

**Initialization Pattern**:
```go
func main() {
    // Initialize OpenTelemetry first
    shutdown := setupInstrumentation()
    defer shutdown()

    // Application code follows...
}
```

**HTTP Handler Pattern**:

*** For net/http ***

```go
// Wrap handlers for automatic instrumentation
handler := otelhttp.NewHandler(http.HandlerFunc(yourHandler), "HandlerName")
mux.Handle("/path", handler)
```

*** For Echo ***
```go
e := echo.New()
e.Use(otelecho.Middleware("echo-service"))
e.GET("/", yourHandler)
```

*** For Gin ***
```go
r := gin.Default()
r.Use(otelgin.Middleware("gin-service"))
e.GET("/", yourHandler)
```


**Manual Span Pattern**:
```go
ctx, span := appTracer.Start(ctx, "operation_name")
defer span.End()

// Add attributes
span.SetAttributes(attribute.String("key", "value"))

// Handle errors
if err != nil {
    span.RecordError(err)
    span.SetStatus(codes.Error, err.Error())
}
```

**Metrics Pattern**:
```go
// Create instruments once, use many times
counter, _ := appMeter.Int64Counter("requests_total")
histogram, _ := appMeter.Float64Histogram("request_duration")

// Use in handlers
counter.Add(ctx, 1, metric.WithAttributes(attribute.String("method", "GET")))
```

## ⚙️ Automatic vs Manual Instrumentation

Go's OpenTelemetry ecosystem primarily focuses on manual instrumentation with helper libraries, following Go's explicit philosophy.

### Setup Steps

1. **Initialize your Go module** (if not already done):

```bash
go mod init your-service-name
```

2. **Install core OpenTelemetry dependencies**:

```bash
go get go.opentelemetry.io/otel go.opentelemetry.io/otel/sdk
```

3. **Add OTLP exporters**:

```bash
go get go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp \
       go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp \
       go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp
```

4. **Add instrumentation libraries as needed**:

For HTTP applications:
```bash
go get go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
```

For structured logging:
```bash
go get go.opentelemetry.io/contrib/bridges/otelslog
```

5. **Initialize OpenTelemetry in your application**:

```go
func main() {
    // Initialize OpenTelemetry first
    shutdown := setupInstrumentation("your-service-name")
    defer shutdown()

    // Your application code follows...
}
```

**Automatic Features Available**:
- HTTP request/response instrumentation via `otelhttp`
- Database instrumentation via contrib packages (`otelsql`, `otelgorm`)
- gRPC instrumentation via contrib packages
- Popular library instrumentation through the contrib ecosystem

**Manual Setup Required**:
- Application-specific spans and metrics
- Custom attributes and events
- Business logic instrumentation

This approach maintains Go's explicit nature while providing comprehensive observability.

## 📈 Exporting Telemetry Data

The setup is configured to export telemetry data using the OTLP HTTP protocol. Ensure that your OpenTelemetry Collector or backend is set up to receive data at the specified endpoint (`http://localhost:4318` by default).

## 🧪 Example Usage

### Setup Steps

1. **Set the OTLP Endpoint** (if different from default):
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="your-otel-collector:4317"
```

2. **Create your application** with OpenTelemetry setup:

### HTTP Server Application
```go
package main

import (
    "fmt"
    "net/http"
    "os"

    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func hello(w http.ResponseWriter, req *http.Request) {
    // Structured logging with automatic trace correlation
    appLogger.Info("Hello endpoint accessed")

    // Manual metrics
    requestCounter.Add(req.Context(), 1)

    fmt.Fprintf(w, "Hello, OpenTelemetry & Go!")
}

func main() {
    // Initialize OpenTelemetry
    shutdown := setupInstrumentation()
    defer shutdown()

    appLogger.Info("Starting HTTP server with OpenTelemetry")

    mux := http.NewServeMux()

    // Instrumented handler
    handler := otelhttp.NewHandler(http.HandlerFunc(hello), "HelloHandler")
    mux.Handle("/hello", handler)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8090"
    }

    http.ListenAndServe(":"+port, mux)
}
```

3. **Build and run your application**:

```bash
go mod tidy
go run *.go
```

4. **Test the instrumentation**:

```bash
curl http://localhost:8090/hello
```

The application will automatically:
- Generate traces for HTTP requests
- Export metrics about request counts and durations
- Send structured logs with trace correlation
- Export all telemetry data to your OTLP endpoint

## 📚 References

- [OpenTelemetry Go Documentation](https://opentelemetry.io/docs/instrumentation/go/)
- [OpenTelemetry Go SDK](https://github.com/open-telemetry/opentelemetry-go)
- [OpenTelemetry Go Contrib](https://github.com/open-telemetry/opentelemetry-go-contrib)
- [HTTP Instrumentation](https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp)
- [Structured Logging Bridge](https://pkg.go.dev/go.opentelemetry.io/contrib/bridges/otelslog)
