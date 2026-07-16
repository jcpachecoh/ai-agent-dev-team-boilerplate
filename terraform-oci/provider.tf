terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.30.0"
    }
    cloudinit = {
      source  = "hashicorp/cloudinit"
      version = ">= 2.3.0"
    }
  }

  # OCI Object Storage como backend S3-compatible (us-ashburn-1, siempre disponible).
  # Credenciales via env vars en CI: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  # (Customer Secret Keys del usuario OCI — no son las API Keys del provider).
  # Localmente: export AWS_ACCESS_KEY_ID=<access_key> AWS_SECRET_ACCESS_KEY=<secret>
  backend "s3" {
    bucket                      = "opssynk-terraform-state"
    key                         = "nomina/prod/terraform.tfstate"
    region                      = "us-ashburn-1"
    endpoint                    = "https://axzcymnpgi1t.compat.objectstorage.us-ashburn-1.oraclecloud.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    force_path_style            = true
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}
