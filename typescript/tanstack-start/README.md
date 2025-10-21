# Tanstack Start Application Example

## Server-Side Instrumentation

Create an `instrumentation.ts` (or `.js` if the project is not using typescript) file inside of the your Tanstack Start project. Place this file:

- In the root of your project (same level as `vite.config.js`)
- **NOT** inside the `src` or `app` directory

- If the project is already instrumented on the server side i.e the `instrumentation.ts` file already exists, already
  has a `register` function, and is already instrumented with opentelemetry via the NodeSDK, you SHOULD NOT create
  a new `instrumentation.ts` file or a new `otel-server.ts` file. Simply add additional processors, span processors, and
  readers to the existing ones as detailed in the server example file.

- If the project is already instrumented on the client side with opentelemetry via a WebTracerProvider, LoggerProvider, and
  MeterProvider, you SHOULD NOT create a new `otel-client.ts` file. Simply add additional processors, span processors,
  and readers to the existing ones as detailed in the client example file.

### Create OpenTelemetry Configuration Files

Copy the `otel-server.ts` and `otel-client.ts` example files and place these inside of the `src/lib/` or `app/lib/`
folder (create `lib/` if it doesn't exist already) in your Tanstack Start project. (Unless already instrumented as described above)

### Create instrumentation.ts

Populate the `instrumentation.ts` you created in your project root with the following content (unless already instrumented as described above):

```typescript
export async function register() {
  const { initOtel } = await import("./otel-server");
  initOtel();
}
```

**CRITICAL**: The instrumentation file must import your OpenTelemetry server configuration. Import the `otel-server` file you copied, make sure to not confuse it with anything similar.

## Client-Side Instrumentation

This section details how to set up browser instrumentation for client-side telemetry for a Tanstack Start applications.

### Update otel-client.ts

Update your `otel-client.ts` to use Vite environment variables:

```typescript
const otlpEndpoint =
  process.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
const otlpEndpointBearerToken =
  process.env.VITE_OTEL_EXPORTER_OTLP_BEARER_TOKEN;
```

The client entry point for Tanstack Start applications is `client.ts`. This file lives in the top level `src` or `app` directory.

- If the `client.ts` file already exists add only the `initOtel()` call with its surrounding browser check and corresponding import from the following snippet.
  - DO NOT remove any existing content or break existing functionality.
  - **IMPORTANT**: `initOtel()` can go after static module imports, but must always be called before any application execution.
- If the `client.ts` does not exist already, create it and copy the content exactly from the following snippet into the file.
- Note how we are importing the `initOtel` function from the `otel-client.ts` file we created earlier make sure to update
  the path if you placed the `otel-client.ts` file in a different location.

```ts
import { StartClient } from "@tanstack/react-start/client";
import React, { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { initOtel } from "./lib/otel-client";

// Only run in browser environment
if (typeof window !== "undefined") {
  initOtel();
}

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>
);
```

The `initOtel` functions should only each be called once per application. Never call either again other than once in
`client.ts` and once in `instrumentation.ts` for instrumentation initialization on the client & server side respectively.
