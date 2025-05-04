import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { HttpsProxyAgent } from "https-proxy-agent";

dotenv.config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;
const TARGET_RPC_URL = process.env.TARGET_RPC_URL;

const MARS_PROXY = {
  host: process.env.MARS_PROXY_HOST || "country-us.marsproxies.com",
  port: parseInt(process.env.MARS_PROXY_PORT || "9999"),
  auth: {
    username: process.env.MARS_PROXY_USERNAME || "your_username",
    password: process.env.MARS_PROXY_PASSWORD || "your_password",
  },
};

// Authentication style
// Set to 'agent' for proxy-authorization via agent (most common)
// Set to 'headers' for authentication via custom headers
// Set to 'both' to use both methods (for troubleshooting)
const AUTH_STYLE = process.env.AUTH_STYLE || "both";

let proxyAgent = null;
if (AUTH_STYLE === "agent" || AUTH_STYLE === "both") {
  const proxyUrl = `http://${MARS_PROXY.auth.username}:${MARS_PROXY.auth.password}@${MARS_PROXY.host}:${MARS_PROXY.port}`;
  proxyAgent = new HttpsProxyAgent(proxyUrl);
  console.log(
    `Created proxy agent with URL: http://${MARS_PROXY.auth.username}:***@${MARS_PROXY.host}:${MARS_PROXY.port}`
  );
}

const rpcProxy = createProxyMiddleware({
  target: TARGET_RPC_URL,
  changeOrigin: true,
  agent: proxyAgent,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Check if headers have already been sent to avoid ERR_HTTP_HEADERS_SENT
      if (res.headersSent) {
        console.warn(
          "Headers already sent, skipping proxy header modifications"
        );
        return;
      }

      // Add header-based authentication if configured
      if (AUTH_STYLE === "headers" || AUTH_STYLE === "both") {
        try {
          // Method 1: Basic auth header (some proxies accept this)
          const auth = Buffer.from(
            `${MARS_PROXY.auth.username}:${MARS_PROXY.auth.password}`
          ).toString("base64");
          proxyReq.setHeader("Proxy-Authorization", `Basic ${auth}`);
          console.log("Added Proxy-Authorization header");

          // Method 2: Custom headers (some proxies use these)
          proxyReq.setHeader("X-Proxy-User", MARS_PROXY.auth.username);
          proxyReq.setHeader("X-Proxy-Password", MARS_PROXY.auth.password);
          console.log("Added custom proxy auth headers");
        } catch (error) {
          console.error("Error setting proxy headers:", error);
        }
      }

      try {
        proxyReq.setHeader("X-Forwarded-For", MARS_PROXY.host);
      } catch (error) {
        console.error("Error setting X-Forwarded-For header:", error);
      }
    },
    error: (err, req, res) => {
      console.error("Proxy error:", err);
      if ("writeHead" in res) {
        res.writeHead(500);
        res.end("Something went wrong");
      } else {
        if (res.writable) {
          res.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
          res.end("Something went wrong");
        }
      }
    },
  },
});

app.use("/", rpcProxy);

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
  console.log(`Proxying requests to: ${TARGET_RPC_URL}`);
  console.log(`Using MarsProxies at: ${MARS_PROXY.host}:${MARS_PROXY.port}`);
});
