import express from "express";
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

const app = express();

app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false, // disable CSP in dev for Vite HMR
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(express.json({ limit: "10kb" })); // body size limit
app.use(cookieParser());
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/summary", summaryRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", env: config.nodeEnv }));

app.use(errorHandler);

export default app;
