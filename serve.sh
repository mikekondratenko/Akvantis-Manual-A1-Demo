#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Serve the manual locally, from the right folder, on a known URL.
#
# WHY THIS EXISTS
#
# The prototype cannot be opened by double-clicking it. The 3D view photographs
# both sides of `a1-manual.html` through iframes and html2canvas, and `file://`
# blocks that — the sheet stays blank. The document root has to be `public/`.
#
# Same shape as ../Digital-Passport-Builder/serve.sh; a different default port so
# both can run at once.
#
#   ./serve.sh          → http://localhost:8091
#   ./serve.sh 9000     → another port, when 8091 is taken
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PORT="${1:-8091}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/public" && pwd)"
PAGE="http://localhost:${PORT}/"

echo
echo "  Akvantis A1 Manual Guide — demo"
echo "  root  ${ROOT}"
echo "  open  ${PAGE}"
echo "  doc   http://localhost:${PORT}/a1-manual.html"
echo
echo "  Ctrl-C to stop."
echo

# Open the browser once the server is up (macOS `open`; silently skipped elsewhere).
( sleep 1; command -v open >/dev/null && open "${PAGE}" ) &

# Без кэша. Обычный http.server отдаёт файлы с Last-Modified, и браузер
# держит у себя прежнюю версию документа и картинок — правка лежит на диске, а
# на экране старое. Для рабочего сервера это хуже любой скорости: каждый ответ
# идёт с `Cache-Control: no-store`, и обновление страницы всегда берёт диск.
exec python3 - "${PORT}" "${ROOT}" <<'PY'
import sys, functools, http.server
port, root = int(sys.argv[1]), sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    def send_head(self):
        # `/a1-manual` → `a1-manual.html`, как Cloudflare (2026-10-07): конструктор по http
        # открывает документ без расширения, и простой http.server отвечал на это 404 —
        # в кадре вместо листа стояло «File not found».
        import os
        p = self.path.split('?', 1)[0].split('#', 1)[0]
        if p != '/' and '.' not in p.rsplit('/', 1)[-1] and os.path.isfile(os.path.join(root, p.lstrip('/') + '.html')):
            self.path = self.path.replace(p, p + '.html', 1)
        # не отвечать 304 на If-Modified-Since — всегда свежий файл
        self.headers.replace_header('If-Modified-Since', '') if 'If-Modified-Since' in self.headers else None
        return super().send_head()
http.server.ThreadingHTTPServer(('', port), functools.partial(H, directory=root)).serve_forever()
PY
