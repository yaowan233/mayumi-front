#!/usr/bin/env bash
set -euo pipefail

[[ $(id -u) == 0 ]] || { echo 'Run as root' >&2; exit 1; }
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
site=/etc/nginx/sites-available/default
snippets=/etc/nginx/snippets
nginx -t
test -f "$site"
backup=$(mktemp -d /etc/nginx/mayumi-routing-backup.XXXXXX)
cp -p "$site" "$backup/default"
mkdir -p "$snippets"
for name in upstream routes; do
    target="$snippets/mayumi-frontend-$name.conf"
    if [[ -e "$target" ]]; then cp -p "$target" "$backup/$name.conf"; fi
done

rollback() {
    cp -p "$backup/default" "$site"
    for name in upstream routes; do
        target="$snippets/mayumi-frontend-$name.conf"
        if [[ -e "$backup/$name.conf" ]]; then
            cp -p "$backup/$name.conf" "$target"
        else
            rm -f -- "$target"
        fi
    done
    if nginx -t; then systemctl reload nginx || true; fi
    echo "HK routing update failed; configuration restored from $backup" >&2
}
trap rollback ERR

install -m 644 "$source_dir/nginx-hk-frontend-upstream.conf" "$snippets/mayumi-frontend-upstream.conf"
install -m 644 "$source_dir/nginx-hk-frontend-routes.conf" "$snippets/mayumi-frontend-routes.conf"
python3 - "$site" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text()
include = 'include /etc/nginx/snippets/mayumi-frontend-routes.conf;'
if include not in text:
    # Replace only the known legacy Next.js API block, leaving the site's
    # certificates, backend limits and OAuth relay configuration untouched.
    text, count = re.subn(r'location\s*=\s*/api/recommendations\s*\{[^{}]*\}', include, text)
    if count != 1:
        raise SystemExit('Expected exactly one legacy recommendations location')
    path.write_text(text)
elif text.count(include) != 1:
    raise SystemExit('Expected exactly one frontend routes include')
PY
nginx -t
systemctl reload nginx
trap - ERR
echo "HK frontend service routes active; previous configuration: $backup"
