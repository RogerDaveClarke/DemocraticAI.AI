# GCP Container Security Configuration for Parliament Explorer
# Enhanced container and application-level security

# 1. BINARY AUTHORIZATION FOR CONTAINER SECURITY
resource "google_binary_authorization_policy" "parliament_policy" {
  admission_whitelist_patterns {
    name_pattern = "gcr.io/replace-with-your-project-id/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    
    require_attestations_by = [
      google_binary_authorization_attestor.parliament_attestor.name,
    ]
  }

  # Allow Google-built images
  admission_whitelist_patterns {
    name_pattern = "gcr.io/google-containers/*"
  }
  admission_whitelist_patterns {
    name_pattern = "gcr.io/google_containers/*"
  }
}

# Container image attestor
resource "google_binary_authorization_attestor" "parliament_attestor" {
  name = "parliament-attestor"
  description = "Parliament Explorer container attestor"

  attestation_authority_note {
    note_reference = google_container_analysis_note.parliament_note.name
    public_keys {
      ascii_armored_pgp_public_key = file("parliament-attestor-key.pub")
    }
  }
}

resource "google_container_analysis_note" "parliament_note" {
  name = "parliament-attestor-note"
  attestation_authority {
    hint {
      human_readable_name = "Parliament Explorer Attestor"
    }
  }
}

# 2. VULNERABILITY SCANNING
resource "google_container_analysis_occurrence" "parliament_vulnerability_scan" {
  note_name    = google_container_analysis_note.parliament_vuln_note.name
  resource_uri = "gcr.io/replace-with-your-project-id/parliament-api:latest"

  vulnerability {
    severity = "HIGH"
    details {
      affected_cpe_uri = "cpe:/o:debian:debian_linux:9"
      affected_package = "libssl1.1"
      affected_version {
        name = "1.1.0"
      }
      fixed_cpe_uri = "cpe:/o:debian:debian_linux:9"
      fixed_package = "libssl1.1"
      fixed_version {
        name = "1.1.0-security-patch"
      }
    }
  }
}

# 3. SECRET MANAGER INTEGRATION
resource "google_secret_manager_secret" "parliament_api_key" {
  secret_id = "parliament-api-key"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "parliament_api_key_version" {
  secret      = google_secret_manager_secret.parliament_api_key.id
  secret_data = var.parliament_api_key
}

# API key for production
resource "google_secret_manager_secret" "parliament_production_api_key" {
  secret_id = "parliament-production-api-key"
  
  replication {
    user_managed {
      replicas {
        location = "us-west1"
      }
      replicas {
        location = "us-east1"
      }
    }
  }
}

# Database connection string
resource "google_secret_manager_secret" "parliament_db_connection" {
  secret_id = "parliament-db-connection"
  
  replication {
    automatic = true
  }
}

# 4. CLOUD KMS FOR ENCRYPTION
resource "google_kms_key_ring" "parliament_keyring" {
  name     = "parliament-keyring"
  location = "us-west1"
}

resource "google_kms_crypto_key" "parliament_encryption_key" {
  name     = "parliament-encryption-key"
  key_ring = google_kms_key_ring.parliament_keyring.id
  purpose  = "ENCRYPT_DECRYPT"

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# 5. CLOUD RUN SECURITY CONFIGURATION
resource "google_cloud_run_service" "parliament_api_secure" {
  name     = "parliament-api-secure"
  location = "us-west1"

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "100"
        "autoscaling.knative.dev/minScale"      = "1"
        "run.googleapis.com/execution-environment" = "gen2"
        "run.googleapis.com/cpu-throttling"    = "false"
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.parliament_connector.name
        "run.googleapis.com/vpc-access-egress" = "private-ranges-only"
      }
    }

    spec {
      service_account_name = google_service_account.parliament_api_sa.email
      
      containers {
        image = "gcr.io/replace-with-your-project-id/parliament-api:latest"
        
        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
          requests = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        env {
          name = "NODE_ENV"
          value = "production"
        }

        env {
          name = "VALID_API_KEYS"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.parliament_production_api_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.parliament_db_connection.secret_id
              key  = "latest"
            }
          }
        }

        # Security context
        security_context {
          run_as_user  = 1001
          run_as_group = 1001
          read_only_root_filesystem = true
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# 6. VPC CONNECTOR FOR PRIVATE NETWORKING
resource "google_vpc_access_connector" "parliament_connector" {
  name          = "parliament-vpc-connector"
  region        = "us-west1"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.parliament_vpc.name
  
  min_throughput = 300
  max_throughput = 1000
}

# 7. CLOUD RUN IAM BINDINGS
resource "google_cloud_run_service_iam_member" "parliament_api_invoker" {
  service  = google_cloud_run_service.parliament_api_secure.name
  location = google_cloud_run_service.parliament_api_secure.location
  role     = "roles/run.invoker"
  member   = "allUsers"  # Or restrict to specific users/service accounts
}

# 8. WORKLOAD IDENTITY FOR GKE (if migrating)
resource "google_service_account_iam_member" "parliament_workload_identity" {
  service_account_id = google_service_account.parliament_api_sa.name
  role              = "roles/iam.workloadIdentityUser"
  member            = "serviceAccount:replace-with-your-project-id.svc.id.goog[parliament/parliament-ksa]"
}