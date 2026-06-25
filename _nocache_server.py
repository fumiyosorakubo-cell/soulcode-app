import http.server
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('',4173),H).serve_forever()
