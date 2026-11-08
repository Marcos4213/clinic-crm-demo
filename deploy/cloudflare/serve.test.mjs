import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { createFetch } from "./serve.mjs"
import { cacheControl, etag, isTextAsset, responseType, urlPathFor } from "./manifest.mjs"

const root = path.resolve(import.meta.dirname, "../..")
const distDir = path.join(root, "dist")
const uploadPath = process.env.CONVERTIZE_UPLOAD || "/opt/cursor/artifacts/upload.json"

async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await filesIn(full)))
    else if (entry.isFile()) files.push(full)
  }
  return files
}

async function distAssets() {
  const files = (await filesIn(distDir)).sort()
  const assets = new Map()
  for (const file of files) {
    const relative = path.relative(distDir, file)
    if (relative === ".nojekyll") continue
    const bytes = await readFile(file)
    const urlPath = urlPathFor(relative)
    const text = isTextAsset(relative)
    assets.set(urlPath, {
      body: text ? bytes.toString("utf8") : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      type: responseType(relative),
      cache: cacheControl(urlPath),
      etag: etag(bytes),
      bytes,
      text,
    })
  }
  const index = assets.get("/index.html")
  assets.set("/", { ...index, bytes: index.bytes, text: true })
  return assets
}

test("real dist is served with hash routing, cache policy, and non-HTML 404s", async () => {
  const assets = await distAssets()
  const fetch = createFetch(assets)
  const origin = "https://convertize.devbrasil.online"

  const html = await fetch(new Request(`${origin}/`))
  assert.equal(html.status, 200)
  assert.equal(html.headers.get("content-type"), "text/html; charset=utf-8")
  assert.equal(html.headers.get("cache-control"), "no-cache")
  const page = await html.text()
  assert.match(page, /<script type="module"/)
  assert.doesNotMatch(page, /service_role|sb_secret_|XAI_API_KEY=/)

  const script = page.match(/src="\.\/assets\/[^"]+\.js"/)[0].slice(7, -1)
  const scriptResponse = await fetch(new Request(`${origin}/${script}`))
  assert.equal(scriptResponse.status, 200)
  assert.equal(scriptResponse.headers.get("content-type"), "application/javascript; charset=utf-8")
  assert.equal(scriptResponse.headers.get("cache-control"), "public, max-age=31536000, immutable")
  assert.match(scriptResponse.headers.get("etag"), /^"[a-f0-9]{64}"$/)
  const code = await scriptResponse.text()
  assert.match(code, /Convertize/)
  assert.doesNotMatch(code, /^<!doctype/i)

  const head = await fetch(new Request(`${origin}/`, { method: "HEAD" }))
  assert.equal(head.status, 200)
  assert.equal(head.headers.get("content-type"), "text/html; charset=utf-8")
  assert.equal(await head.text(), "")

  const cached = await fetch(new Request(`${origin}/${script}`, { headers: { "if-none-match": scriptResponse.headers.get("etag") } }))
  assert.equal(cached.status, 304)
  assert.equal(await cached.text(), "")

  const missing = await fetch(new Request(`${origin}/assets/missing-abcdefgh.js`))
  assert.equal(missing.status, 404)
  assert.equal(missing.headers.get("content-type"), "text/plain; charset=utf-8")
  assert.equal(await missing.text(), "Not Found")

  const demoPath = await fetch(new Request(`${origin}/demo`))
  assert.equal(demoPath.status, 404)
  assert.equal(demoPath.headers.get("content-type"), "text/plain; charset=utf-8")

  const posted = await fetch(new Request(`${origin}/`, { method: "POST" }))
  assert.equal(posted.status, 405)
  assert.equal(posted.headers.get("allow"), "GET, HEAD")
})

test("upload.json modules match the dist bytes and the Worker import map", async () => {
  const upload = JSON.parse(await readFile(uploadPath, "utf8"))
  assert.equal(upload.metadata.main_module, "worker.mjs")
  assert.equal(upload.metadata.compatibility_date, "2026-11-08")
  assert.deepEqual(upload.metadata.bindings, [])
  assert.equal(upload.metadata.observability.enabled, true)
  assert.equal(upload.metadata.observability.redact_query_string, true)
  assert.equal(upload.upload_request.method, "PUT")
  assert.equal(upload.upload_request.path, "/accounts/{account_id}/workers/scripts/convertize")

  const byName = new Map(upload.modules.map((module) => [module.name, module]))
  const worker = byName.get("worker.mjs")
  const serve = byName.get("serve.mjs")
  assert.equal(worker.mime, "application/javascript+module")
  assert.equal(worker.encoding, "utf8")
  assert.equal(serve.mime, "application/javascript+module")
  assert.doesNotMatch(worker.content, /text_blob|data_blob/)
  assert.doesNotMatch(JSON.stringify(upload.metadata), /text_blob|data_blob|assets/)

  const assets = await distAssets()
  for (const route of upload.routes) {
    const disk = assets.get(route.path)
    assert.ok(disk, route.path)
    assert.equal(route.response_mime, disk.type)
    assert.equal(route.cache, disk.cache)
    assert.equal(route.etag, disk.etag)
    const module = byName.get(route.module)
    assert.equal(module.mime, route.upload_mime)
    if (route.encoding === "utf8") {
      assert.equal(module.mime, "text/plain")
      assert.equal(module.content, disk.bytes.toString("utf8"))
    } else {
      assert.equal(module.mime, "application/octet-stream")
      assert.equal(module.encoding, "base64")
      assert.deepEqual(Buffer.from(module.content, "base64"), disk.bytes)
    }
    assert.ok(worker.content.includes(`from "./${route.module}"`), route.module)
  }

  const decoded = new Map()
  for (const route of upload.routes) {
    const module = byName.get(route.module)
    const body = route.encoding === "utf8" ? module.content : Uint8Array.from(Buffer.from(module.content, "base64")).buffer
    decoded.set(route.path, { body, type: route.response_mime, cache: route.cache, etag: route.etag })
  }
  const response = await createFetch(decoded)(new Request("https://convertize.devbrasil.online/assets/does-not-exist.js"))
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8")
  assert.equal(await response.text(), "Not Found")
})
