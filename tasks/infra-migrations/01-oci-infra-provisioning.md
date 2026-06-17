# Task: Provisionar infraestructura OCI base

**Domain:** `[INFRA]`  
**Assigned Agent:** infra-engineer  
**Status:** `pending`  
**Created:** 2026-06-06  
**Depends On:** none  
**SDD Ref:** §2 Arquitectura Fase 1, §10 Estimado de costos

---

## Context

Crear todos los recursos OCI necesarios para alojar el backend de Palos de Leños en Fase 1.
Todo debe quedar provisionado vía Terraform para facilitar la futura migración a OKE (Fase 2).

La VM ARM A1 es Free Tier permanente. El OCI DB System es el único recurso con costo (~$15 USD/mes).

---

## Requirements

### VCN y Networking

- [ ] Crear VCN `palos-vcn` con CIDR `10.0.0.0/16`
- [ ] Crear subnet pública `palos-public-subnet` (10.0.1.0/24) — VM + Load Balancer
- [ ] Crear subnet privada `palos-private-subnet` (10.0.2.0/24) — DB System (sin IP pública)
- [ ] Internet Gateway adjunto a la subnet pública
- [ ] Security list: abrir puertos 22 (SSH), 80 (HTTP), 443 (HTTPS) en subnet pública
- [ ] Security list: abrir puerto 5432 solo desde subnet pública hacia subnet privada

### VM ARM Ampere A1

- [ ] Shape: `VM.Standard.A1.Flex` — 4 OCPUs, 24 GB RAM
- [ ] OS: Ubuntu 22.04 LTS (imagen Oracle)
- [ ] Ubicar en subnet pública con IP pública asignada
- [ ] SSH key pair generado y almacenado de forma segura
- [ ] Boot volume: 50 GB mínimo

### OCI Load Balancer

- [ ] Shape: `flexible`, bandwidth 10 Mbps (Free Tier)
- [ ] Backend set apuntando a la VM en puerto 80
- [ ] Health check: `GET /api/health` → HTTP 200
- [ ] Listener en puerto 80 (HTTPS se configura en tarea 02)

### OCI DB System PostgreSQL

- [ ] Shape: `VM.Standard.E4.Flex` — 1 OCPU, 16 GB RAM
- [ ] PostgreSQL 14
- [ ] Ubicar en subnet privada (sin IP pública)
- [ ] Nombre de base de datos: `palos_db`
- [ ] Backup automático habilitado, retención 7 días
- [ ] Anotar IP privada para uso en tareas posteriores

### OCI Object Storage

- [ ] Crear bucket `palos-assets` en región `sa-saopaulo-1`
- [ ] Visibilidad: privada
- [ ] Generar Customer Secret Key (S3-compatible) y almacenar en Vault
- [ ] Anotar namespace del tenant para endpoint S3-compatible

### OCI Vault

- [ ] Crear Vault `palos-vault` (Virtual Private Vault — Free Tier)
- [ ] Crear master encryption key
- [ ] Crear secrets vacíos como placeholders (se poblan en tarea 04):
  - `palos-db-url`
  - `palos-elevenlabs-key`
  - `palos-jwt-secret`
  - `palos-nextauth-secret`
  - `palos-oci-access-key`
  - `palos-oci-secret-key`

### Terraform

- [ ] Todo lo anterior codificado en Terraform en `infra/terraform/oci/`
- [ ] `terraform.tfvars.example` con todas las variables requeridas
- [ ] `terraform plan` sin errores antes de aplicar
- [ ] State guardado en OCI Object Storage backend (bucket separado `palos-tf-state`)

---

## Acceptance Criteria

- [ ] `ssh ubuntu@<vm-ip>` conecta exitosamente
- [ ] `curl http://<load-balancer-ip>/api/health` retorna HTTP 200 (después de tarea 03)
- [ ] DB System visible en consola OCI, estado `AVAILABLE`
- [ ] Bucket `palos-assets` creado y accesible con las credenciales S3
- [ ] Vault creado con los 6 secrets placeholder
- [ ] `terraform destroy` + `terraform apply` reproduce el entorno desde cero

---

## Files to Create

- `infra/terraform/oci/main.tf`
- `infra/terraform/oci/variables.tf`
- `infra/terraform/oci/outputs.tf`
- `infra/terraform/oci/networking.tf`
- `infra/terraform/oci/compute.tf`
- `infra/terraform/oci/database.tf`
- `infra/terraform/oci/storage.tf`
- `infra/terraform/oci/vault.tf`
- `infra/terraform/oci/terraform.tfvars.example`
