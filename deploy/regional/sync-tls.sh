#!/usr/bin/env bash
set -euo pipefail
: "${HK_HOST:?}" "${HK_USER:?}" "${HK_KEY:?}" "${CN_HOST:?}" "${CN_USER:?}" "${CN_KEY:?}"
umask 077
key_dir=$(mktemp -d)
trap 'rm -rf -- "$key_dir"' EXIT
printf '%s\n' "$HK_KEY" > "$key_dir/hk"
printf '%s\n' "$CN_KEY" > "$key_dir/cn"
options=(-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$(dirname "$0")/known_hosts")

# TLS material moves only over SSH between the two existing website hosts, never to build artifacts or logs.
ssh "${options[@]}" -i "$key_dir/hk" "$HK_USER@$HK_HOST" \
    'sudo tar -chzf - -C /etc/letsencrypt/live/mayumi.xyz fullchain.pem privkey.pem' |
ssh "${options[@]}" -i "$key_dir/cn" "$CN_USER@$CN_HOST" '
    set -eu
    umask 077
    staging=$(mktemp -d)
    trap '\''rm -rf -- "$staging"'\'' EXIT
    tar -xzf - -C "$staging"
    openssl x509 -in "$staging/fullchain.pem" -noout -checkend 604800
    cert_public=$(openssl x509 -in "$staging/fullchain.pem" -pubkey -noout | openssl pkey -pubin -outform DER | sha256sum)
    key_public=$(openssl pkey -in "$staging/privkey.pem" -pubout -outform DER | sha256sum)
    test "$cert_public" = "$key_public"
    destination=/etc/nginx/ssl/mayumi
    cp "$destination/fullchain.pem" "$staging/old-cert.pem"
    cp "$destination/privkey.pem" "$staging/old-key.pem"
    install -m 644 "$staging/fullchain.pem" "$destination/fullchain.pem"
    install -m 600 "$staging/privkey.pem" "$destination/privkey.pem"
    if ! nginx -t; then
        install -m 644 "$staging/old-cert.pem" "$destination/fullchain.pem"
        install -m 600 "$staging/old-key.pem" "$destination/privkey.pem"
        exit 1
    fi
    systemctl reload nginx
'
