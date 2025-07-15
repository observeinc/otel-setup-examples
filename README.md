# otel-setup-examples

Repo with OpenTelemetry setup examples for different programming languages and frameworks

The repository is structured based on language-specific patterns:

```
# For languages with generic, framework-agnostic implementations (e.g., Go)
<language>/
├── otel.<language_extension>     # Generic setup file that works with any framework
├── <dependency_file>             # Language-specific dependency file with tested versions
└── README.md

# For languages with framework-specific implementations (e.g., Python)
<language>/
├── <framework1>/
│   ├── otel.<language_extension> # Framework-specific setup
│   └── <dependency_file>         # Framework-specific dependency file with tested versions
├── <framework2>/
│   ├── otel.<language_extension> # Framework-specific setup
│   └── <dependency_file>         # Framework-specific dependency file with tested versions
└── README.md
```

Each language directory includes:
- **Setup files**: Implementation code for OpenTelemetry instrumentation
- **Dependency files**: Tested and compatible package versions
  - `go.mod` for Go projects
  - `package.json` for TypeScript/Node.js projects
  - `requirements.txt` for Python projects (framework-specific: `flask/requirements.txt`, `fastapi/requirements.txt`)
- **README.md**: Language-specific documentation and setup instructions

**💡 Tip**: Use the dependency files as a reference for compatible package versions that have been tested together.

An example of README structure:
- 📦 Dependencies
- 🔧 Configuration Overview
- 🧪 <Framework> Application Example
  - Key Components
- 📈 Exporting Telemetry Data
- 🧪 Example Usage
  - <Framework> Application
- 📚 References
