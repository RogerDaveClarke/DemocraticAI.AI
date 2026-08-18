# GCP Data Protection and Compliance Security Configuration
# Comprehensive data protection, encryption, and compliance safeguards

# 1. CLOUD KEY MANAGEMENT SERVICE (KMS) - ADVANCED
resource "google_kms_key_ring" "parliament_security_keyring" {
  name     = "parliament-security-keyring"
  location = "europe-west1"  # EU region for GDPR compliance
}

# Application-level encryption key
resource "google_kms_crypto_key" "parliament_app_key" {
  name     = "parliament-app-encryption-key"
  key_ring = google_kms_key_ring.parliament_security_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s"  # 90 days

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Database encryption key
resource "google_kms_crypto_key" "parliament_db_key" {
  name     = "parliament-db-encryption-key"
  key_ring = google_kms_key_ring.parliament_security_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s"  # 90 days

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "HSM"  # Hardware Security Module for database
  }

  lifecycle {
    prevent_destroy = true
  }
}

# 2. FIRESTORE SECURITY RULES (Enhanced)
resource "google_firestore_document" "parliament_security_rules" {
  project     = var.project_id
  collection  = "security_config"
  document_id = "firestore_rules"

  fields = jsonencode({
    rules = {
      string_value = <<EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Parliament data - public read only
    match /parliament/{document} {
      allow read: if true;
      allow write: if false;  // Data comes from Oireachtas API only
    }
    
    // User sessions - strict access control
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == sessionId &&
        isValidSession(sessionId);
    }
    
    // Analytics - aggregated only
    match /analytics/{document} {
      allow read: if request.auth != null && 
        hasRole('analytics_viewer');
      allow write: if request.auth != null && 
        hasRole('analytics_admin') &&
        isValidAnalyticsData(resource.data);
    }
    
    // Security logs - admin only
    match /security_logs/{document} {
      allow read, write: if request.auth != null && 
        hasRole('security_admin') &&
        request.time < timestamp.date(2024, 12, 31);  // Time-bound access
    }
    
    // Helper functions
    function hasRole(role) {
      return request.auth.token.roles != null && 
             role in request.auth.token.roles;
    }
    
    function isValidSession(sessionId) {
      return sessionId.matches('^[a-zA-Z0-9_-]+$') &&
             sessionId.size() > 10 &&
             sessionId.size() < 128;
    }
    
    function isValidAnalyticsData(data) {
      return data.keys().hasAll(['timestamp', 'event_type']) &&
             data.timestamp is timestamp &&
             data.event_type is string;
    }
  }
}
EOF
    }
    last_updated = {
      timestamp_value = "2024-01-15T10:00:00Z"
    }
  })
}

# 3. DATA LOSS PREVENTION (DLP) - COMPREHENSIVE
resource "google_data_loss_prevention_deidentify_template" "parliament_dlp_template" {
  parent       = "projects/${var.project_id}"
  description  = "De-identification template for Parliament data"
  display_name = "Parliament DLP De-identification"

  deidentify_config {
    info_type_transformations {
      transformations {
        info_types {
          name = "EMAIL_ADDRESS"
        }
        info_types {
          name = "PHONE_NUMBER"
        }
        primitive_transformation {
          crypto_replace_ffx_fpe_config {
            crypto_key {
              kms_wrapped {
                wrapped_key   = base64encode("placeholder-wrapped-key")
                crypto_key_name = google_kms_crypto_key.parliament_app_key.id
              }
            }
            alphabet = "ALPHA_NUMERIC"
          }
        }
      }
    }
  }
}

# DLP job trigger for ongoing monitoring
resource "google_data_loss_prevention_job_trigger" "parliament_dlp_trigger" {
  parent       = "projects/${var.project_id}"
  description  = "DLP monitoring for Parliament Explorer"
  display_name = "Parliament DLP Monitor"

  triggers {
    schedule {
      recurrence_period_duration = "86400s"  # Daily
    }
  }

  inspect_job {
    inspect_template_name = google_data_loss_prevention_inspect_template.parliament_dlp_template.name
    
    storage_config {
      big_query_options {
        table_reference {
          project_id = var.project_id
          dataset_id = "parliament_analytics"
          table_id   = "user_interactions"
        }
      }
    }

    actions {
      pub_sub {
        topic = google_pubsub_topic.parliament_dlp_findings.id
      }
    }
  }
}

# 4. CUSTOMER-MANAGED ENCRYPTION KEYS (CMEK)
resource "google_compute_disk" "parliament_encrypted_disk" {
  name = "parliament-encrypted-data"
  type = "pd-ssd"
  zone = "europe-west1-b"
  size = 100

  disk_encryption_key {
    kms_key_self_link = google_kms_crypto_key.parliament_db_key.id
  }

  labels = {
    environment = "production"
    purpose     = "parliament-data"
    encryption  = "cmek"
  }
}

