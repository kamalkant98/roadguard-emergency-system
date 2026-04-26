import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./database/index.js";   // ✅ correct import
import mysqlPool from "./database/index.js";       // ✅ import pool



// Load environment variables
dotenv.config();

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error("⚠️ Forced shutdown due to timeout");
    process.exit(1);
  }, 10000);

  try {
    // ✅ Close MySQL connections
    if (mysqlPool) {
      console.log("🔌 Closing MySQL connections...");
      await mysqlPool.end();
      console.log("✅ MySQL connections closed");
    }

    // ✅ Close HTTP server
    if (app.server) {
      console.log("🌐 Closing HTTP server...");
      await new Promise((resolve) => {
        app.server.close(resolve);
      });
      console.log("✅ HTTP server closed");
    }

    clearTimeout(shutdownTimeout);
    console.log("✅ Graceful shutdown completed");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Start the application server
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;

    // ✅ Connect MySQL
    await connectDB();

    // ✅ Start server
    app.server = app.listen(PORT, () => {
      console.log("\n🚀 Server started successfully!");
      console.log(`🌐 Server is running on port: ${PORT}`);
      console.log(`📍 Local URL: http://localhost:${PORT}`);
      console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
      console.log("\n📊 Database Status:");
      console.log("  • MySQL: ✅ Connected");
      console.log("\n✨ Application ready to accept requests\n");
    });

    // Handle server errors
    app.server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Health check endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mysql: "connected"
  });
});

app.get("/health/mysql", async (req, res) => {
  try {
    await mysqlPool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      mysql: "connected"
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      mysql: "disconnected",
      error: error.message
    });
  }
});

// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

// Shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start app
startServer().catch((error) => {
  console.error("❌ Application failed to start:", error);
  process.exit(1);
});

// Export (optional)
export { gracefulShutdown };