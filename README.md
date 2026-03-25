# ⚡ gha-scaffold — GitHub Actions Workflow Generator

> **Auto-detect your tech stack and generate production-ready GitHub Actions CI/CD pipelines in seconds.**

Stop copying and pasting GitHub Actions workflows. Stop wasting hours on syntax errors and missing configuration. `gha-scaffold` reads your project, understands your stack, and generates a complete, working workflow file tailored to your needs.

[![npm version](https://img.shields.io/npm/v/gha-scaffold)](https://www.npmjs.com/package/gha-scaffold)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Problem

Every developer setting up CI/CD on GitHub faces the same pain:

- **Verbose YAML syntax** — Easy to get wrong, hard to debug
- **Stack-specific complexity** — .NET workflows ≠ Node.js workflows ≠ Terraform workflows
- **GCP deployment is a nightmare** — Authentication, Workload Identity, artifact registry... it's a maze
- **Time waste** — 2-4 hours per person on something that should take 5 minutes
- **Error prone** — Copy-pasted from old projects, outdated action versions, missing secrets

## ✨ The Solution

`gha-scaffold` is a CLI tool that:

1. **Scans your project** — Detects your tech stack automatically
2. **Asks smart questions** — Only the questions relevant to your setup
3. **Generates workflows** — Production-ready, tested, best-practices workflows
4. **Writes instantly** — Direct to `.github/workflows/ci.yml` (or preview with `--dry-run`)

**Result**: Professional CI/CD pipeline in 60 seconds instead of 2 hours.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g gha-scaffold
```

Or use with `npx` (no installation):

```bash
npx gha-scaffold generate
```

### Usage

```bash
# Navigate to your project
cd my-project

# Auto-detect stack and generate workflow
gha-scaffold generate

# Or preview without writing to disk
gha-scaffold generate --dry-run

# Force a specific stack (skip detection)
gha-scaffold generate --stack dotnet-gcp

# Just see what stacks are available
gha-scaffold list

# Detect your stack (no generation)
gha-scaffold detect
```

---

## 📋 Supported Templates

### Basic Templates (CI Only)

| Template | Purpose | Languages |
|----------|---------|-----------|
| **dotnet-basic** | Build, test, optional NuGet publish | C#, .NET |
| **node-basic** | Install, lint, test, optional npm publish | JavaScript, TypeScript |

### Advanced Templates (CI + Deployment)

| Template | Purpose | Features |
|----------|---------|----------|
| **dotnet-gcp** | .NET → GCP deployment | Cloud Run, Cloud Functions, App Engine; Workload Identity auth |
| **node-docker** | Node.js → Docker registry | GHCR, Docker Hub, GCP Artifact Registry |
| **terraform** | Infrastructure as Code | Plan/apply; GCP, AWS, Azure support |

---

## 🔍 Stack Detection

`gha-scaffold` automatically detects:

- **Languages**: C#, Node.js, Python, Go, Java, Kotlin, Rust
- **Runtimes**: .NET Core, Node.js, Python 3, Go, JVM
- **Infrastructure**: Docker (Dockerfile), Terraform (*.tf files)
- **Deployment**: GCP signals (app.yaml)

```bash
$ gha-scaffold detect

⚡ gha-scaffold — GitHub Actions Workflow Generator

✔ Stack detected!

Detected Stack:
  ✔ Language:   C#
  ✔ Runtime:    .NET Core
  ✔ Docker detected
  ✔ Terraform detected

  Suggested template: dotnet-gcp
```

---

## 💡 Usage Examples

### Example 1: Simple Node.js Project

```bash
$ gha-scaffold generate

⚡ gha-scaffold — GitHub Actions Workflow Generator

✔ Stack detected!
? Which workflow template do you want? node-basic
? Which branch should trigger deployments? main
? Project / app name (used in workflow labels)? my-app
? Node.js version? 18
? Publish to npm registry? No

✅ Generated .github/workflows/ci.yml
```

**Result**: Workflow with `npm install`, linting, and tests on every push to `main`.

---

### Example 2: .NET API with GCP Cloud Run

```bash
$ gha-scaffold generate

⚡ gha-scaffold — GitHub Actions Workflow Generator

✔ Stack detected!
? Which workflow template do you want? dotnet-gcp
? Which branch should trigger deployments? main
? Project / app name (used in workflow labels)? my-api
? .NET version? 8.0
? GCP Project ID? my-gcp-project-123
? Which GCP service are you deploying to? Cloud Run
? GCP Region? us-central1
? Artifact Registry repo name (for Docker images)? my-repo

📌 You will need these GitHub Secrets:
   WIF_PROVIDER           — your Workload Identity Federation provider
   WIF_SERVICE_ACCOUNT    — your service account email

✅ Generated .github/workflows/ci.yml
   Commit and push to activate your pipeline.

Next steps:
  1. Review the generated workflow file
  2. Add required secrets to GitHub → Settings → Secrets & Variables → Actions
  3. git add .github && git commit -m "ci: add github actions workflow"
```

**Result**: 
- Build and test on every PR
- Deploy to Cloud Run on merge to main
- Uses secure Workload Identity Federation (no key files!)
- Builds and pushes Docker image to Artifact Registry

---

### Example 3: Terraform Infrastructure

```bash
$ gha-scaffold generate --stack terraform

⚡ gha-scaffold — GitHub Actions Workflow Generator

✔ Stack detected!
? Which branch should trigger deployments? main
? Project / app name (used in workflow labels)? infra
? Which cloud provider are you managing? AWS
? Auto-apply on merge to main? (if no, pipeline will only plan) No

✅ Generated .github/workflows/ci.yml
```

**Result**:
- Terraform format & validation on PR
- Plan output commented on PRs
- Manual apply required (no auto-apply)
- Full AWS credential handling

---

## 🔐 Security Features

### Workload Identity Federation (GCP)

No service account keys needed! Uses GitHub's native OIDC support:

```yaml
- id: auth
  uses: google-github-actions/auth@v1
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

### Minimal Secrets

Only request exactly what's needed:
- **GCP deployments**: WIF provider, service account (no keys!)
- **Docker Hub**: Username, token
- **npm**: Just the publishing token
- **Terraform AWS**: Role ARN for OIDC assumption

---

## 🎨 Features

✅ **Auto-detect** — Scans project, identifies stack
✅ **Multi-option templates** — Choose deployment targets, cloud providers, registries
✅ **Production-ready** — Best practices, proper error handling, security
✅ **Handlebars templating** — Smart conditional sections (only include what you need)
✅ **Dry-run mode** — Preview before writing to disk
✅ **Interactive prompts** — Only asks relevant questions
✅ **Colored output** — Beautiful CLI with spinners and formatting
✅ **Comprehensive testing** — 10+ test cases
✅ **5 templates** — From simple CI to complex multi-cloud deployments

---

## 📦 What Gets Generated

Your workflow file includes:

- ✅ **Checkout code** — Latest GitHub Actions checkout@v3
- ✅ **Setup runtime** — Language/version specific setup
- ✅ **Build & test** — Language-specific build and test commands
- ✅ **Deployment** (optional) — Push to registry, deploy to cloud
- ✅ **Error handling** — Proper permissions and error messages
- ✅ **Caching** — npm/Maven/NuGet caching for faster builds
- ✅ **Artifacts** — Store build outputs for later
- ✅ **Secrets** — Prompt to add required secrets

---

## 🛠️ Commands Reference

### `gha-scaffold detect`

Analyze your project and show detected stack.

```bash
gha-scaffold detect [options]

Options:
  -p, --path <path>  Path to project directory (default: current directory)
```

### `gha-scaffold generate`

Generate and write workflow file.

```bash
gha-scaffold generate [options]

Options:
  -p, --path <path>           Path to project directory (default: current directory)
  -s, --stack <stack>         Force specific template (skip detection)
  --dry-run                   Preview workflow without writing to disk
```

### `gha-scaffold list`

Show all available templates.

```bash
gha-scaffold list
```

---

## 🔧 Advanced Usage

### Override Detected Stack

```bash
# Use node-docker even if Terraform is detected
gha-scaffold generate --stack node-docker
```

### Preview Before Committing

```bash
# See what will be generated without writing
gha-scaffold generate --dry-run

# Carefully review output...
# Then generate for real
gha-scaffold generate
```

### Different Project Directory

```bash
# Generate workflow for a subdirectory
gha-scaffold generate --path ./backend
gha-scaffold generate --path ../sibling-project
```

---

## 📝 Next Steps After Generation

1. **Review the workflow** — Check `.github/workflows/ci.yml`
2. **Add secrets** — GitHub → Settings → Secrets & Variables → Actions
   - Copy the secrets suggested in the output
   - Add your actual values
3. **Commit and push**
   ```bash
   git add .github/
   git commit -m "ci: add github actions workflow"
   git push
   ```
4. **Watch it run** — Go to Actions tab on GitHub, trigger a test push

---

## 🤝 Contributing

Found a bug? Want a new template? Missing a feature?

```bash
git clone https://github.com/ritikmalhotra/gha-scaffold.git
cd gha-scaffold
npm install
npm test
```

**Adding a new template?**
1. Create `templates/my-template.yml` with Handlebars syntax
2. Add questions to `src/prompts.js`
3. Update `src/detector.js` if needed for detection
4. Add tests to `test/detector.test.js`

---

## 📄 License

MIT © [Ritik Malhotra](https://github.com/RitikMalhotra0709)

---

## 🎓 How It Works

```
┌─────────────────┐
│  Your Project   │
└────────┬────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Scan for clues:     │
    │ • .csproj, *.sln?   │
    │ • package.json?     │
    │ • Dockerfile?       │
    │ • *.tf files?       │
    └────────┬────────────┘
             │
             ▼
      ┌──────────────┐
      │ Detected:    │
      │ .NET + Docker│
      └────────┬─────┘
               │
               ▼
      ┌──────────────────────┐
      │ Ask user:            │
      │ • Branch trigger?    │
      │ • Deploy to GCP?     │
      │ • Which service?     │
      └────────┬─────────────┘
               │
               ▼
      ┌──────────────────────┐
      │ Pick template:       │
      │ → dotnet-gcp.yml     │
      └────────┬─────────────┘
               │
               ▼ (Handlebars)
      ┌──────────────────────┐
      │ Generate workflow    │
      │ (inject variables)   │
      └────────┬─────────────┘
               │
               ▼
      ┌──────────────────────┐
      │ .github/workflows/   │
      │ ci.yml ready!        │
      └──────────────────────┘
```

---

## 💬 Questions?

- Check existing issues: [GitHub Issues](https://github.com/RitikMalhotra0709/gha-scaffold/issues)
- Reach out to (malhotraritik0709@gmail.com)


**Give it a star** ⭐ if you find it useful!
