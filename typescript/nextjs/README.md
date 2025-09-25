# Next.js Application OpenTelemetry Setup Example

Set up OpenTelemetry in Next.js applications using manual configuration. This guide covers both App Router and Pages Router configurations with complete control over your telemetry setup.

## 📋 Prerequisites

Create an `instrumentation.ts` (or `.js`) file in the root directory of your Next.js project. Place this file:

- In the root of your project (same level as `next.config.js`)
- **NOT** inside the `app` or `pages` directory
- Inside the `src` folder if you're using one (alongside `pages` and `app`)

If the project uses the `pageExtensions` config option to add a suffix, update the instrumentation filename to match.

Install the additional packages `import-in-the-middle` and `require-in-the-middle` which are needed for turbopack to resolve the opentelemetry dependencies:

```
{preferred package manager} install import-in-the-middle require-in-the-middle
```

### Create OpenTelemetry Configuration Files

Copy the `otel-server.ts` and `otel-client.ts` files from the [`server/otel-server.ts`](../server/otel-server.ts) and [`client/otel-client.ts`](../client/otel-client.ts) files in this repository to the root of your Next.js project.

### Create instrumentation.ts

Create `instrumentation.ts` in your project root with the following content:

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

Set up browser instrumentation for client-side telemetry in Next.js.

### Initialize Client-Side OpenTelemetry

Add client-side initialization in your root layout or `_app.tsx`:

```typescript
// app/layout.tsx (App Router) or pages/_app.tsx (Pages Router)
"use client"; // Only needed in App Router

import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import and initialize client-side OpenTelemetry
      import("../otel-client").then(({ initOtel }) => {
        initOtel();
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Configure Environment Variables

Set up Next.js public environment variables for client-side telemetry:

```bash
# .env.local
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

Update your `otel-client.ts` to use Next.js environment variables:

```typescript
const otlpEndpoint =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ??
  "http://localhost:4318";
const otlpEndpointBearerToken =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN;
```

**IMPORTANT**: Client-side environment variables in Next.js must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.
