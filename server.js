import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from './routes/habits.js';
import logRoutes from './routes/log.js';
import aiRoutes from './routes/ai.js';
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Allow requests with no origin (curl, same-origin, server-to-server)
    if (!origin) return cb(null, true);
    // Allow any localhost / 127.0.0.1 origin in development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    // Allow anything explicitly listed in CLIENT_URL (comma-separated)
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);
app.use(notFound);
app.use(errorHandler);

// --- MODIFIED BOTTOM BLOCK FOR VERCEL ---

const PORT = process.env.PORT || 8000;

// 1. Establish database connection out in the global scope
// Serverless environments reuse open connections across function invocations
connectDB().catch((err) => console.error("Initial DB connection fallback error:", err));

// 2. ONLY start a continuous listening process if running LOCALLY
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Local development server running on http://localhost:${PORT}`);
  });
}

// 3. CRITICAL FOR VERCEL: Export the app instance 
export default app;