# Tanstack Start Application Example

All Tackstack Start applications have server and client entry points in `server.ts` and `client.ts`. These files live in the `src` or `app` directory.
These files are optional, but if you want to use OpenTelemetry, you should add them.

Documentation regarding the entry points can be found [on the tanstack start documentation](https://tanstack.com/start/latest/docs/framework/react/learn-the-basics)
If the `server.ts` or `client.ts` files does do not exist, add them based on the documentation linked.

Add `server-otel.ts` and `client-otel.ts` files to the root of your project.

In `client-otel.ts` use `import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT` and `import.meta.env.VITE_OTEL_EXPORTER_OTLP_BEARER_TOKEN` to access the environment variables.

Once added, it is possible to use the otel configuration from the original `README.md` file.

To the `server.ts` file, add the following as the first lines in the file:
The eslint-disable-next-line is necessary incase there is a lint rule that informs import order.

```ts
// eslint-disable-next-line
import { initOtel } from "../otel-server";

// ... other imports

initOtel();
```

To the `client.ts` file, add the following as the first lines in the file:

```ts
// eslint-disable-next-line
import { initOtel } from "../otel-client";

// ... other imports

initOtel();
```
