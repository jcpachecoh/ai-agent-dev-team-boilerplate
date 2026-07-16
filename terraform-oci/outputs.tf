output "instance_id" {
  description = "OCID de la instancia creada"
  value       = oci_core_instance.nomina_backend.id
}

output "public_ip" {
  description = "IP pública (vacío si assign_public_ip = false)"
  value       = oci_core_instance.nomina_backend.public_ip
}

output "private_ip" {
  description = "IP privada dentro de la VCN"
  value       = oci_core_instance.nomina_backend.private_ip
}

output "ssh_command" {
  description = "Comando SSH para conectarte a la instancia"
  value       = "ssh -i ~/.ssh/id_rsa_opssynk ubuntu@${oci_core_instance.nomina_backend.public_ip != "" ? oci_core_instance.nomina_backend.public_ip : oci_core_instance.nomina_backend.private_ip}"
}

output "db_connection_string_hint" {
  description = "DATABASE_URL para Prisma (postgres corre en Docker dentro de la misma VM)"
  value       = "postgresql://nomina:<TF_VAR_db_password>@postgres:5432/opssynk_db?schema=public"
}
