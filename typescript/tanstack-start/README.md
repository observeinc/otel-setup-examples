# Tanstack Start Application Example

All Tackstack Start applications have server and client entry points in `server.ts` and `client.ts`. These files live in the `src` or `app` directory.
These files are optional, but if you want to use OpenTelemetry, you should add them.

Documentation regarding the entry points can be found [on the tanstack start documentation](https://tanstack.com/start/latest/docs/framework/react/learn-the-basics)
If the `server.ts` or `client.ts` files does do not exist, add them based on the documentation linked.

The `server.ts` and `client.tsx` files are the entry points for the server and client side of the application. THEY MUST EXIST.
Create these files if they do not exist. Using the documentation link above to find the correct default for those files.

Add `server-otel.ts` and `client-otel.ts` files to a `util` of `lib` folder. If neither exist, create a `util` folder in the `src` or `app` directory.

In `client-otel.ts` use `import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT` and `import.meta.env.VITE_OTEL_EXPORTER_OTLP_BEARER_TOKEN` to access the environment variables.

Once added, it is possible to use the otel configuration from the original `README.md` file.

To the `server.ts` file, add the following as the first lines in the file:
The eslint-disable-next-line is necessary incase there is a lint rule that informs import order.

```ts
// eslint-disable-next-line
import { initOtel } from "../otel-server";
initOtel();

// ... other imports
```

To the `client.ts` file, add the following as the first lines in the file:

```ts
// eslint-disable-next-line
import { initOtel } from "../otel-client";
initOtel();

// ... other imports
```

The `initOtel` function should only be called once per application. Never call it again in another other files.

Install [otel logging middleware](./otelLoggingMiddleware.tsx) into the project in a `util` or `lib` folder. Ideally next to other middleware files.
If there is a call to `registerGlobalMiddleware` somewhere in the app, go ahead and add the newly added `otelLoggingFunctionMiddleware` to the array.
The `otelLoggingRequestMiddleware` can be added the middleware array for any `createServerFileRoute` calls in the app. It does not work with the global middleware setup.
