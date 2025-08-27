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
