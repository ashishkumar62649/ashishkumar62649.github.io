const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");

const root = path.resolve(__dirname, "..");
const contentPath = path.join(root, "content", "site.json");
const indexPath = path.join(root, "index.html");
const uploadsDir = path.join(root, "assets", "uploads");
const backupsDir = path.join(root, "backups");
const clientScripts = [
  "./js/content-store.js",
  "./js/editor-layout.js",
  "./js/content-renderer.js",
  "./js/editor-engine.js",
  "./js/animations.js",
  "./js/main.js"
];
const port = Number(process.env.PORT || 3000);
const host = "127.0.0.1";
const maxUploadSize = 5 * 1024 * 1024;
const allowedUploadTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

const send = (res, status, body, type = "application/json; charset=utf-8") => {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(payload);
};

const readBody = (req, limit = 1024 * 1024) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const timestamp = () => new Date().toISOString().replace(/T/, "-").replace(/\..+/, "").replace(/:/g, "-");

const safeJoin = (base, requestedPath) => {
  const decoded = decodeURIComponent(requestedPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const resolved = path.resolve(base, normalized.replace(/^[/\\]/, ""));
  if (!resolved.startsWith(base)) {
    return null;
  }
  return resolved;
};

const sanitizeName = (name) => {
  const parsed = path.parse(name || "upload");
  const base = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${base}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}${ext}`;
};

const parseMultipartUpload = (buffer, contentType) => {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!boundaryMatch) {
    throw new Error("Missing multipart boundary.");
  }

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const start = buffer.indexOf(boundary);
  if (start === -1) {
    throw new Error("Invalid multipart payload.");
  }

  let cursor = start + boundary.length + 2;
  const nextBoundary = buffer.indexOf(Buffer.concat([Buffer.from("\r\n"), boundary]), cursor);
  if (nextBoundary === -1) {
    throw new Error("Invalid multipart content.");
  }

  const part = buffer.subarray(cursor, nextBoundary);
  const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
  if (headerEnd === -1) {
    throw new Error("Invalid upload headers.");
  }

  const headers = part.subarray(0, headerEnd).toString("utf8");
  const file = part.subarray(headerEnd + 4);
  const filenameMatch = /filename="([^"]+)"/i.exec(headers);
  const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(headers);

  if (!filenameMatch) {
    throw new Error("No file found in upload.");
  }

  return {
    filename: filenameMatch[1],
    contentType: (typeMatch?.[1] || "application/octet-stream").trim().toLowerCase(),
    file
  };
};

const handleSaveContent = async (req, res) => {
  const body = await readBody(req, 2 * 1024 * 1024);
  let nextContent;
  try {
    nextContent = JSON.parse(body.toString("utf8"));
  } catch {
    send(res, 400, { error: "Content must be valid JSON." });
    return;
  }

  await fs.mkdir(path.dirname(contentPath), { recursive: true });
  await fs.mkdir(backupsDir, { recursive: true });

  try {
    const current = await fs.readFile(contentPath, "utf8");
    await fs.writeFile(path.join(backupsDir, `site-${timestamp()}.json`), current, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const formatted = `${JSON.stringify(nextContent, null, 2)}\n`;
  JSON.parse(formatted);
  await fs.writeFile(contentPath, formatted, "utf8");
  await updateIndexSnapshot(formatted);
  send(res, 200, { ok: true });
};

const updateIndexSnapshot = async (formattedJson) => {
  const indexHtml = await fs.readFile(indexPath, "utf8");
  const snapshot = `<script type="application/json" id="site-content-snapshot">\n${formattedJson.trim()}\n    </script>`;
  const scriptTags = clientScripts.map((src) => `    <script src="${src}"></script>`).join("\n");
  const pattern = /<script\s+type="application\/json"\s+id="site-content-snapshot">[\s\S]*?<\/script>/;
  const nextHtml = pattern.test(indexHtml)
    ? indexHtml.replace(pattern, snapshot)
    : indexHtml.replace(/\s*<script src="\.\/(?:script|js\/main)\.js"><\/script>/, `\n    ${snapshot}\n${scriptTags}`);
  await fs.writeFile(indexPath, nextHtml, "utf8");
};

const handleUpload = async (req, res) => {
  const contentType = req.headers["content-type"] || "";
  const body = await readBody(req, maxUploadSize + 1024 * 64);
  const upload = parseMultipartUpload(body, contentType);

  if (upload.file.length > maxUploadSize) {
    send(res, 413, { error: "Image is larger than 5MB." });
    return;
  }

  if (!allowedUploadTypes.has(upload.contentType)) {
    send(res, 415, { error: "Only jpg, jpeg, png, webp, gif, and safe svg images are accepted." });
    return;
  }

  if (upload.contentType === "image/svg+xml") {
    const svg = upload.file.toString("utf8").toLowerCase();
    if (svg.includes("<script") || svg.includes("javascript:") || svg.includes("onload=")) {
      send(res, 415, { error: "This SVG contains unsafe script-like content." });
      return;
    }
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = sanitizeName(upload.filename);
  const savedPath = path.join(uploadsDir, filename);
  await fs.writeFile(savedPath, upload.file);
  send(res, 200, { path: `./assets/uploads/${filename}` });
};

const serveFile = async (req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = safeJoin(root, urlPath);
  if (!filePath) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch (error) {
    send(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Server error", "text/plain; charset=utf-8");
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/editor/status") {
      send(res, 200, { running: true, localOnly: true });
      return;
    }

    if (req.method === "GET" && req.url === "/api/content") {
      const content = await fs.readFile(contentPath, "utf8");
      JSON.parse(content);
      send(res, 200, content);
      return;
    }

    if (req.method === "POST" && req.url === "/api/content") {
      await handleSaveContent(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/upload") {
      await handleUpload(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/reset") {
      send(res, 501, { error: "Reset is not enabled. Restore a file from backups/ if needed." });
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveFile(req, res);
      return;
    }

    send(res, 405, { error: "Method not allowed." });
  } catch (error) {
    send(res, 500, { error: error.message || "Server error." });
  }
});

server.listen(port, host, () => {
  const url = `http://localhost:${port}`;
  console.log("");
  console.log("Portfolio editor running:");
  console.log(url);
  console.log("");
  exec(`start "" "${url}"`);
});
