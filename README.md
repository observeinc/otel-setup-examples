# General OpenTelemetry Instrumentation Instructions

- **Use auto-instrumentation libraries** do not implement additional custom instrumentation when possible.

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
