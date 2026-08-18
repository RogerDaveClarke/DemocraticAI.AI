# GCP Monitoring and Audit Security Configuration
# Comprehensive monitoring, logging, and audit safeguards

# 1. CLOUD AUDIT LOGS CONFIGURATION
resource "google_logging_project_sink" "parliament_audit_sink" {
  name        = "parliament-audit-logs"
  destination = "storage.googleapis.com/${google_storage_bucket.parliament_audit_logs.name}"
  
  filter = <<EOF
protoPayload.serviceName="cloudresourcemanager.googleapis.com" OR
protoPayload.serviceName="compute.googleapis.com" OR
protoPayload.serviceName="run.googleapis.com" OR
protoPayload.serviceName="container.googleapis.com" OR
protoPayload.serviceName="iam.googleapis.com" OR
protoPayload.serviceName="secretmanager.googleapis.com"
EOF

  unique_writer_identity = true
}

# Audit logs storage bucket
resource "google_storage_bucket" "parliament_audit_logs" {
  name          = "parliament-audit-logs-${random_id.bucket_suffix.hex}"
  location      = "US"
  force_destroy = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 2555  # 7 years retention
    }
    action {
      type = "Delete"
    }
  }

  retention_policy {
    retention_period = 220752000  # 7 years in seconds
    is_locked        = true
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# 2. SECURITY COMMAND CENTER
resource "google_scc_notification_config" "parliament_scc_notification" {
  config_id    = "parliament-security-notifications"
  organization = var.organization_id
  description  = "Security notifications for Parliament Explorer"
  pubsub_topic = google_pubsub_topic.parliament_security_alerts.id

  streaming_config {
    filter = "category=\"MALWARE\" OR category=\"PERSISTENCE\" OR category=\"PRIVILEGE_ESCALATION\""
  }
}

# Pub/Sub topic for security alerts
resource "google_pubsub_topic" "parliament_security_alerts" {
  name = "parliament-security-alerts"
}

# 3. CLOUD MONITORING ALERTS
resource "google_monitoring_alert_policy" "parliament_high_error_rate" {
  display_name = "Parliament API High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "High 4xx/5xx error rate"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"parliament-api\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.1

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.parliament_email.name
  ]
}

# Notification channel
resource "google_monitoring_notification_channel" "parliament_email" {
  display_name = "Parliament Security Team"
  type         = "email"
  
  labels = {
    email_address = "security@yourorganization.com"
  }
}

# 4. LOG-BASED METRICS FOR SECURITY EVENTS
resource "google_logging_metric" "parliament_auth_failures" {
  name   = "parliament_auth_failures"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.eventType=\"AUTH_FAILURE\""

  metric_descriptor {
    metric_kind = "COUNTER"
    value_type  = "INT64"
    unit        = "1"
    display_name = "Parliament Authentication Failures"
  }

  label_extractors = {
    "ip_address" = "EXTRACT(jsonPayload.ipAddress)"
    "user_agent" = "EXTRACT(jsonPayload.userAgent)"
  }
}

# Alert on authentication failures
resource "google_monitoring_alert_policy" "parliament_auth_failures_alert" {
  display_name = "Parliament Authentication Failures"
  combiner     = "OR"
  
  conditions {
    display_name = "High authentication failure rate"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/parliament_auth_failures\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.parliament_email.name
  ]
}

# 5. REAL-TIME THREAT DETECTION
resource "google_logging_metric" "parliament_suspicious_activity" {
  name   = "parliament_suspicious_activity"
  filter = <<EOF
resource.type="cloud_run_revision" AND (
  jsonPayload.eventType="RATE_LIMIT_EXCEEDED" OR
  jsonPayload.eventType="BOT_DETECTED" OR
  jsonPayload.eventType="SQL_INJECTION_BLOCKED" OR
  jsonPayload.eventType="XSS_ATTEMPT_BLOCKED"
)
EOF

  metric_descriptor {
    metric_kind = "COUNTER"
    value_type  = "INT64"
    unit        = "1"
    display_name = "Parliament Suspicious Activity"
  }

  label_extractors = {
    "event_type" = "EXTRACT(jsonPayload.eventType)"
    "ip_address" = "EXTRACT(jsonPayload.ipAddress)"
    "severity"   = "EXTRACT(jsonPayload.severity)"
  }
}

# 6. CLOUD FUNCTIONS FOR AUTOMATED RESPONSE
resource "google_cloudfunctions_function" "parliament_security_response" {
  name        = "parliament-security-response"
  description = "Automated security incident response"
  runtime     = "nodejs18"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.parliament_functions_source.name
  source_archive_object = google_storage_bucket_object.parliament_security_function.name
  trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.parliament_security_alerts.name
  }
  timeout = 540
  entry_point = "securityResponseHandler"

  service_account_email = google_service_account.parliament_security_function_sa.email

  environment_variables = {
    PROJECT_ID = var.project_id
  }
}

# Service account for security function
resource "google_service_account" "parliament_security_function_sa" {
  account_id   = "parliament-security-func-sa"
  display_name = "Parliament Security Function Service Account"
}

# 7. DATA LOSS PREVENTION (DLP) API
resource "google_data_loss_prevention_inspect_template" "parliament_dlp_template" {
  parent       = "projects/${var.project_id}"
  description  = "DLP inspection template for Parliament Explorer"
  display_name = "Parliament DLP Template"

  inspect_config {
    info_types {
      name = "EMAIL_ADDRESS"
    }
    info_types {
      name = "CREDIT_CARD_NUMBER"
    }
    info_types {
      name = "PHONE_NUMBER"
    }
    info_types {
      name = "IRELAND_PPSN"  # Irish Personal Public Service Number
    }

    min_likelihood = "LIKELY"
    
    limits {
      max_findings_per_info_type {
        max_findings = 100
        info_type {
          name = "EMAIL_ADDRESS"
        }
      }
    }
  }
}

# 8. CLOUD SECURITY SCANNER
resource "google_cloudfunctions_function" "parliament_security_scan" {
  name        = "parliament-security-scan"
  description = "Automated security scanning"
  runtime     = "python39"

  available_memory_mb   = 512
  source_archive_bucket = google_storage_bucket.parliament_functions_source.name
  source_archive_object = google_storage_bucket_object.parliament_scan_function.name
  
  trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.parliament_scan_schedule.name
  }

  timeout = 540
  entry_point = "security_scan_handler"

  service_account_email = google_service_account.parliament_security_function_sa.email
}

# 9. BUDGET ALERTS FOR ANOMALY DETECTION
resource "google_billing_budget" "parliament_security_budget" {
  billing_account = var.billing_account_id
  display_name    = "Parliament Security Budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
    services = [
      "services/6F81-5844-456A",  # Compute Engine
      "services/24E6-581D-38E5",  # Cloud Run
      "services/95FF-2EF5-5EA1"   # Cloud Storage
    ]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "1000"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  all_updates_rule {
    pubsub_topic = google_pubsub_topic.parliament_budget_alerts.id
  }
}