# General OpenTelemetry Instrumentation Instructions

### Tracing Implementation

- **Use auto-instrumentation libraries first**: Prefer framework-specific middleware and wrappers over manual span creation
- Create spans for all service boundaries: HTTP handlers, gRPC methods, database operations, external API calls
- Use built-in instrumentation (e.g., HTTP middleware, database drivers) when available
- Only create manual spans when auto-instrumentation isn't available
- Apply OpenTelemetry semantic conventions for span attributes
- Record key attributes: request parameters, user IDs, error messages, response codes

### Logging Integration

- Do not replace/reset the root logger. Python: avoid logging.basicConfig(); attach handlers to your app logger and keep propagate=True.
- Ensure logs flow through the OpenTelemetry logging handler/provider configured in the example (do not bypass it).
- Inject trace_id and span_id into logs for correlation (use the example’s logging instrumentation).

### Metrics Collection

- Implement key application metrics: request latency, throughput, error rates, resource usage
- Use OpenTelemetry meter provider with Prometheus exporter
- Apply consistent metric naming and avoid high cardinality labels
- Monitor critical business operations and system health

## Implementation Guidelines

### Minimal Code Changes Philosophy

- **Preserve original code functionality**: Do not change the behavior or output of the application
- **Preserve original code instrumentation**: You can add additional logging, metrics, and tracing but do not remove or break existing logging, metrics, and tracing. Favor adding an additional exporter rather than replacing an existing one.
- **Preserve original code structure**: Do not transform simple, working code into complex patterns
- **Avoid unnecessary architectural changes**: Don't introduce servers, goroutines/async, signal handling, or graceful shutdown unless they already exist
- **Use built-in instrumentation libraries**: Prefer existing middleware/wrappers (e.g., auto-instrumenting HTTP handlers) over manual span creation
- **One-line additions where possible**: Aim to add observability with minimal lines of code per function
- **Favor composition over modification**: Wrap existing handlers/functions rather than rewriting their internals

### Code Quality

- Keep instrumentation code minimal and non-intrusive
- Abstract setup logic into clean, reusable functions
- Minimize the amount of new code added to existing functions
- Ensure instrumentation overhead is negligible
- **Preserve simplicity**: If the original code is simple and direct, keep it that way

### Context Propagation

- Attach context to all spans, logs, and metrics
- Ensure trace context flows through all service calls
- Use proper context cancellation and timeout handling

### Error Handling

- Instrument error paths without changing error semantics
- Record errors in spans with appropriate status codes
- Log errors with full context and trace correlation
