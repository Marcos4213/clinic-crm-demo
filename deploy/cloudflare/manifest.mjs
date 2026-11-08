import { createHash } from "node:crypto"
import { extname } from "node:path"

const TEXT_EXTENSIONS = new Set([".html", ".js", ".css", ".svg", ".json", ".txt", ".map"])

export function responseType(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "application/javascript; charset=utf-8"
    case ".css":
      return "text/css; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    case ".json":
    case ".map":
      return "application/json"
    case ".woff2":
      return "font/woff2"
    case ".woff":
      return "font/woff"
    default:
      return "application/octet-stream"
  }
}

export function isTextAsset(filePath) {
  return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase())
}

export function cacheControl(urlPath) {
  if (urlPath === "/index.html") return "no-cache"
  if (/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i.test(urlPath)) {
    return "public, max-age=31536000, immutable"
  }
  return "public, max-age=3600"
}

export function etag(bytes) {
  return `"${createHash("sha256").update(bytes).digest("hex")}"`
}

export function urlPathFor(relativePath) {
  const normalized = relativePath.split("\\").join("/")
  return normalized === "index.html" ? "/index.html" : `/${normalized}`
}
