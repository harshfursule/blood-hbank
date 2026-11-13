require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB             = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");
const { initExpiryCron }    = require("./cron/expiryCron");
const errorHandler          = require("./middleware/errorHandler");
const { notFound }          = require("./middleware/notFound");

const app = express();

// ─── Connect to Services ──────────────────────────────────────────────────────
connectDB();
connectCloudinary();
initExpiryCron();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app"); // Auto-allows Vercel preview deployments

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // Parse httpOnly cookies (refresh token)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🩸 Blood Bank API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth.routes"));
app.use("/api/donors",        require("./routes/donor.routes"));
app.use("/api/blood-units",   require("./routes/bloodUnit.routes"));
app.use("/api/hospitals",     require("./routes/hospital.routes"));
app.use("/api/requests",      require("./routes/bloodRequest.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/analytics",     require("./routes/analytics.routes"));
app.use("/api/reports",       require("./routes/report.routes"));
// app.use("/api/blood-units",  require("./routes/bloodUnit.routes"));
// app.use("/api/requests",     require("./routes/bloodRequest.routes"));
// app.use("/api/dispatches",   require("./routes/dispatch.routes"));
// app.use("/api/hospitals",    require("./routes/hospital.routes"));
// app.use("/api/notifications",require("./routes/notification.routes"));
// app.use("/api/analytics",    require("./routes/analytics.routes"));
// app.use("/api/reports",      require("./routes/report.routes"));

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Blood Bank Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app; // For testing
