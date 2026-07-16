#cloud-config
package_update: true
packages:
  - ca-certificates
  - curl
  - gnupg
  - unzip

runcmd:
  # --- Instalar Docker ---
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - chmod a+r /etc/apt/keyrings/docker.asc
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update -y
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  - systemctl enable --now docker

  # --- Instalar OCI CLI ---
  - bash -c "curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh -o /tmp/install-oci.sh && bash /tmp/install-oci.sh --accept-all-defaults"

  # --- Red interna Docker para todos los servicios ---
  - docker network create nomina-net

  # --- PostgreSQL ---
  - >
    docker run -d --name postgres --restart unless-stopped
    --network nomina-net
    -e POSTGRES_USER=nomina
    -e POSTGRES_PASSWORD=${db_password}
    -e POSTGRES_DB=opssynk_db
    -v pgdata:/var/lib/postgresql/data
    postgres:16-alpine

  # --- Redis ---
  - >
    docker run -d --name redis --restart unless-stopped
    --network nomina-net
    redis:7-alpine --requirepass ${redis_password}

  # --- Traer el .env de producción desde OCI Vault ---
  - bash -c "/root/bin/oci secrets secret-bundle get --secret-id ${vault_secret_ocid} --auth instance_principal --query 'data.\"secret-bundle-content\".content' --raw-output | base64 -d > /opt/nomina.env"

  # --- Login a OCIR y levantar API ---
  - echo "${ocir_auth_token}" | docker login ${region}.ocir.io -u '${ocir_username}' --password-stdin
  - mkdir -p /opt/nomina
  - docker pull ${ocir_image}
  - >
    docker run -d --name nomina-api --restart unless-stopped
    --network nomina-net
    --env-file /opt/nomina.env
    -p 3000:3000
    ${ocir_image}

  # --- Firewall ---
  - iptables -I INPUT -m state --state NEW -p tcp --dport 3000 -j ACCEPT
  - apt-get install -y iptables-persistent
  - netfilter-persistent save
