# === Autenticación OCI (API Key del usuario/servicio) ===
variable "tenancy_ocid" {
  description = "OCID del tenancy OCI"
  type        = string
}

variable "user_ocid" {
  description = "OCID del usuario (o service account) que ejecuta Terraform"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint de la API key subida al usuario en OCI"
  type        = string
}

variable "private_key_path" {
  description = "Ruta local a la private key de la API key (no se versiona)"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "Región OCI donde se despliega, ej. sa-saopaulo-1, us-ashburn-1"
  type        = string
  default     = "sa-saopaulo-1"
}

# === Recursos existentes (creados en OS-637) ===
variable "compartment_id" {
  description = "OCID del compartment donde vive OpsSynk"
  type        = string
}

variable "subnet_id" {
  description = "OCID de la subnet (privada o pública) ya provisionada en OS-637"
  type        = string
}

variable "nsg_id" {
  description = "OCID del Network Security Group para el backend de Nómina"
  type        = string
}

# === Configuración de la instancia ===
variable "instance_display_name" {
  description = "Nombre visible de la instancia"
  type        = string
  default     = "opssynk-nomina-prod"
}

variable "instance_shape" {
  description = "Shape OCI: VM.Standard.A1.Flex (ARM/Always Free) o VM.Standard.E3.Flex (x86/pago)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "Número de OCPUs"
  type        = number
  default     = 2
}

variable "instance_memory_gbs" {
  description = "Memoria en GB"
  type        = number
  default     = 12
}

variable "assign_public_ip" {
  description = "Si la instancia debe tener IP pública directa (false si va detrás del Load Balancer de OS-642)"
  type        = bool
  default     = false
}

variable "ssh_public_key_path" {
  description = "Ruta local a la llave pública SSH para acceso a la instancia"
  type        = string
  default     = "~/.ssh/id_rsa_opssynk.pub"
}

# === Configuración del contenedor (desplegado automáticamente vía cloud-init) ===
variable "ocir_image" {
  description = "Imagen del backend en OCI Registry (OCIR), ej: sa-saopaulo-1.ocir.io/<namespace>/opssynk/nomina-api:latest"
  type        = string
}

variable "ocir_auth_token" {
  description = "Auth token OCIR para docker login (generado en OCI: perfil de usuario > Auth Tokens). Pásalo por TF_VAR o CI secret, nunca en tfvars versionado."
  type        = string
  sensitive   = true
}

variable "ocir_username" {
  description = "Usuario OCIR en formato <namespace>/<oci_username>"
  type        = string
}

variable "nomina_env_content" {
  description = "Contenido completo del .env de producción (DATABASE_URL, JWT_SECRET, etc.), en texto plano. Terraform lo sube como secret cifrado a Vault — nunca lo pongas en terraform.tfvars versionado, pásalo por TF_VAR o un archivo .env local ignorado por git."
  type        = string
  sensitive   = true
}

# === PostgreSQL + Redis en Docker (misma VM) ===
variable "db_password" {
  description = "Password de PostgreSQL en Docker. Pásalo por TF_VAR_db_password, nunca en tfvars."
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Password de Redis en Docker. Pásalo por TF_VAR_redis_password, nunca en tfvars."
  type        = string
  sensitive   = true
}

variable "db_backup_bucket_name" {
  description = "Nombre del bucket de Object Storage donde se guardan los backups de pg_dump"
  type        = string
  default     = "opssynk-nomina-db-backups"
}

variable "db_backup_retention_days" {
  description = "Días de retención de los backups en el bucket (se borran automáticamente por lifecycle policy)"
  type        = number
  default     = 30
}
