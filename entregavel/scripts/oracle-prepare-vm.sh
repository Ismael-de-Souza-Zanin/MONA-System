#!/usr/bin/env bash
# Prepara a VM Oracle (Ubuntu) para a MONA: swap, Docker, portas HTTP.
set -euo pipefail

SWAP_GB="${SWAP_GB:-2}"

echo "==> Swap (${SWAP_GB}G) — VM com ~1GB de RAM"
if ! swapon --show | grep -q '/swapfile'; then
  if [ ! -f /swapfile ]; then
    sudo fallocate -l "${SWAP_GB}G" /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_GB * 1024))
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
  fi
  sudo swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi
free -h

echo "==> Abrir HTTP/HTTPS no iptables local (Security List da Oracle já liberada)"
# Inserir antes do REJECT final
if ! sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 4 -p tcp --dport 80 -j ACCEPT
fi
if ! sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
fi
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
sudo netfilter-persistent save || sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null

echo "==> Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker ubuntu
fi
sudo systemctl enable --now docker
docker --version
docker compose version

echo "==> Pronto. Faça logout/login SSH se 'docker' pedir permissão de grupo."
