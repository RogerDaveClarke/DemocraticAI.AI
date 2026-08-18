# Phase 1 Foundation Security Deployment for Parliament Explorer
# Immediate security implementation with minimal cost ($50-100/month)

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "replace-with-your-project-id"
}

variable "parliament_api_key" {
  description = "API key for Parliament application"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. SERVICE ACCOUNTS - Least Privilege Access
resource "google_service_account" "parliament_api_sa" {
  account_id   = "parliament-api-foundation"
  display_name = "Parliament API Foundation Service Account"
  description  = "Foundation service account for Parliament API with minimal permissions"
}

resource "google_service_account" "parliament_frontend_sa" {
  account_id   = "parliament-frontend-foundation"
  display_name = "Parliament Frontend Foundation Service Account"
  description  = "Foundation service account for Parliament Frontend with minimal permissions"
}

# 2. IAM ROLES - Minimal Required Permissions
resource "google_project_iam_member" "api_firestore_read" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

resource "google_project_iam_member" "api_logging_write" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

resource "google_project_iam_member" "api_monitoring_write" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

# Frontend service account permissions (minimal)
resource "google_project_iam_member" "frontend_storage_read" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.parliament_frontend_sa.email}"
}

# 3. SECRET MANAGER - Secure API Key Storage
resource "google_secret_manager_secret" "parliament_api_key" {
  secret_id = "parliament-api-key"
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  labels = {
    environment = "production"
    service     = "parliament-api"
    security    = "foundation"
  }
}

# Store the current API key securely
resource "google_secret_manager_secret_version" "parliament_api_key_version" {
  secret = google_secret_manager_secret.parliament_api_key.id
  secret_data = var.parliament_api_key
}

# 4. AUDIT LOGGING - Basic Security Monitoring
resource "google_logging_project_sink" "parliament_security_sink" {
  name        = "parliament-security-foundation"
  destination = "storage.googleapis.com/${google_storage_bucket.parliament_security_logs.name}"
  
  # Basic security events
  filter = <<EOF
protoPayload.serviceName="iam.googleapis.com" OR
protoPayload.serviceName="secretmanager.googleapis.com" OR
protoPayload.serviceName="run.googleapis.com" OR
(protoPayload.methodName="SetIamPolicy" OR 
 protoPayload.methodName="CreateServiceAccount" OR
 protoPayload.methodName="DeleteServiceAccount")
EOF

  unique_writer_identity = true
}

# Security logs storage
resource "google_storage_bucket" "parliament_security_logs" {
  name          = "parliament-security-logs-foundation"
  location      = "US"
  force_destroy = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90  # 90 days retention for foundation
    }
    action {
      type = "Delete"
    }
  }

  uniform_bucket_level_access = true
  public_access_prevention = "enforced"

  labels = {
    purpose     = "security-logs"
    environment = "foundation"
    retention   = "90-days"
  }
}

# 5. BASIC MONITORING - Essential Security Alerts
resource "google_monitoring_notification_channel" "parliament_security_email" {
  display_name = "Parliament Security Foundation"
  type         = "email"
  
  labels = {
    email_address = "security@yourorganization.com"  # Update this to your email
  }

  enabled = true
}

# Basic error rate monitoring
resource "google_monitoring_alert_policy" "parliament_error_rate" {
  display_name = "Parliament API Error Rate - Foundation"
  combiner     = "OR"
  enabled      = true
  
  conditions {
    display_name = "High error rate detected"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.parliament_security_email.name
  ]

  alert_strategy {
    auto_close = "604800s"  # 7 days
  }
}

# 6. IAM PERMISSIONS for Secret Manager Access
resource "google_secret_manager_secret_iam_member" "api_secret_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.parliament_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.parliament_api_sa.email}"
}

# 7. OUTPUT VALUES for Application Configuration
output "api_service_account_email" {
  value = google_service_account.parliament_api_sa.email
  description = "Email of the API service account"
}

output "frontend_service_account_email" {
  value = google_service_account.parliament_frontend_sa.email
  description = "Email of the frontend service account"
}

output "api_key_secret_name" {
  value = google_secret_manager_secret.parliament_api_key.secret_id
  description = "Secret Manager secret name for API key"
}

output "security_logs_bucket" {
  value = google_storage_bucket.parliament_security_logs.name
  description = "Security logs storage bucket"
}