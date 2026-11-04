#!/usr/bin/env bash
set -euo pipefail

release_id=${1:?commit SHA required}
[[ "$release_id" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release ID' >&2; exit 1; }
release="/opt/mayumi/releases/$release_id"
current=/opt/mayumi/web
[[ -L "$current" ]] || { echo 'Expected /opt/mayumi/web to be a release symlink' >&2; exit 1; }
previous=$(readlink -f "$current")

# Production dependencies are packaged in CI, never installed or built on the small CN node.
tar -xzf "$release/mayumi-runtime.tgz" -C "$release"
test -s "$release/.next/BUILD_ID"
test -f "$release/node_modules/next/dist/bin/next"
mkdir -p "$release/.next/cache"
chmod 600 "$release/.env"
chown -R mayumi:mayumi "$release"
install -m 644 "$release/deploy/regional/mayumi-front.service" /etc/systemd/system/mayumi-front.service
nginx -t
systemctl daemon-reload

ln -s "$release" /opt/mayumi/web.next
mv -Tf /opt/mayumi/web.next "$current"
systemctl restart mayumi-front
if ! curl --fail --silent --show-error --retry 8 --retry-connrefused --retry-delay 2 --max-time 30 \
    -o /dev/null http://127.0.0.1:3000/; then
    ln -s "$previous" /opt/mayumi/web.rollback
    mv -Tf /opt/mayumi/web.rollback "$current"
    systemctl restart mayumi-front
    echo 'CN deployment failed; previous release restored' >&2
    exit 1
fi
systemctl enable mayumi-front
rm -f "$release/mayumi-runtime.tgz"
echo "CN release active: $release_id"

# Keep the active and previous releases for rollback; only remove task-owned SHA directories.
for candidate in /opt/mayumi/releases/*; do
    [[ -d "$candidate" && ! -L "$candidate" ]] || continue
    [[ "${candidate##*/}" =~ ^[0-9a-f]{40}$ ]] || continue
    [[ "$candidate" == "$release" || "$candidate" == "$previous" ]] && continue
    rm -rf -- "$candidate"
done
