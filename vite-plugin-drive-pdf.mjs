import https from "node:https";
import { URL } from "node:url";

function httpsGetBuffer(url, redirectsLeft = 8) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          rejectUnauthorized: false,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        },
        (res) => {
          if (
            redirectsLeft > 0 &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            const nextUrl = new URL(res.headers.location, url).href;
            res.resume();
            httpsGetBuffer(nextUrl, redirectsLeft - 1).then(resolve).catch(reject);
            return;
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode || 500,
              headers: res.headers,
              buffer: Buffer.concat(chunks),
            });
          });
        },
      )
      .on("error", reject);
  });
}

async function downloadGoogleDrivePdf(fileId) {
  const urls = [
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
  ];

  for (const url of urls) {
    let result = await httpsGetBuffer(url);
    const contentType = String(result.headers["content-type"] || "");

    if (contentType.includes("text/html")) {
      const html = result.buffer.toString("utf8");
      const confirm = html.match(/confirm=([0-9A-Za-z_]+)/)?.[1];
      if (confirm) {
        result = await httpsGetBuffer(
          `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=${confirm}`,
        );
      }
    }

    const finalType = String(result.headers["content-type"] || "");
    const head = result.buffer.slice(0, 4).toString("utf8");
    if (head === "%PDF" || finalType.includes("pdf")) {
      return result;
    }
  }

  return null;
}

export function drivePdfProxyPlugin() {
  return {
    name: "drive-pdf-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = String(req.url || "");
        const match = url.match(/^\/drive-pdf\/([a-zA-Z0-9_-]+)/);
        if (!match) return next();

        const fileId = match[1];

        try {
          const result = await downloadGoogleDrivePdf(fileId);
          if (!result) {
            res.statusCode = 403;
            res.end("Drive PDF not downloadable — add file to public/course-files/");
            return;
          }

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", "inline");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.end(result.buffer);
        } catch {
          res.statusCode = 502;
          res.end("Drive PDF proxy error");
        }
      });
    },
  };
}
