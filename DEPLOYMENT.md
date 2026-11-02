# Cloud Run Deployment Guide

## Overview
This guide explains how to deploy the Xtara Web application to Google Cloud Run.

## Prerequisites

1. **Google Cloud SDK** — Install from [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. **Docker (with Buildx)** — Install from [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
3. **Git** — Install from [https://git-scm.com/](https://git-scm.com/)
4. **Application Default Credentials (ADC)** — Configure authentication (see Authentication section below)

## Project Configuration

- **Project ID**: `bigmints-xtara`
- **Service Name**: `xtara-web`
- **Region**: `us-central1`
- **Platform**: `managed`
- **Artifact Registry**: `us-docker.pkg.dev/bigmints-xtara/xtara-web-artifacts`

## Authentication

The deployment script uses **Application Default Credentials (ADC)** instead of a hardcoded service account key. This is more secure and works seamlessly with Workload Identity Federation in CI/CD pipelines.

### Local Development

```bash
gcloud auth application-default login
npm run dev
```

`npm run dev` loads the Firebase web configuration without writing it to disk. It first checks Xtara Secret Manager and, when those optional secrets are unavailable, reads and validates the public configuration already shipped by `https://xtara.ai`. By default it proxies browser API calls to the live Xtara API so a web-only localhost session remains fully usable.

When developing both services locally, override the proxy target explicitly:

```bash
XTARA_API_PROXY_TARGET=http://127.0.0.1:3111 npm run dev
```

Use `npm run dev:plain` only when all `NEXT_PUBLIC_FIREBASE_*` variables are supplied explicitly, for example through an ignored `.env.local` copied from `.env.local.example`. Missing configuration now produces a clear application message instead of initializing Firebase with a fake API key.

### CI/CD Pipelines

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=<path-to-key>
```

Or use Workload Identity Federation (recommended):

```bash
gcloud auth application-default set-credentials
```

### First-Time Setup

Create the dedicated Artifact Registry repository:

```bash
gcloud artifacts repositories create xtara-web-artifacts \
  --repository-name=xtara-web-artifacts \
  --project=bigmints-xtara \
  --location=us-central1 \
  --repository-format="Docker"
```

## Quick Deploy

### Simple Deployment

```bash
./deploy.sh
```

This auto-computes a version tag from the git commit hash + timestamp and deploys.

### Deploy with Explicit Version Tag

```bash
./deploy.sh v1.2.3
```

### Preview Version Tag (no deploy)

```bash
./deploy.sh --version
```

### Dry Run (print commands without executing)

```bash
./deploy.sh --dry-run
```

### Combined

```bash
./deploy.sh v1.2.3 --dry-run
```

## How the Deploy Script Works

1. **Pre-flight Checks** — Verifies gcloud, Docker, Buildx, and git are installed
2. **Authentication** — Validates ADC is configured (falls back to `GOOGLE_APPLICATION_CREDENTIALS`)
3. **Build** — Uses `docker buildx build` with multi-platform support (`linux/amd64`, `linux/arm64`), BuildKit caching, and provenance metadata
4. **Push** — Pushes versioned and `:latest` tags to the dedicated Artifact Registry repository
5. **Deploy** — Deploys the versioned image to Cloud Run

## Version Tagging

Images are tagged with a deterministic version derived from the git commit short hash and a timestamp:

```
<git-hash>-<YYYYMMDD-HHMMSS>
# e.g.: a1b2c3d-20260609-143000
```

Both the versioned tag and `:latest` are pushed to the registry. This enables easy rollbacks to any previous version.

## Artifact Registry

The dedicated repository `us-docker.pkg.dev/bigmints-xtara/xtara-web-artifacts` is used instead of the default `cloud-run-source-deploy` repository for better organization and versioning.

### Listing Available Versions

```bash
gcloud artifacts versions list \
  --repository=xtara-web-artifacts \
  --project=bigmints-xtara
```

### Rollback to a Previous Version

```bash
gcloud run services update xtara-web \
  --image us-docker.pkg.dev/bigmints-xtara/xtara-web-artifacts/xtara-web:<previous-tag> \
  --region us-central1 \
  --project bigmints-xtara
```

## Environment Variables

### Production Environment Variables

The following environment variables need to be configured in Cloud Run:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bigmints-xtara
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Algolia (if used)
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_search_key

# Xtara API
# Optional in production: xtara-web uses its same-origin /xtara-service proxy,
# backed by the production xtara-api Cloud Run service. Override both values
# together only for staging/preview environments.
NEXT_PUBLIC_XTARA_API_BASE_URL=/xtara-service
XTARA_API_PROXY_TARGET=https://your-api-service.run.app

# Next Auth (if used)
NEXTAUTH_URL=https://your-service-url.run.app
NEXTAUTH_SECRET=your_nextauth_secret
```

### Setting Environment Variables

#### Via gcloud CLI:

```bash
gcloud run services update xtara-web \
  --region us-central1 \
  --update-env-vars \
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key,\
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain,\
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=bigmints-xtara
```

#### Via Cloud Console:

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select `xtara-web` service
3. Click "Edit & Deploy New Revision"
4. Go to "Variables & Secrets" tab
5. Add environment variables
6. Click "Deploy"

## Cloud Run Configuration

### Default Settings

- **CPU**: 1 vCPU
- **Memory**: 512 MB
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 60 seconds
- **Port**: 8080
- **Concurrency**: 80 (default)

### Adjusting Resources

To increase memory/CPU for better performance:

```bash
gcloud run services update xtara-web \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2
```

### Custom Domain

To use a custom domain (e.g., app.xtara.ai):

```bash
# Map domain
gcloud run domain-mappings create \
  --service xtara-web \
  --domain app.xtara.ai \
  --region us-central1
```

Then update your DNS with the provided records.

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
gcloud run logs tail xtara-web --region us-central1

# Read recent logs
gcloud run logs read --service xtara-web --region us-central1 --limit 50
```

### View Service Details

```bash
gcloud run services describe xtara-web --region us-central1
```

### Metrics

View metrics in the [Cloud Console](https://console.cloud.google.com/run/detail/us-central1/xtara-web/metrics)

## Troubleshooting

### Build Fails

1. Check Docker is running: `docker ps`
2. Verify `next.config.ts` has `output: 'standalone'`
3. Check BuildKit is enabled: `docker buildx ls`
4. Check build logs for errors

### Deployment Fails

1. Verify ADC is configured: `gcloud auth application-default credentials-list`
2. Check quota limits in GCP
3. Review Cloud Run error logs

### Runtime Errors

1. Check environment variables are set correctly
2. Review application logs: `gcloud run logs read`
3. Verify Firebase credentials

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
        with:
          project_id: bigmints-xtara

      - name: Authenticate with ADC
        run: gcloud auth application-default set-credentials

      - name: Deploy
        run: ./deploy.sh
```

## Cost Optimization

Cloud Run charges based on:
- CPU and memory usage (per second)
- Number of requests
- Egress traffic

Tips to reduce costs:
1. Use `--min-instances 0` to scale to zero when idle
2. Optimize image size (multi-stage Docker build)
3. Set appropriate memory limits
4. Enable HTTP/2 and connection pooling

## Support

For issues or questions:
- Check [Cloud Run Documentation](https://cloud.google.com/run/docs)
- Review [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- Contact: help@xtara.ai

### Required API session origin configuration

Set `XTARA_WEB_ORIGINS` on **xtara-api** to the exact HTTPS web origin(s), comma-separated, including every supported custom domain. A web rewrite preserves the browser Origin while the API request URL may use its Cloud Run hostname. Session creation requires `Content-Type: application/json` and accepts only same-origin or configured browser origins. Native JSON clients without an Origin remain supported. Localhost defaults are development-only; never add them to production configuration. Verify login through the deployed `/xtara-service` proxy before routing traffic to a new release.
