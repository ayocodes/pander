import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

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

const rpcProxy = createProxyMiddleware({
  target: TARGET_RPC_URL,
  changeOrigin: true,
  agent: {
    host: MARS_PROXY.host,
    port: MARS_PROXY.port,
    auth: `${MARS_PROXY.auth.username}:${MARS_PROXY.auth.password}`,
  },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader("X-Forwarded-For", MARS_PROXY.host);
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
