# GCP IAM Security Configuration for Parliament Explorer
# This file demonstrates enhanced IAM safeguards available in GCP

# 1. SERVICE ACCOUNTS FOR LEAST PRIVILEGE
#    Create dedicated service accounts with minimal permissions

# Backend API Service Account
resource "google_service_account" "parliament_api_sa" {
  account_id   = "parliament-api-sa"
  display_name = "Parliament API Service Account"
  description  = "Service account for Parliament API with minimal required permissions"
}

# Frontend Service Account  
resource "google_service_account" "parliament_frontend_sa" {
  account_id   = "parliament-frontend-sa"
  display_name = "Parliament Frontend Service Account"
  description  = "Service account for Parliament Frontend with read-only permissions"
}

# Build Service Account
resource "google_service_account" "parliament_build_sa" {
  account_id   = "parliament-build-sa"
  display_name = "Parliament Build Service Account"
  description  = "Service account for Cloud Build with minimal deployment permissions"
}

# 2. IAM ROLE BINDINGS - PRINCIPLE OF LEAST PRIVILEGE
# Backend API permissions
resource "google_project_iam_member" "api_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

resource "google_project_iam_member" "api_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

resource "google_project_iam_member" "api_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

# Frontend permissions (read-only)
resource "google_project_iam_member" "frontend_storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.parliament_frontend_sa.email}"
}

# 3. WORKLOAD IDENTITY (for GKE if migrating from Cloud Run)
resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.parliament_api_sa.name
  role              = "roles/iam.workloadIdentityUser"
  member            = "serviceAccount:${var.project_id}.svc.id.goog[default/parliament-api-ksa]"
}

# 4. IAM CONDITIONS FOR ENHANCED SECURITY
resource "google_project_iam_member" "conditional_access" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
  
  condition {
    title       = "Time-based Access"
    description = "Access only during business hours"
    expression  = "request.time.getHours() >= 6 && request.time.getHours() <= 22"
  }
}

# 5. ORGANIZATION POLICIES
resource "google_organization_policy" "require_os_login" {
  org_id      = var.organization_id
  constraint  = "compute.requireOsLogin"
  
  boolean_policy {
    enforced = true
  }
}

resource "google_organization_policy" "restrict_vm_external_ips" {
  org_id      = var.organization_id
  constraint  = "compute.vmExternalIpAccess"
  
  list_policy {
    deny {
      all = true
    }
  }
}