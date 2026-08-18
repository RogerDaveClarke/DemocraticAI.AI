# GCP Network Security Configuration for Parliament Explorer
# Comprehensive network-level security safeguards

# 1. VPC NETWORK WITH PRIVATE CONNECTIVITY
resource "google_compute_network" "parliament_vpc" {
  name                    = "parliament-vpc"
  auto_create_subnetworks = false
  routing_mode           = "REGIONAL"
}

# Private subnet for backend services
resource "google_compute_subnetwork" "parliament_private_subnet" {
  name          = "parliament-private-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-west1"
  network       = google_compute_network.parliament_vpc.id
  
  # Enable VPC Flow Logs for monitoring
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling       = 0.5
    metadata           = "INCLUDE_ALL_METADATA"
  }
  
  # Enable private Google access
  private_ip_google_access = true
}

# 2. CLOUD ARMOR FOR DDoS PROTECTION AND WAF
resource "google_compute_security_policy" "parliament_security_policy" {
  name        = "parliament-security-policy"
  description = "Cloud Armor security policy for Parliament Explorer"

  # Default rule - allow all
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }

  # Block known malicious IPs
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [
          "192.0.2.0/24",    # Example malicious range
          "203.0.113.0/24"   # Example malicious range
        ]
      }
    }
    description = "Block known malicious IPs"
  }

  # Rate limiting rule
  rule {
    action   = "rate_based_ban"
    priority = "1001"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 3600
    }
    description = "Rate limit: 100 requests per minute"
  }

  # Block SQL injection attempts
  rule {
    action   = "deny(403)"
    priority = "1002"
    match {
      expr {
        expression = "has(request.headers['user-agent']) && request.headers['user-agent'].contains('sqlmap')"
      }
    }
    description = "Block SQL injection tools"
  }

  # Block cross-site scripting (XSS) attempts
  rule {
    action   = "deny(403)"
    priority = "1003"
    match {
      expr {
        expression = "has(request.query) && request.query.contains('<script>')"
      }
    }
    description = "Block XSS attempts in query parameters"
  }

  # Geographic restrictions (example: block from certain countries)
  rule {
    action   = "deny(403)"
    priority = "1004"
    match {
      expr {
        expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
      }
    }
    description = "Geographic access restrictions"
  }

  # Advanced threat detection
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable = true
    }
  }
}

# 3. LOAD BALANCER WITH SSL/TLS TERMINATION
resource "google_compute_global_address" "parliament_ip" {
  name = "parliament-global-ip"
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "parliament_ssl" {
  name = "parliament-ssl-cert"

  managed {
    domains = ["parliament.yourdomain.com"]
  }
}

# Load Balancer
resource "google_compute_url_map" "parliament_lb" {
  name            = "parliament-load-balancer"
  default_service = google_compute_backend_service.parliament_backend.id

  # Security headers
  header_action {
    response_headers_to_add {
      header_name  = "Strict-Transport-Security"
      header_value = "max-age=31536000; includeSubDomains; preload"
      replace      = true
    }
    response_headers_to_add {
      header_name  = "X-Content-Type-Options"
      header_value = "nosniff"
      replace      = true
    }
    response_headers_to_add {
      header_name  = "X-Frame-Options"
      header_value = "DENY"
      replace      = true
    }
  }
}

# 4. PRIVATE SERVICE CONNECT FOR DATABASE ACCESS
resource "google_compute_global_forwarding_rule" "parliament_psc" {
  name                  = "parliament-psc-forwarding-rule"
  target                = google_compute_target_https_proxy.parliament_proxy.id
  port_range           = "443"
  ip_address           = google_compute_global_address.parliament_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# 5. FIREWALL RULES
resource "google_compute_firewall" "parliament_allow_lb_to_backends" {
  name    = "parliament-allow-lb-to-backends"
  network = google_compute_network.parliament_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]  # Google Load Balancer ranges
  target_tags   = ["parliament-backend"]
}

resource "google_compute_firewall" "parliament_deny_all" {
  name    = "parliament-deny-all-ingress"
  network = google_compute_network.parliament_vpc.name

  deny {
    protocol = "all"
  }

  direction     = "INGRESS"
  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}

# 6. VPC PEERING FOR SECURE DATABASE ACCESS
resource "google_compute_network_peering" "parliament_db_peering" {
  name         = "parliament-db-peering"
  network      = google_compute_network.parliament_vpc.id
  peer_network = "projects/${var.project_id}/global/networks/default"
}