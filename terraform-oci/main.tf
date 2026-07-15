# Availability domain disponible en el compartment/región
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Imagen Ubuntu 22.04 para el shape seleccionado (ARM o x86 según instance_shape)
data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order                = "DESC"
}

# Cloud-init: instala Docker, hace login a OCIR, trae el .env desde Vault
# y levanta el contenedor del backend. Esto es lo que hace el deployment
# "automático" al crear (o recrear) la instancia.
data "cloudinit_config" "nomina_init" {
  gzip          = false
  base64_encode = true

  part {
    filename     = "cloud-config.yaml"
    content_type = "text/cloud-config"
    content = templatefile("${path.module}/cloud-init.yaml.tpl", {
      ocir_image        = var.ocir_image
      ocir_username     = var.ocir_username
      ocir_auth_token   = var.ocir_auth_token
      vault_secret_ocid = oci_vault_secret.nomina_env.id
      region            = var.region
      db_password       = var.db_password
      redis_password    = var.redis_password
    })
  }
}

resource "oci_core_instance" "nomina_backend" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = var.instance_display_name
  shape                = var.instance_shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gbs
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    assign_public_ip = var.assign_public_ip
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_arm.images[0].id
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = data.cloudinit_config.nomina_init.rendered
  }

  # Cada vez que cambie la imagen del contenedor (nuevo tag) o el cloud-init,
  # Terraform recrea/actualiza la instancia con el user_data nuevo.
  # Para despliegues frecuentes sin recrear la VM, ver la Opción B (Ansible/SSH)
  # documentada más abajo en el README.

  freeform_tags = {
    project     = "opssynk"
    module      = "nomina"
    environment = "production"
    managed_by  = "terraform"
  }

  lifecycle {
    ignore_changes = [
      source_details[0].source_id, # evita recrear la VM por actualizaciones menores de imagen base
    ]
  }
}