# 5. CLOUD STORAGE - ENHANCED SECURITY
resource "google_storage_bucket" "parliament_secure_data" {
  name          = "parliament-secure-data-${random_id.secure_bucket_suffix.hex}"
  location      = "EU"
  force_destroy = false

  # Customer-managed encryption
  encryption {
    default_kms_key_name = google_kms_crypto_key.parliament_app_key.id
  }

  # Versioning for data protection
  versioning {
    enabled = true
  }

  # Lifecycle management
  lifecycle_rule {
    condition {
      age                   = 90
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age                   = 365
      matches_storage_class = ["NEARLINE"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  # Retention policy
  retention_policy {
    retention_period = 2592000  # 30 days minimum
  }

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # Public access prevention
  public_access_prevention = "enforced"

  # CORS configuration for secure web access
  cors {
    origin          = ["https://parliament-explorer.ie", "https://www.parliament-explorer.ie"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Content-Range", "Content-Length"]
    max_age_seconds = 3600
  }
}

resource "random_id" "secure_bucket_suffix" {
  byte_length = 8
}

# 6. BINARY AUTHORIZATION - ENHANCED
resource "google_binary_authorization_policy" "parliament_binary_policy" {
  admission_whitelist_patterns {
    name_pattern = "gcr.io/${var.project_id}/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.parliament_attestor.name
    ]
  }

  # Cluster-specific rules
  cluster_admission_rules {
    cluster                = "europe-west1.parliament-cluster"
    evaluation_mode        = "REQUIRE_ATTESTATION"
    enforcement_mode       = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    
    require_attestations_by = [
      google_binary_authorization_attestor.parliament_attestor.name,
      google_binary_authorization_attestor.parliament_security_attestor.name
    ]
  }
}

# Security attestor
resource "google_binary_authorization_attestor" "parliament_security_attestor" {
  name = "parliament-security-attestor"
  
  attestation_authority_note {
    note_reference = google_container_analysis_note.parliament_security_note.name
    
    public_keys {
      ascii_armored_pgp_public_key = file("${path.module}/security-attestor.pub")
    }
  }
}

# 7. GDPR COMPLIANCE CONFIGURATION
resource "google_storage_bucket" "parliament_gdpr_requests" {
  name          = "parliament-gdpr-requests-${random_id.gdpr_bucket_suffix.hex}"
  location      = "EU"
  force_destroy = false

  # Strong encryption
  encryption {
    default_kms_key_name = google_kms_crypto_key.parliament_app_key.id
  }

  # Audit logging
  logging {
    log_bucket = google_storage_bucket.parliament_audit_logs.name
  }

  # Retention policy for GDPR
  retention_policy {
    retention_period = 2592000  # 30 days
    is_locked        = true
  }

  # IAM configuration
  uniform_bucket_level_access = true
  public_access_prevention = "enforced"

  labels = {
    purpose     = "gdpr-compliance"
    data_type   = "personal-data-requests"
    environment = "production"
  }
}

resource "random_id" "gdpr_bucket_suffix" {
  byte_length = 8
}

# 8. CLOUD FUNCTIONS FOR DATA PROTECTION
resource "google_cloudfunctions_function" "parliament_data_protection" {
  name        = "parliament-data-protection"
  description = "Automated data protection and GDPR compliance"
  runtime     = "nodejs18"

  available_memory_mb   = 512
  source_archive_bucket = google_storage_bucket.parliament_functions_source.name
  source_archive_object = google_storage_bucket_object.parliament_protection_function.name
  
  trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.parliament_gdpr_requests.name
  }

  timeout = 540
  entry_point = "dataProtectionHandler"

  service_account_email = google_service_account.parliament_data_protection_sa.email

  environment_variables = {
    PROJECT_ID      = var.project_id
    KMS_KEY_NAME    = google_kms_crypto_key.parliament_app_key.id
    DLP_TEMPLATE    = google_data_loss_prevention_deidentify_template.parliament_dlp_template.name
    GDPR_BUCKET     = google_storage_bucket.parliament_gdpr_requests.name
  }
}

# Service account for data protection function
resource "google_service_account" "parliament_data_protection_sa" {
  account_id   = "parliament-data-protection-sa"
  display_name = "Parliament Data Protection Service Account"
}

# IAM bindings for data protection
resource "google_project_iam_member" "data_protection_kms" {
  project = var.project_id
  role    = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member  = "serviceAccount:${google_service_account.parliament_data_protection_sa.email}"
}

resource "google_project_iam_member" "data_protection_dlp" {
  project = var.project_id
  role    = "roles/dlp.user"
  member  = "serviceAccount:${google_service_account.parliament_data_protection_sa.email}"
}

# 9. BACKUP AND DISASTER RECOVERY
resource "google_firestore_backup_schedule" "parliament_firestore_backup" {
  project  = var.project_id
  database = "(default)"

  retention = "8640000s"  # 100 days

  daily_recurrence {}
}