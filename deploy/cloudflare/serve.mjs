const TEXT = "text/plain; charset=utf-8"

export function createFetch(assets) {
  return async function fetch(request) {
    const method = request.method.toUpperCase()
    if (method !== "GET" && method !== "HEAD") {
      return plain("Method Not Allowed", 405, { allow: "GET, HEAD" })
    }

    let pathname
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname)
    } catch {
      return plain("Bad Request", 400)
    }
    if (pathname.includes("\0") || pathname.split("/").includes("..")) return plain("Bad Request", 400)
    pathname = pathname.replace(/\/{2,}/g, "/")
    if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1) || "/"
    const key = pathname === "/" ? "/index.html" : pathname
    const asset = assets.get(key)
    if (!asset) return plain("Not Found", 404)

    const headers = {
      "content-type": asset.type,
      "cache-control": asset.cache,
      etag: asset.etag,
      "x-content-type-options": "nosniff",
    }
    if (request.headers.get("if-none-match") === asset.etag) {
      return new Response(null, { status: 304, headers })
    }
    if (method === "HEAD") return new Response(null, { status: 200, headers })
    return new Response(asset.body, { status: 200, headers })
  }
}

function plain(message, status, extra = {}) {
  return new Response(message, {
    status,
    headers: { "content-type": TEXT, "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  })
}
