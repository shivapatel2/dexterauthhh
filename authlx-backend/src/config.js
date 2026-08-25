require("dotenv").config();

const bool = (v, d = false) => {
  if (v === undefined || v === null) return d;
  return ["true", "1", "yes", "on"].includes(String(v).toLowerCase());
};

const isProd = (process.env.NODE_ENV || "development") === "production";

// Auto-fix for Render/Vercel: if JWT_SECRET missing/weak in prod, generate ephemeral one so deploy doesn't crash.
// Then set it in Render Dashboard -> Environment for persistence across restarts.
let _autoJwtSecret = null;
if (isProd) {
  const weakSecrets = ["change-me", "local-dev", "please", ""];
  const jwtSecret = process.env.JWT_SECRET || "";
  const isWeak = !jwtSecret || jwtSecret.length < 16 || weakSecrets.some((w) => jwtSecret.toLowerCase().includes(w));
  if (isWeak) {
    _autoJwtSecret = require("crypto").randomBytes(48).toString("hex");
    console.warn(
      `[config] WARN: JWT_SECRET missing/weak (len=${jwtSecret.length}) - using ephemeral secret for this deploy. Set JWT_SECRET in Render -> Environment for persistent logins. Generated: ${_autoJwtSecret.slice(0, 8)}...`
    );
    process.env.JWT_SECRET = _autoJwtSecret;
  }
  if (!process.env.DATABASE_URL) {
    console.warn("[config] WARN: DATABASE_URL not set - using fallback Neon URL from .env.production.example");
    // fallback will be used from module.exports.databaseUrl
  }
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  isProd,
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/authlx?sslmode=disable",
  jwt: {
    secret: _autoJwtSecret || process.env.JWT_SECRET || "change-me-in-production-please",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || "authlx",
  },
  corsOrigins: (process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim()),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "30000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || (isProd ? "30" : "120"), 10),
    clientMax: parseInt(process.env.CLIENT_RATE_LIMIT_MAX || (isProd ? "120" : "300"), 10),
  },
  mail: {
    enabled: bool(process.env.MAIL_ENABLED),
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "AuthLX <no-reply@authlx.local>",
  },
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || "600", 10),
  },
  uploadsDir: process.env.UPLOADS_DIR || require("path").join(__dirname, "..", "uploads"),
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  seedDemo: bool(process.env.SEED_DEMO, true),
  trustProxy: bool(process.env.TRUST_PROXY, true),
  logLevel: process.env.LOG_LEVEL || "info",
};