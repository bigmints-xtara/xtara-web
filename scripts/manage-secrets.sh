#!/usr/bin/env bash
# =============================================================================
# Xtara Web — GCP Secret Manager CLI
# =============================================================================
# Manages Google Cloud Secret Manager secrets for the xtara-web Cloud Run
# service.  Provides create, update, list, deploy and cleanup operations.
#
# Usage:
#   ./scripts/manage-secrets.sh <command> [options]
#
# Commands:
#   init            Create all required secrets in GCP Secret Manager
#   add <NAME> <VAL>   Create or update a single secret
#   list            List all secrets for the project
#   deploy          Mount all secrets on the Cloud Run service
#   cleanup         Remove orphaned secrets (not currently mounted)
#   status          Show current secret status (local vs remote)
#
# Global options:
#   --project <ID>    GCP project ID (default: bigmints-xtara)
#   --region <R>      Cloud Run region (default: us-central1)
#   --service <N>     Cloud Run service name (default: xtara-web)
#   --dry-run         Print commands without executing
#
# Examples:
#   ./scripts/manage-secrets.sh init
#   ./scripts/manage-secrets.sh add firebase-api-key "AIzaS123..."
#   ./scripts/manage-secrets.sh deploy --project bigmints-xtara
#   ./scripts/manage-secrets.sh cleanup --dry-run
#
# =============================================================================

set -euo pipefail

# ===========================
# Configuration
# ===========================
PROJECT_ID="${PROJECT_ID:-bigmints-xtara}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-xtara-web}"
SECRET_PREFIX="xtara-web"
DRY_RUN="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ===========================
# Secret Registry
# ===========================
# Defines every secret that this project manages.
# Format: "SECRET_NAME=ENV_VAR_KEY"
declare -A SECRET_TO_ENV

SECRET_TO_ENV["${SECRET_PREFIX}-firebase-api-key"]="NEXT_PUBLIC_FIREBASE_API_KEY"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-auth-domain"]="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-project-id"]="NEXT_PUBLIC_FIREBASE_PROJECT_ID"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-storage-bucket"]="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-messaging-sender-id"]="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-app-id"]="NEXT_PUBLIC_FIREBASE_APP_ID"
SECRET_TO_ENV["${SECRET_PREFIX}-firebase-measurement-id"]="NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
SECRET_TO_ENV["${SECRET_PREFIX}-algolia-app-id"]="NEXT_PUBLIC_ALGOLIA_APP_ID"
SECRET_TO_ENV["${SECRET_PREFIX}-algolia-search-api-key"]="NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY"
SECRET_TO_ENV["${SECRET_PREFIX}-nextauth-url"]="NEXTAUTH_URL"
SECRET_TO_ENV["${SECRET_PREFIX}-nextauth-secret"]="NEXTAUTH_SECRET"

# ===========================
# Utility Functions
# ===========================

