// Development dependencies: Always install these first. Make sure to install with the appropriate flag to save them as dev dependencies i.e `pnpm add -D`, `yarn add -D`, or `npm install --save-dev`
export const devDependencies = ["typescript", "@types/node"];

// Server side dependencies: Install these for server side instrumentation. Make sure to install them with the appropriate package manager commands i.e `pnpm add`, `yarn add`, or `npm install`
export const serverSideDependencies = [
  "@opentelemetry/api",
  "@opentelemetry/api-logs",
  "@opentelemetry/auto-instrumentations-node",
  "@opentelemetry/exporter-logs-otlp-http",
  "@opentelemetry/exporter-metrics-otlp-proto",
  "@opentelemetry/exporter-trace-otlp-http",
  "@opentelemetry/resources",
  "@opentelemetry/sdk-logs",
  "@opentelemetry/sdk-metrics",
  "@opentelemetry/sdk-node",
  "@opentelemetry/semantic-conventions",
];

// Client side dependencies: Install these for client side instrumentation. Make sure to install them with the appropriate package manager commands i.e `pnpm add`, `yarn add`, or `npm install`
export const clientSideDependencies = [
  "@opentelemetry/api",
  "@opentelemetry/api-logs",
  "@opentelemetry/exporter-logs-otlp-http",
  "@opentelemetry/exporter-trace-otlp-http",
  "@opentelemetry/instrumentation",
  "@opentelemetry/instrumentation-document-load",
  "@opentelemetry/instrumentation-fetch",
  "@opentelemetry/instrumentation-xml-http-request",
  "@opentelemetry/resources",
  "@opentelemetry/sdk-logs",
  "@opentelemetry/sdk-trace-web",
  "@opentelemetry/semantic-conventions",
];
