import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { HttpsProxyAgent } from "https-proxy-agent";
import { IncomingMessage, ServerResponse, ClientRequest } from "http";
import { Socket } from "net";
import { Request, Response } from "express";

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

// Create proxy agent
let proxyAgent = null;
if (AUTH_STYLE === "agent" || AUTH_STYLE === "both") {
  const proxyUrl = `http://${MARS_PROXY.auth.username}:${MARS_PROXY.auth.password}@${MARS_PROXY.host}:${MARS_PROXY.port}`;
  proxyAgent = new HttpsProxyAgent(proxyUrl);
  console.log(
    `Created proxy agent with URL: http://${MARS_PROXY.auth.username}:***@${MARS_PROXY.host}:${MARS_PROXY.port}`
  );
}

// Set headers proactively in the options instead of in onProxyReq
const proxyOptions: Options = {
  target: TARGET_RPC_URL,
  changeOrigin: true,
  agent: proxyAgent, // Add headers to all outgoing requests
  headers: {}, // Event handlers
  on: {
    proxyReq: (
      proxyReq: ClientRequest,
      req: IncomingMessage,
      res: ServerResponse
    ) => {
      if (!proxyReq.headersSent && proxyReq.writable) {
        try {
          // Add header-based authentication if configured
          if (AUTH_STYLE === "headers" || AUTH_STYLE === "both") {
            const auth = Buffer.from(
              `${MARS_PROXY.auth.username}:${MARS_PROXY.auth.password}`
            ).toString("base64"); // Try-catch each header modification individually
            try {
              proxyReq.setHeader("Proxy-Authorization", `Basic ${auth}`);
            } catch (e: unknown) {
              console.warn(
                "Could not set Proxy-Authorization header:",
                e instanceof Error ? e.message : String(e)
              );
            }
            try {
              proxyReq.setHeader("X-Proxy-User", MARS_PROXY.auth.username);
            } catch (e: unknown) {
              console.warn(
                "Could not set X-Proxy-User header:",
                e instanceof Error ? e.message : String(e)
              );
            }
            try {
              proxyReq.setHeader("X-Proxy-Password", MARS_PROXY.auth.password);
            } catch (e: unknown) {
              console.warn(
                "Could not set X-Proxy-Password header:",
                e instanceof Error ? e.message : String(e)
              );
            } // We're NOT setting X-Forwarded-For here - it's now in the main options
            console.log("Attempted to add proxy authentication headers");
          }
        } catch (error: unknown) {
          console.warn(
            "Error setting proxy headers:",
            error instanceof Error ? error.message : String(error)
          );
        }
      } else {
        console.warn("Headers already sent or request not writable");
      }
    },
    error: (
      err: Error,
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage> | Socket
    ) => {
      console.error("Proxy error:", err); // Check if res is a ServerResponse (has headersSent property)
      if ("headersSent" in res && !res.headersSent) {
        if ("writeHead" in res) {
          res.writeHead(500);
          res.end("Something went wrong");
        }
      }
    },
  },
};

// Set the X-Forwarded-For header in the main options instead
if (MARS_PROXY.host) {
  proxyOptions.headers = {
    ...proxyOptions.headers,
    "X-Forwarded-For": MARS_PROXY.host,
  };
}

const rpcProxy = createProxyMiddleware(proxyOptions);

// Status endpoint - must come BEFORE the catch-all proxy
app.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "online",
    proxy: `${MARS_PROXY.host}:${MARS_PROXY.port}`,
    targetRpc: TARGET_RPC_URL,
    authStyle: AUTH_STYLE,
  });
});

app.use("/", rpcProxy);

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
  console.log(`Proxying requests to: ${TARGET_RPC_URL}`);
  console.log(`Using MarsProxies at: ${MARS_PROXY.host}:${MARS_PROXY.port}`);
});
