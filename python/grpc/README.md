# OpenTelemetry gRPC Setup Example

This directory provides a practical example for instrumenting gRPC applications with OpenTelemetry. It demonstrates how to set up comprehensive observability with traces, metrics, and logs using OTLP exporters for both gRPC servers and clients.

- [📦 Dependencies](#-dependencies)
- [🔧 Configuration](#-configuration)
- [🧪 Setup](#-setup)
- [📋 Usage Patterns](#-usage-patterns)
- [🧪 Example Application](#-example-application)

## 📦 Dependencies

Install the required packages using pip:

```bash
pip install \
  grpcio-health-checking>=1.71.0,<1.74.0 \
  opentelemetry-api>=1.30.0,<1.33.0 \
  opentelemetry-sdk>=1.30.0,<1.33.0 \
  opentelemetry-exporter-otlp-proto-grpc>=1.30.0,<1.33.0 \
  opentelemetry-instrumentation-grpc>=0.40b0 \
  opentelemetry-instrumentation-logging>=0.51b0,<=0.53b0
```

**Important**: Use the exact versions specified in [`requirements.txt`](requirements.txt) which contains tested and verified compatible versions.

## 🔧 Configuration

The setup uses OTLP gRPC exporter with endpoint configurable via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable. Default: `http://localhost:4317`.

## 🧪 Setup

The [otel.py](otel.py) file provides a complete OpenTelemetry setup for gRPC applications.

### Key Components

- **Tracing**: TracerProvider + OTLPSpanExporter (automatic gRPC request/response spans)
- **Metrics**: MeterProvider + OTLPMetricExporter (custom counters/histograms)
- **Logging**: LoggerProvider + OTLPLogExporter (structured logs with trace correlation)
- **Instrumentation**: GrpcInstrumentorServer/Client (zero-code gRPC instrumentation)

### Basic Setup

**For gRPC Server**:
```python
import grpc
from concurrent import futures
from otel import setup_instrumentation

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("your-grpc-service")

# Create gRPC server
server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
# Add your servicers here
server.add_insecure_port('[::]:50051')
server.start()
```

**For gRPC Client**:
```python
import grpc
from otel import setup_instrumentation

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("your-grpc-client")

# Create gRPC channel
with grpc.insecure_channel('localhost:50051') as channel:
    # Use your stub here
    pass
```

## 📋 Usage Patterns

### Custom Spans in gRPC Methods

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

class GreeterServicer(helloworld_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        with tracer.start_as_current_span("say_hello_operation") as span:
            span.set_attribute("request.name", request.name)
            try:
                logger.info(f"Received request for {request.name}")
                response = helloworld_pb2.HelloReply(
                    message=f'Hello, {request.name}!'
                )
                span.set_attribute("response.message", response.message)
                return response
            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(str(e))
                raise
```

### Custom Metrics

```python
# Create instruments once
request_counter = meter.create_counter("grpc_requests_total")
request_duration = meter.create_histogram("grpc_request_duration_seconds")

class GreeterServicer(helloworld_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        start_time = time.time()

        # Increment counter
        request_counter.add(1, {
            "method": "SayHello",
            "service": "Greeter"
        })

        # Your logic here
        response = helloworld_pb2.HelloReply(message=f'Hello, {request.name}!')

        # Record duration
        duration = time.time() - start_time
        request_duration.record(duration, {
            "method": "SayHello",
            "service": "Greeter"
        })

        return response
```

### Error Handling

```python
import grpc
from grpc_status import rpc_status
from google.rpc import status_pb2, code_pb2

class GreeterServicer(helloworld_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        try:
            if not request.name:
                logger.error("Empty name in request")
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Name cannot be empty")
                return helloworld_pb2.HelloReply()

            return helloworld_pb2.HelloReply(message=f'Hello, {request.name}!')
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal server error")
            return helloworld_pb2.HelloReply()
```

## 🧪 Example Application

Complete example with OpenTelemetry instrumentation:

**Server (server.py)**:
```python
import time
import grpc
from concurrent import futures
from otel import setup_instrumentation
# Import your generated protobuf files
# import helloworld_pb2
# import helloworld_pb2_grpc

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("grpc-server-example")

# Create metrics
request_counter = meter.create_counter("grpc_requests_total")

class GreeterServicer(helloworld_pb2_grpc.GreeterServicer):
    def SayHello(self, request, context):
        logger.info(f"Received SayHello request for {request.name}")
        request_counter.add(1, {"method": "SayHello"})

        # Simulate some work
        time.sleep(0.1)

        return helloworld_pb2.HelloReply(
            message=f'Hello, {request.name}! From OpenTelemetry gRPC server.'
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    helloworld_pb2_grpc.add_GreeterServicer_to_server(GreeterServicer(), server)
    server.add_insecure_port('[::]:50051')

    logger.info("Starting gRPC server on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
```

**Client (client.py)**:
```python
import grpc
from otel import setup_instrumentation
# Import your generated protobuf files
# import helloworld_pb2
# import helloworld_pb2_grpc

# Setup OpenTelemetry
logger, tracer, meter = setup_instrumentation("grpc-client-example")

def run():
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = helloworld_pb2_grpc.GreeterStub(channel)

        logger.info("Sending SayHello request")
        response = stub.SayHello(helloworld_pb2.HelloRequest(name='World'))

        logger.info(f"Received response: {response.message}")
        print(f"Greeter client received: {response.message}")

if __name__ == '__main__':
    run()
```

**Run the application**:

```bash
# Set endpoint (optional)
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"

# Terminal 1 - Start server
python server.py

# Terminal 2 - Run client
python client.py
```

The application automatically provides:
- gRPC request/response tracing (both client and server)
- Structured logging with trace correlation
- Custom metrics capability
- Manual span creation for business logic
- OTLP export to your observability backend

## References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [gRPC Python Documentation](https://grpc.io/docs/languages/python/)
- [OpenTelemetry gRPC Instrumentation](https://opentelemetry-python-contrib.readthedocs.io/en/latest/instrumentation/grpc/grpc.html)