print_header() {
    echo -e "${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get the GCP project ID used by gcloud
get_gcloud_project() {
    if [[ -n "$PROJECT_ID" ]]; then
        echo "$PROJECT_ID"
    else
        gcloud config get-value project 2>/dev/null
    fi
}

# ===========================
# Secret Operations
# ===========================

# Create a single secret (idempotent — creates only if not present)
create_secret() {
    local secret_name="$1"
    local value="$2"
    local project
    project=$(get_gcloud_project)

    # Check if secret already exists
    if gcloud secrets describe "$secret_name" --project "$project" --format=json > /dev/null 2>&1; then
        print_info "Secret '${secret_name}' already exists — updating..."
        if [[ "$DRY_RUN" != "true" ]]; then
            echo "$value" | gcloud secrets versions add "$secret_name" \
                --project "$project" \
                --data-file=- \
                --quiet
        else
            print_info "[DRY-RUN] Would update secret: $secret_name"
        fi
        print_success "Updated secret: $secret_name"
    else
        if [[ "$DRY_RUN" != "true" ]]; then
            echo "$value" | gcloud secrets create "$secret_name" \
                --project "$project" \
                --data-file=- \
                --replication="user-managed" \
                --replication-location="$REGION" \
                --quiet
        else
            print_info "[DRY-RUN] Would create secret: $secret_name"
        fi
        print_success "Created secret: $secret_name"
    fi
}

# List all secrets for the project with the prefix
list_secrets() {
    local project
    project=$(get_gcloud_project)

    print_info "Listing secrets for project: $project"

    local secrets
    secrets=$(gcloud secrets list --project "$project" \
        --filter="name~^${SECRET_PREFIX}" \
        --format="table(name, create_time, update_time)" \
        2>/dev/null) || true

    if [[ -n "$secrets" ]]; then
        echo "$secrets"
    else
        print_info "No secrets found with prefix '${SECRET_PREFIX}'"
    fi
}

# Get all secret names from the registry
get_secret_names() {
    for secret_name in "${!SECRET_TO_ENV[@]}"; do
        echo "$secret_name"
    done
}

# ===========================
# Command Implementations
# ===========================

# Initialize all secrets from environment variables
cmd_init() {
    print_header "Initialize Secrets"

    local project
    project=$(get_gcloud_project)
    print_info "Project: $project"
    print_info "Region: $REGION"
    print_info "Secret prefix: $SECRET_PREFIX"
    echo ""

    local created=0
    local skipped=0

    for secret_name in "${!SECRET_TO_ENV[@]}"; do
        local env_key="${SECRET_TO_ENV[$secret_name]}"
        local value="${!env_key:-}"

        if [[ -z "$value" ]]; then
            print_info "No local env for $env_key — skipping (set $env_key or use 'add' to populate)"
            skipped=$((skipped + 1))
            continue
        fi

        create_secret "$secret_name" "$value"
        created=$((created + 1))
    done

    echo ""
    print_success "Init complete. $created secrets processed ($skipped skipped)."
    print_info "Run './scripts/manage-secrets.sh deploy' to mount them on Cloud Run."
}

# Add a single secret
cmd_add() {
    local secret_name="$1"
    local value="$2"

    # Prefix the secret name if not already prefixed
    if [[ "$secret_name" != "${SECRET_PREFIX}-"* ]]; then
        secret_name="${SECRET_PREFIX}-${secret_name}"
    fi

    print_info "Adding secret: $secret_name"
    create_secret "$secret_name" "$value"
}

# List secrets
cmd_list() {
    print_header "Secret Manager Inventory"
    list_secrets
}

# Deploy — mount secrets on Cloud Run
cmd_deploy() {
    print_header "Deploy Secrets to Cloud Run"

    local project
    project=$(get_gcloud_project)
    print_info "Service: $SERVICE_NAME ($REGION)"
    print_info "Project: $project"
    echo ""

    # Build the --update-secrets arguments
    local secret_args=()

    for secret_name in "${!SECRET_TO_ENV[@]}"; do
        local env_key="${SECRET_TO_ENV[$secret_name]}"

        # Check if the secret exists in GCP Secret Manager
        if gcloud secrets describe "$secret_name" --project "$project" \
           --format=json > /dev/null 2>&1; then
            local secret_ref
            secret_ref="projects/${project}/secrets/${secret_name}/versions/latest"
            secret_args+=("${env_key}=${secret_ref}")
            print_info "Mounted: $env_key ← $secret_name"
        else
            print_warning "Skipping $env_key ($secret_name not found in Secret Manager)"
        fi
    done

    if [[ ${#secret_args[@]} -eq 0 ]]; then
        print_warning "No secrets found to deploy. Run 'init' or 'add' first."
        return 1
    fi

    # Deploy to Cloud Run, updating secret mounts
    if [[ "$DRY_RUN" != "true" ]]; then
        local cmd="gcloud run services update $SERVICE_NAME"
        for arg in "${secret_args[@]}"; do
            cmd="$cmd --update-secrets $arg"
        done
        cmd="$cmd --region $REGION --project $project --platform managed --quiet"

        print_info "Executing: $cmd"
        eval "$cmd"
        print_success "Secrets deployed to Cloud Run service: $SERVICE_NAME"
    else
        print_info "[DRY-RUN] Would deploy ${#secret_args[@]} secrets to $SERVICE_NAME"
        for arg in "${secret_args[@]}"; do
            print_info "  --update-secrets $arg"
        done
    fi

    print_info ""
    print_info "Verify with:"
    print_info "  gcloud run services describe $SERVICE_NAME --region $REGION --project $project --format=json | jq '.spec.template.spec.containers[0].env'"
}

# Cleanup — remove orphaned secrets
cmd_cleanup() {
    print_header "Cleanup Orphaned Secrets"

    local project
    project=$(get_gcloud_project)

    # Get all secrets in GCP Secret Manager with our prefix
    local all_secrets
    all_secrets=$(gcloud secrets list --project "$project" \
        --filter="name~^${SECRET_PREFIX}" \
        --format="value(name)" 2>/dev/null) || true

    local orphaned=0

    if [[ -n "$all_secrets" ]]; then
        while IFS= read -r secret_name; do
            # Check if this secret is in our registry
            if [[ -z "${SECRET_TO_ENV[$secret_name]:-}" ]]; then
                print_info "Orphaned secret found: $secret_name"
                if [[ "$DRY_RUN" != "true" ]]; then
                    gcloud secrets delete "$secret_name" --project "$project" --quiet
                else
                    print_info "[DRY-RUN] Would delete: $secret_name"
                fi
                orphaned=$((orphaned + 1))
            fi
        done <<< "$all_secrets"
    fi

    if [[ $orphaned -eq 0 ]]; then
        print_success "No orphaned secrets found."
    else
        print_success "Cleaned up $orphaned orphaned secret(s)."
    fi
}

# Show status of all secrets (local env vs GCP Secret Manager)
cmd_status() {
    print_header "Secret Status"

    local project
    project=$(get_gcloud_project)

    printf "${YELLOW}%-40s %-30s %s${NC}\n" "SECRET" "ENV KEY" "STATUS"
    echo "---"

    for secret_name in "${!SECRET_TO_ENV[@]}"; do
        local env_key="${SECRET_TO_ENV[$secret_name]}"
        local local_value="${!env_key:-}"
        local status="---"

        if gcloud secrets describe "$secret_name" --project "$project" \
           --format=json > /dev/null 2>&1; then
            if [[ -n "$local_value" ]]; then
                status="✓ synced"
            else
                status="⚠ in GCP only"
            fi
        else
            if [[ -n "$local_value" ]]; then
                status="⚠ in env only"
            else
                status="---"
            fi
        fi

        printf "%-40s %-30s %s\n" "$secret_name" "$env_key" "$status"
    done
}

# Show help
cmd_help() {
    echo "Xtara Web — GCP Secret Manager CLI"
    echo ""
    echo "Usage: ./scripts/manage-secrets.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init              Create/update all required secrets from env vars"
    echo "  add <NAME> <VAL>  Create or update a single secret"
    echo "  list              List all secrets for the project"
    echo "  deploy            Mount all secrets on Cloud Run"
    echo "  cleanup           Remove orphaned secrets"
    echo "  status            Show sync status between env vars and GCP"
    echo ""
    echo "Global options:"
    echo "  --project <ID>    GCP project (default: bigmints-xtara)"
    echo "  --region <R>      Cloud Run region (default: us-central1)"
    echo "  --service <N>     Cloud Run service (default: xtara-web)"
    echo "  --dry-run         Print commands without executing"
    echo ""
    echo "Examples:"
    echo "  ./scripts/manage-secrets.sh init"
    echo "  ./scripts/manage-secrets.sh add firebase-api-key \"AIzaSy...\""
    echo "  ./scripts/manage-secrets.sh deploy --project bigmints-xtara"
    echo "  ./scripts/manage-secrets.sh cleanup --dry-run"
}

# ===========================
# Argument Processing
# ===========================
# Process flags and extract the command
COMMAND=""
CMD_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        *)
            if [[ -z "$COMMAND" ]]; then
                COMMAND="$1"
            else
                CMD_ARGS+=("$1")
            fi
            shift
            ;;
    esac
done

# ===========================
# Dispatch
# ===========================

case "$COMMAND" in
    init)
        cmd_init
        ;;
    add)
        if [[ ${#CMD_ARGS[@]} -lt 2 ]]; then
            print_error "Usage: manage-secrets.sh add <SECRET_NAME> <VALUE>"
            exit 1
        fi
        cmd_add "${CMD_ARGS[0]}" "${CMD_ARGS[1]}"
        ;;
    list)
        cmd_list
        ;;
    deploy)
        cmd_deploy
        ;;
    cleanup)
        cmd_cleanup
        ;;
    status)
        cmd_status
        ;;
    help|--help|-h)
        cmd_help
        ;;
    "")
        cmd_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        cmd_help
        exit 1
        ;;
esac
