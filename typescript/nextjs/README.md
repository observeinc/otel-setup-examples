# Next.js Application OpenTelemetry Setup Example

Set up OpenTelemetry in Next.js applications using manual configuration. This guide covers both App Router and Pages Router configurations with complete control over your telemetry setup.

## Server-Side Instrumentation

Create an `instrumentation.ts` (or `.js`) file in the root directory of your Next.js project. Place this file:

- In the root of your project (same level as `next.config.js`)
- **NOT** inside the `app` or `pages` directory
- Inside the `src` folder if you're using one (alongside `pages` and `app`)

If the project uses the `pageExtensions` config option to add a suffix, update the instrumentation filename to match.

Install the additional packages `import-in-the-middle` and `require-in-the-middle` which are needed for turbopack to resolve the opentelemetry dependencies:

```
{preferred package manager} install import-in-the-middle require-in-the-middle
```

- If the project is already instrumented on the server side i.e the `instrumentation.ts` file already exists, already
  has a `register` function, and is already instrumented with opentelemetry via the NodeSDK, you SHOULD NOT create
  a new `instrumentation.ts` file or a new `otel-server.ts` file. Simply add additional processors, span processors, and
  readers to the existing ones as detailed in the server example file.

- If the project is already instrumented on the client side with opentelemetry via a WebTracerProvider, LoggerProvider, and
  MeterProvider, you SHOULD NOT create a new `otel-client.ts` file. Simply add additional processors, span processors,
  and readers to the existing ones as detailed in the client example file.

### Create OpenTelemetry Configuration Files

Copy the `otel-server.ts` and `otel-client.ts` example files to the root of your Next.js project. (Unless already instrumented as described above)

### Create instrumentation.ts

Create `instrumentation.ts` in your project root with the following content (unless already instrumented as described above):

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initOtel } = await import("./otel-server");
    initOtel();
  }
}
```

**CRITICAL**: The instrumentation file must import your OpenTelemetry server configuration. Import the `otel-server` file you copied, not a separate `instrumentation.node.ts` file.

**Note**: In Next.js 15+, the instrumentation file is supported by default and does not require any configuration in `next.config.js`.

If the project is using an older version of Next.js (<15), add the following to their `next.config.js` file:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
```

## Client-Side Instrumentation

This section details how to set up browser instrumentation for client-side telemetry in Next.js.

### Update otel-client.ts

Update your `otel-client.ts` to use Next.js environment variables:

```typescript
const otlpEndpoint =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ??
  "http://localhost:4318";
const otlpEndpointBearerToken =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN;
```

### Initialize Client-Side OpenTelemetry

Create a `otel-client-init.ts` file and pick a reasonable location for it in your Next.js project. It is recommended to
place it in `components/providers/` folder but if that folder doesn't exist use your best judgement. Populate the file
with the following content:

```typescript
"use client";

import { useEffect } from "react";

export function OtelClientInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import and initialize client-side OpenTelemetry
      import("../otel-client").then(({ initOtel }) => {
        initOtel();
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
```

Make sure to include this OtelClientInit component in the root layout file. This is the `app/layout.tsx` file if you are
using App Router or the `pages/_app.tsx` file if you are using Pages Router.

If the project was previously instrumented with opentelemetry and the opentelemetry instrumentation is already
initialized you do not need create the `otel-client-init.ts` file.
