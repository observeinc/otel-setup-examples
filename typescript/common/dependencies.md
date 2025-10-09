## OpenTelemetry TypeScript Dependencies

Make sure to install all dependencies using appropriate package manager commands
i.e `pnpm add`, `yarn add`, or `npm install`

### Development Dependencies

**_Always install these development dependencies prior to installing any other dependencies_**.
Make sure to install with the appropriate flag to save them as dev dependencies
i.e `pnpm add -D`, `yarn add -D`, or `npm install --save-dev`

- "typescript"
- "@types/node"

### Server Side Dependencies

Install these dependencies when instrumenting a server side application.

- "@opentelemetry/api"
- "@opentelemetry/api-logs"
- "@opentelemetry/auto-instrumentations-node"
- "@opentelemetry/exporter-logs-otlp-http"
- "@opentelemetry/exporter-metrics-otlp-proto"
- "@opentelemetry/exporter-trace-otlp-http"
- "@opentelemetry/resources"
- "@opentelemetry/sdk-logs"
- "@opentelemetry/sdk-metrics"
- "@opentelemetry/sdk-node"
- "@opentelemetry/semantic-conventions"

### Client Side Dependencies

Install these dependencies when instrumenting a client side application.

- "@opentelemetry/api"
- "@opentelemetry/api-logs"
- "@opentelemetry/exporter-logs-otlp-http"
- "@opentelemetry/exporter-trace-otlp-http"
- "@opentelemetry/instrumentation"
- "@opentelemetry/instrumentation-document-load"
- "@opentelemetry/instrumentation-fetch"
- "@opentelemetry/instrumentation-xml-http-request"
- "@opentelemetry/resources"
- "@opentelemetry/sdk-logs"
- "@opentelemetry/sdk-trace-web"
- "@opentelemetry/semantic-conventions"
