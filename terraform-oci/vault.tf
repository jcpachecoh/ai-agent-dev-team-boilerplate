# Vault y Key existentes — creados manualmente en la consola OCI
data "oci_kms_vaults" "existing" {
  compartment_id = var.compartment_id
}

locals {
  vault_id           = "ocid1.vault.oc1.sa-bogota-1.i5vfig5haaff4.abrgcljr4x36hkyrlu7x4hp7fyz4cbemvopdl7l4pyuodjh5liutp6cky5gq"
  vault_key_id       = "ocid1.key.oc1.sa-bogota-1.i5vfig5haaff4.abrgcljrb7ruepbpc2vmzwcnj6ptwkstjuh7hczffmceaz3lscdkzo34ev6q"
}

# Secret: .env completo de la app (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.)
resource "oci_vault_secret" "nomina_env" {
  compartment_id = var.compartment_id
  vault_id       = local.vault_id
  key_id         = local.vault_key_id
  secret_name    = "nomina-env-prod"

  secret_content {
    content_type = "BASE64"
    content      = base64encode(var.nomina_env_content)
  }
}

# Dynamic Group: agrupa instancias del compartment para Instance Principal
resource "oci_identity_dynamic_group" "nomina_instances" {
  compartment_id = var.tenancy_ocid
  name           = "nomina-instances"
  description    = "Instancias de Nomina con acceso a Vault y Object Storage"
  matching_rule  = "ALL {instance.compartment.id = '${var.compartment_id}'}"
}

# Policy: permite leer secrets y escribir backups
resource "oci_identity_policy" "nomina_policy" {
  compartment_id = var.compartment_id
  name           = "nomina-instances-policy"
  description    = "Permite a las instancias de Nomina leer secrets del Vault y subir backups"

  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.nomina_instances.name} to read secret-bundles in compartment id ${var.compartment_id}",
    "Allow dynamic-group ${oci_identity_dynamic_group.nomina_instances.name} to manage objects in compartment id ${var.compartment_id} where target.bucket.name='${var.db_backup_bucket_name}'",
  ]
}

# Policy a nivel tenancy: Object Storage necesita permiso explícito para aplicar lifecycle rules
resource "oci_identity_policy" "objectstorage_lifecycle" {
  compartment_id = var.tenancy_ocid
  name           = "objectstorage-lifecycle-sa-bogota"
  description    = "Permite al servicio Object Storage aplicar lifecycle policies en el compartment"

  statements = [
    "Allow service objectstorage-${var.region} to manage object-family in compartment id ${var.compartment_id}",
  ]
}
