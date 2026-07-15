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

  # Backend remoto recomendado para que el state no viva solo en tu máquina
  # ni en el runner de GitHub Actions (evita drift y conflictos de equipo).
  # Descomenta y ajusta cuando tengas el bucket creado (puede ser el mismo
  # bucket de Object Storage / Cloudflare R2 que ya usas).
  #
  # backend "s3" {
  #   bucket                      = "opssynk-terraform-state"
  #   key                         = "nomina/prod/terraform.tfstate"
  #   region                      = "us-ashburn-1"
  #   endpoint                    = "https://<namespace>.compat.objectstorage.us-ashburn-1.oraclecloud.com"
  #   skip_region_validation      = true
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   force_path_style            = true
  # }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}
