import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { componentTagger } from "lovable-tagger";

/**
 * Raster images are heavy and no longer ship inside the Pages build artifact.
 * They live in ./cdn-assets (git-tracked, but NOT copied into ./dist) and are
 * served for free from GitHub via the jsDelivr CDN. This keeps the deployed
 * artifact tiny so the "syncing_files" Pages deploy step never chokes again,
 * no matter how many blog images get added.
 *
 * - In dev: a middleware serves the files straight from ./cdn-assets.
 * - In build: every "/foo/bar.png" style reference is rewritten to
 *     https://cdn.jsdelivr.net/gh/<owner>/<repo>@<sha>/cdn-assets/foo/bar.png
 *   The commit SHA makes each URL immutable, so new post images appear
 *   instantly on deploy and are cached permanently by the CDN + browsers.
 *
 * Adding future images: drop the file under ./cdn-assets/... and reference it
 * with a normal absolute path (e.g. src="/blog/new-post/diagram.png"). No other
 * changes needed — dev serves it locally, prod serves it from the CDN.
 */
const OWNER_REPO = "vk0812/vk0812.github.io";
const CDN_DIR = "cdn-assets";
const RASTER_EXT = ["png", "jpg", "jpeg", "webp", "gif", "avif"];
const RASTER_RE = new RegExp(`\\.(?:${RASTER_EXT.join("|")})$`, "i");

// Only rewrite absolute raster refs inside quotes/parens: "/blog/x.png", url("/x.png"), etc.
const REWRITE_RE = new RegExp(
  `(["'\`(])\\/([^"'\`()\\s]+?\\.(?:${RASTER_EXT.join("|")}))`,
  "gi",
);

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function resolveSha(): string {
  const envSha = process.env.GITHUB_SHA;
  if (envSha && envSha.trim()) return envSha.trim();
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    // No git context (shallow clone, etc.) — fall back to the branch ref.
    return "main";
  }
}

function cdnAssetsPlugin(isBuild: boolean) {
  const base = `https://cdn.jsdelivr.net/gh/${OWNER_REPO}@${resolveSha()}/${CDN_DIR}`;
  return {
    name: "cdn-assets",
    enforce: "pre" as const,

    // Dev: serve the offloaded files from disk so local paths keep working.
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (!RASTER_RE.test(url)) return next();
        const filePath = path.join(__dirname, CDN_DIR, decodeURIComponent(url));
        if (!filePath.startsWith(path.join(__dirname, CDN_DIR))) return next();
        fs.readFile(filePath, (err, data) => {
          if (err) return next();
          const ext = url.split(".").pop()!.toLowerCase();
          res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
          res.end(data);
        });
      });
    },

    // Build: point every raster reference at the CDN.
    transform(code: string, id: string) {
      if (!isBuild) return null;
      if (id.includes("node_modules")) return null;
      if (!/\.(?:tsx?|jsx?|css|mdx?)$/.test(id.split("?")[0])) return null;
      if (!REWRITE_RE.test(code)) return null;
      REWRITE_RE.lastIndex = 0;
      return {
        code: code.replace(REWRITE_RE, (_m, q: string, p: string) => `${q}${base}/${p}`),
        map: null,
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  plugins: [
    cdnAssetsPlugin(command === "build"),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
