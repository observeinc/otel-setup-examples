# Tanstack Start Application Example

## Server-Side Instrumentation

Create an `instrumentation.ts` (or `.js` if the project is not using typescript) file inside of the your Tanstack Start project. Place this file:

- In the root of your project (same level as `vite.config.js`)
- **NOT** inside the `app` or `public` directory

- If the project is already instrumented on the server side i.e the `instrumentation.ts` file already exists, already
  has a `register` function, and is already instrumented with opentelemetry via the NodeSDK, you SHOULD NOT create
  a new `instrumentation.ts` file or a new `otel-server.ts` file. Simply add additional processors, span processors, and
  readers to the existing ones as detailed in the server example file.

- If the project is already instrumented on the client side with opentelemetry via a WebTracerProvider, LoggerProvider, and
  MeterProvider, you SHOULD NOT create a new `otel-client.ts` file. Simply add additional processors, span processors,
  and readers to the existing ones as detailed in the client example file.

### Create OpenTelemetry Configuration Files

Copy the `otel-server.ts` and `otel-client.ts` example files and place these inside of the `app/lib/` folder (create if the `lib` folder doesn't exist) in your Tanstack Start project. (Unless already instrumented as described above)

### Create instrumentation.ts

Populate the `instrumentation.ts` you created in your project root with the following content (unless already instrumented as described above):

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("./otel-server");
    initOtel();
  }
}
```

**CRITICAL**: The instrumentation file must import your OpenTelemetry server configuration. Import the `otel-server` file you copied, not a separate `instrumentation.server.ts` file or anything similar.

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

The client entry point for Tanstack Start applications is `client.ts`. This file lives in the `app` directory.

- If the `client.ts` file doesn't exist, create it.
- Add the following snippet to the `client.ts` file. DO NOT remove any existing content or break existing functionality.
- **IMPORTANT**: `initOtel()` can go after static module imports, but must always be called before any application execution.
- Note how we are importing the `initOtel` function from the `otel-client.ts` file we created earlier make sure to update
  the path if you placed the `otel-client.ts` file in a different location.

```ts
import { initOtel } from "../otel-client";

// Only run in browser environment
if (typeof window !== "undefined") {
  initOtel();
}
```

The `initOtel` function should only be called once per application. Never call it again in any other files.

Create a `otelLoggingMiddleware.tsx` file in a `lib/` or `utils/` folder inside of the `app` directory (generally prefer `lib/` but prioritize next to other middleware files if they exist).
Create a `lib/` folder to house this file in the `app` directory if neither of the folders exist.
Populate the `otelLoggingMiddleware.tsx` file with the following content:

```ts
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { createMiddleware } from "@tanstack/react-start";

async function middleware<N>({
  next,
  attributes,
}: {
  next: () => N;
  attributes: Record<string, string>;
}) {
  const logger = logs.getLogger("[middleware]");

  try {
    return await next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);

    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: `Error: ${errorMessage}`
      attributes,
    });
    throw error;
  }
}

export const otelLoggingRequestMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, pathname, request }) => {
  return await middleware({
    next,
    attributes: {
      pathname,
      method: request.method,
      url: request.url,
    },
  });
});

export const otelLoggingFunctionMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, method, functionId }) => {
  return await middleware({
    next,
    attributes: {
      method,
      functionId,
    },
  });
});
```

If there is a call to `registerGlobalMiddleware` somewhere in the app, go ahead and add the newly added `otelLoggingFunctionMiddleware` to the array.
The `otelLoggingRequestMiddleware` can be added the middleware array for any `createServerFileRoute` calls in the app. It does not work with the global middleware setup.
