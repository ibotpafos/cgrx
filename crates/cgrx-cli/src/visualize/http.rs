use std::io::{Read, Write};

use serde_json::json;

const MAX_REQUEST_BYTES: usize = 8 * 1024;
const MAX_DRAIN_BYTES: usize = 64 * 1024;

pub(super) struct HttpRequest {
    pub(super) method: String,
    pub(super) path: String,
    headers: Vec<(String, String)>,
    query: Vec<(String, String)>,
}

impl HttpRequest {
    pub(super) fn read(stream: &mut impl Read) -> Result<Self, HttpResponse> {
        let mut bytes = Vec::new();
        let mut chunk = [0_u8; 1024];
        loop {
            let count = stream
                .read(&mut chunk)
                .map_err(|error| HttpResponse::json_error(400, "cgrx.http", &error.to_string()))?;
            if count == 0 {
                break;
            }
            bytes.extend_from_slice(&chunk[..count]);
            let complete = bytes.windows(4).any(|window| window == b"\r\n\r\n");
            if bytes.len() > MAX_REQUEST_BYTES && (complete || bytes.len() >= MAX_DRAIN_BYTES) {
                return Err(HttpResponse::json_error(
                    413,
                    "cgrx.request_too_large",
                    "request headers exceed 8192 bytes",
                ));
            }
            if complete {
                break;
            }
        }
        let text = std::str::from_utf8(&bytes)
            .map_err(|_| HttpResponse::json_error(400, "cgrx.http", "request is not UTF-8"))?;
        let mut lines = text.split("\r\n");
        let mut request_line = lines
            .next()
            .ok_or_else(|| HttpResponse::json_error(400, "cgrx.http", "missing request line"))?
            .split_whitespace();
        let method = request_line.next().unwrap_or_default().to_owned();
        let target = request_line.next().unwrap_or_default();
        let version = request_line.next().unwrap_or_default();
        if method.is_empty()
            || !target.starts_with('/')
            || !matches!(version, "HTTP/1.0" | "HTTP/1.1")
            || request_line.next().is_some()
        {
            return Err(HttpResponse::json_error(
                400,
                "cgrx.http",
                "invalid request line",
            ));
        }
        let (path, query_text) = target.split_once('?').map_or((target, ""), |parts| parts);
        let mut query = Vec::new();
        if !query_text.is_empty() {
            for pair in query_text.split('&') {
                let (name, value) = pair.split_once('=').unwrap_or((pair, ""));
                query.push((percent_decode(name)?, percent_decode(value)?));
            }
        }
        let mut headers = Vec::new();
        for line in lines.take_while(|line| !line.is_empty()) {
            let (name, value) = line.split_once(':').ok_or_else(|| {
                HttpResponse::json_error(400, "cgrx.http", "invalid request header")
            })?;
            headers.push((name.trim().to_ascii_lowercase(), value.trim().to_owned()));
        }
        Ok(Self {
            method,
            path: path.to_owned(),
            headers,
            query,
        })
    }

    pub(super) fn header(&self, name: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(candidate, _)| candidate == name)
            .map(|(_, value)| value.as_str())
    }

    pub(super) fn query(&self, name: &str) -> Option<&str> {
        self.query
            .iter()
            .find(|(candidate, _)| candidate == name)
            .map(|(_, value)| value.as_str())
    }
}

fn percent_decode(value: &str) -> Result<String, HttpResponse> {
    let bytes = value.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b'+' => decoded.push(b' '),
            b'%' if index + 2 < bytes.len() => {
                let high = hex(bytes[index + 1]);
                let low = hex(bytes[index + 2]);
                let (Some(high), Some(low)) = (high, low) else {
                    return Err(HttpResponse::json_error(
                        400,
                        "cgrx.invalid_query",
                        "malformed percent escape",
                    ));
                };
                decoded.push(high * 16 + low);
                index += 2;
            }
            b'%' => {
                return Err(HttpResponse::json_error(
                    400,
                    "cgrx.invalid_query",
                    "truncated percent escape",
                ));
            }
            byte => decoded.push(byte),
        }
        index += 1;
    }
    String::from_utf8(decoded).map_err(|_| {
        HttpResponse::json_error(400, "cgrx.invalid_query", "query is not valid UTF-8")
    })
}

const fn hex(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        b'A'..=b'F' => Some(byte - b'A' + 10),
        _ => None,
    }
}

pub(super) struct HttpResponse {
    status: u16,
    content_type: &'static str,
    body: Vec<u8>,
    headers: Vec<(&'static str, &'static str)>,
    head: bool,
}

impl HttpResponse {
    pub(super) fn html(body: &str) -> Self {
        Self::new(200, "text/html; charset=utf-8", body.as_bytes().to_vec())
    }

    pub(super) fn css(body: &str) -> Self {
        Self::new(200, "text/css; charset=utf-8", body.as_bytes().to_vec())
    }

    pub(super) fn javascript(body: &str) -> Self {
        Self::new(
            200,
            "text/javascript; charset=utf-8",
            body.as_bytes().to_vec(),
        )
    }

    pub(super) fn json(value: serde_json::Value) -> Self {
        Self::new(
            200,
            "application/json; charset=utf-8",
            serde_json::to_vec(&value).expect("JSON response serializes"),
        )
    }

    pub(super) fn json_error(status: u16, code: &str, detail: &str) -> Self {
        Self::new(
            status,
            "application/json; charset=utf-8",
            serde_json::to_vec(&json!({"error":{"code":code,"detail":detail}}))
                .expect("JSON error serializes"),
        )
    }

    fn new(status: u16, content_type: &'static str, body: Vec<u8>) -> Self {
        Self {
            status,
            content_type,
            body,
            headers: Vec::new(),
            head: false,
        }
    }

    pub(super) fn with_header(mut self, name: &'static str, value: &'static str) -> Self {
        self.headers.push((name, value));
        self
    }

    pub(super) fn head(mut self, head: bool) -> Self {
        self.head = head;
        self
    }

    pub(super) fn write(self, stream: &mut impl Write) -> Result<(), String> {
        let reason = match self.status {
            200 => "OK",
            400 => "Bad Request",
            401 => "Unauthorized",
            404 => "Not Found",
            405 => "Method Not Allowed",
            413 => "Content Too Large",
            _ => "Internal Server Error",
        };
        write!(
            stream,
            "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'sha256-vQnVxtiQpewIpQCMj/ALHF581pcFXLN32YUjABX6xYs='; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'\r\nConnection: close\r\n",
            self.status,
            reason,
            self.content_type,
            self.body.len()
        )
        .map_err(|error| error.to_string())?;
        for (name, value) in self.headers {
            write!(stream, "{name}: {value}\r\n").map_err(|error| error.to_string())?;
        }
        write!(stream, "\r\n").map_err(|error| error.to_string())?;
        if !self.head {
            stream
                .write_all(&self.body)
                .map_err(|error| error.to_string())?;
        }
        stream.flush().map_err(|error| error.to_string())
    }
}
