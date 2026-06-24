import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import transactionRoutes from "./routes/transactions.js";
import summaryRoutes from "./routes/summary.js";
import { errorHandler } from "./middleware/errorHandler.js";

const require = createRequire(import.meta.url);
const app: import("express").Application = express();

app.use(helmet({
  contentSecurityPolicy: false, // 暫時關閉 CSP 以確保載入正常
}));

app.use(cors({
  origin: [config.frontendUrl, "https://finance-drive.netlify.app"],
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/summary", summaryRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", env: config.nodeEnv }));

// Serve frontend static files in production
if (config.isProduction) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const possiblePaths = [
    path.join(__dirname, "../../../frontend/dist"),
    path.join(process.cwd(), "frontend/dist"),
    path.join(process.cwd(), "../frontend/dist"),
    path.join(__dirname, "../../../frontend/dist"),
    path.join(process.cwd(), "frontend/dist"),
    path.join(process.cwd(), "../frontend/dist")
  ];
  
  const fs = require('fs');
  let frontendDist = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      frontendDist = p;
      break;
    }
  }
  
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(frontendDist, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

app.use(errorHandler);

export default app;
