import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { cacheControl, etag, isTextAsset, responseType, urlPathFor } from "../deploy/cloudflare/manifest.mjs"

const root = path.resolve(import.meta.dirname, "..")
const distDir = path.join(root, "dist")
const outDir = process.env.CONVERTIZE_UPLOAD_DIR || "/opt/cursor/artifacts"

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

const distFiles = (await filesIn(distDir)).sort()
const assets = []
for (const file of distFiles) {
  const relative = path.relative(distDir, file)
  if (relative === ".nojekyll") continue
  const bytes = await readFile(file)
  const urlPath = urlPathFor(relative)
  const text = isTextAsset(relative)
  assets.push({
    urlPath,
    relative,
    text,
    bytes,
    type: responseType(relative),
    cache: cacheControl(urlPath),
    etag: etag(bytes),
  })
}

const index = assets.find((asset) => asset.urlPath === "/index.html")
if (!index) throw new Error("dist/index.html is missing")

const modules = []
const mapLines = []
assets.forEach((asset, indexNumber) => {
  const id = String(indexNumber).padStart(4, "0")
  const name = textName(id, asset.text)
  asset.moduleName = name
  modules.push({
    name,
    mime: asset.text ? "text/plain" : "application/octet-stream",
    encoding: asset.text ? "utf8" : "base64",
    content: asset.text ? asset.bytes.toString("utf8") : asset.bytes.toString("base64"),
  })
  mapLines.push(
    `  ["${asset.urlPath}", { body: m${indexNumber}, type: ${JSON.stringify(asset.type)}, cache: ${JSON.stringify(asset.cache)}, etag: ${JSON.stringify(asset.etag)} }],`,
  )
})
mapLines.push(
  `  ["/", { body: m${assets.findIndex((asset) => asset.urlPath === "/index.html")}, type: ${JSON.stringify(index.type)}, cache: ${JSON.stringify(index.cache)}, etag: ${JSON.stringify(index.etag)} }],`,
)

const imports = assets
  .map((asset, indexNumber) => `import m${indexNumber} from "./${asset.moduleName}";`)
  .join("\n")

const worker = `import { createFetch } from "./serve.mjs";
${imports}

const assets = new Map([
${mapLines.join("\n")}
]);

export default { fetch: createFetch(assets) };
`

const serve = await readFile(path.join(root, "deploy/cloudflare/serve.mjs"), "utf8")
modules.unshift(
  { name: "serve.mjs", mime: "application/javascript+module", encoding: "utf8", content: serve },
  { name: "worker.mjs", mime: "application/javascript+module", encoding: "utf8", content: worker },
)

const metadata = {
  main_module: "worker.mjs",
  compatibility_date: "2026-11-08",
  compatibility_flags: [],
  bindings: [],
  observability: {
    enabled: true,
    redact_query_string: true,
    logs: { enabled: true, invocation_logs: true },
    traces: { enabled: true },
  },
}

const upload = {
  metadata,
  modules,
  routes: assets.map((asset) => ({
    path: asset.urlPath,
    module: asset.moduleName,
    response_mime: asset.type,
    upload_mime: asset.text ? "text/plain" : "application/octet-stream",
    encoding: asset.text ? "utf8" : "base64",
    bytes: asset.bytes.length,
    etag: asset.etag,
    cache: asset.cache,
  })),
  upload_request: {
    method: "PUT",
    path: "/accounts/{account_id}/workers/scripts/convertize",
    documentation: "https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/",
    content_type: "multipart/form-data",
    parts: [
      "metadata: application/json body of the metadata object. main_module is worker.mjs.",
      "Each modules[] item is one part. The part name and filename are modules[].name. The part Content-Type is modules[].mime. utf8 content is the part bytes. base64 content is decoded to raw bytes before the part is appended.",
    ],
  },
}

await mkdir(outDir, { recursive: true })
const uploadPath = path.join(outDir, "upload.json")
await writeFile(uploadPath, JSON.stringify(upload))
const uploadStat = await stat(uploadPath)
const uncompressed = modules.reduce((sum, module) => {
  const size = module.encoding === "base64" ? Buffer.from(module.content, "base64").length : Buffer.byteLength(module.content)
  return sum + size
}, 0)
console.log(JSON.stringify({ modules: modules.length, routes: assets.length + 1, uncompressed_bytes: uncompressed, upload_bytes: uploadStat.size }))

function textName(id, text) {
  return text ? `payloads/f${id}.txt` : `payloads/f${id}.bin`
}
