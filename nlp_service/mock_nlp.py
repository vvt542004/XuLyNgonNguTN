from http.server import BaseHTTPRequestHandler, HTTPServer
import json

HOST = '0.0.0.0'
PORT = 8001


class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_POST(self):
        if self.path != '/classify':
            self._set_headers(404)
            self.wfile.write(json.dumps({'detail': 'Not found'}).encode())
            return

        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length).decode('utf-8') if length else ''
        try:
            data = json.loads(body) if body else {}
            text = data.get('text', '')
        except Exception:
            text = ''

        # Very simple deterministic mock: if contains 'spam' or 'hate' return spam/hateful
        label = 0
        label_name = 'normal'
        confidence = 0.95
        t = text.lower()
        if 'spam' in t:
            label = 3; label_name = 'spam'; confidence = 0.98
        elif 'hate' in t or 'hateful' in t:
            label = 2; label_name = 'hateful'; confidence = 0.99
        elif 'offend' in t or 'offensive' in t:
            label = 1; label_name = 'offensive'; confidence = 0.9

        resp = {
            'label': label,
            'label_name': label_name,
            'confidence': confidence,
        }
        self._set_headers(200)
        self.wfile.write(json.dumps(resp).encode('utf-8'))


def run():
    server = HTTPServer((HOST, PORT), Handler)
    print(f"Mock NLP server running on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == '__main__':
    run()
