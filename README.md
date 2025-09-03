# OpenTelemetry Setup Examples Directory

This repository contains comprehensive OpenTelemetry setup examples for different programming languages and frameworks. This README serves as a directory for LLMs to quickly locate and understand the available documentation and examples.

## 📚 Available Documentation by Language

### 🐹 Go

- **Main Documentation**: [`go/README.md`](go/README.md)
  - Generic OpenTelemetry setup that works with any Go HTTP framework
  - Comprehensive examples for traces, metrics, and logs using OTLP exporters
  - HTTP instrumentation compatible with standard library and popular frameworks
  - Structured logging with slog integration
  - Tested dependency versions in [`go/go.mod`](go/go.mod)

### 🐍 Python

- **Main Documentation**: [`python/README.md`](python/README.md)
  - Overview of Python OpenTelemetry instrumentation approaches
  - Both manual and automatic instrumentation methods
  - Comprehensive coverage of traces, metrics, and logs using OTLP exporters
  - Framework-agnostic patterns and best practices

#### Python Framework-Specific Documentation

- **FastAPI**: [`python/fastapi/README.md`](python/fastapi/README.md)
  - Async/await compatible OpenTelemetry setup for FastAPI applications
  - ASGI middleware integration and background task instrumentation
  - Tested dependency versions: [`python/fastapi/requirements.txt`](python/fastapi/requirements.txt)

- **Flask**: [`python/flask/README.md`](python/flask/README.md)
  - WSGI-based OpenTelemetry setup for Flask applications
  - Route-level instrumentation and error handler integration
  - Tested dependency versions: [`python/flask/requirements.txt`](python/flask/requirements.txt)

- **gRPC**: [`python/grpc/README.md`](python/grpc/README.md)
  - Client and server instrumentation for gRPC applications
  - Protobuf integration and bidirectional streaming support
  - Tested dependency versions: [`python/grpc/requirements.txt`](python/grpc/requirements.txt)

### 📘 TypeScript/Node.js

- **Main Documentation**: [`typescript/README.md`](typescript/README.md)
  - Generic setup using NodeSDK with automatic instrumentation
  - Works with Express, Fastify, Koa, and other Node.js frameworks
  - Separate server and client configurations
  - Tested dependency versions:
    - Server: [`typescript/server/package.json`](typescript/server/package.json)
    - Client: [`typescript/client/package.json`](typescript/client/package.json)

#### TypeScript Framework-Specific Documentation

- **Next.js**: [`typescript/nextjs/README.md`](typescript/nextjs/README.md)
  - Complete setup guide for Next.js applications (App Router and Pages Router)
  - Built-in OpenTelemetry support with @vercel/otel and manual configuration
  - Client-side and server-side instrumentation
  - Default spans and custom telemetry examples
- **TanStack Start**: [`typescript/tanstack-start/README.md`](typescript/tanstack-start/README.md)
  - Specific setup instructions for TanStack Start applications
  - Server and client entry point configurations
  - Environment variable handling for client-side telemetry
