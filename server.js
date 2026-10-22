import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const defaultDataFile = join(root, "data", "recipes.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function sendJson(res, status, value) {
  send(res, status, types[".json"], JSON.stringify(value));
}

async function serveRecipes(res, dataFile) {
  try {
    const text = await readFile(dataFile, "utf8");
    JSON.parse(text);
    send(res, 200, types[".json"], text);
  } catch {
    sendJson(res, 500, { error: "Could not load recipes" });
  }
}

async function serveRecipe(res, dataFile, id) {
  let data;
  try {
    data = JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    return sendJson(res, 500, { error: "Could not load recipes" });
  }
  const recipe = data.recipes?.find((r) => r.id === id);
  if (!recipe) return sendJson(res, 404, { error: "Recipe not found" });
  sendJson(res, 200, { household: { name: data.household?.name }, recipe });
}

async function serveStatic(res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return send(res, 404, "text/plain; charset=utf-8", "Not found");
  }
  if (decoded.endsWith("/")) decoded += "index.html";
  const file = resolve(publicDir, "." + decoded);
  if (!file.startsWith(publicDir + sep)) {
    return send(res, 404, "text/plain; charset=utf-8", "Not found");
  }
  try {
    const body = await readFile(file);
    send(res, 200, types[extname(file)] ?? "application/octet-stream", body);
  } catch {
    send(res, 404, "text/plain; charset=utf-8", "Not found");
  }
}

export function createServer({ dataFile = defaultDataFile } = {}) {
  return http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "text/plain; charset=utf-8", "Method not allowed");
    }
    if (pathname === "/api/recipes") return serveRecipes(res, dataFile);
    const apiMatch = pathname.match(/^\/api\/recipes\/([^/]+)$/);
    if (apiMatch) return serveRecipe(res, dataFile, safeDecode(apiMatch[1]));
    if (/^\/recipes\/[^/]+$/.test(pathname)) return serveStatic(res, "/recipe.html");
    return serveStatic(res, pathname);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log(`Pantry running at http://localhost:${port}`);
  });
}
