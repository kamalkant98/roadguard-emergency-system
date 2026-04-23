import dotenv from "dotenv";
import mongoose from "mongoose";
import mysql from "mysql2/promise.js";
import { DB_NAME } from "./constants.js";
import connectDB from "./database/index.js";
import { app } from "./app.js";

// Load environment variables
dotenv.config({ path: "./env" });

// MySQL Connection Pool Configuration
const mysqlConfig = {
    host: process.env.DB_HOST || "mysql",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root123",
    database: process.env.DB_NAME || "roadguard",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Create MySQL connection pool
const mysqlPool = mysql.createPool(mysqlConfig);

// Test MySQL connection and setup event listeners
const initializeMySQL = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log("✅ Connected to MySQL Database successfully");
        
        // Test the connection with a simple query
        await connection.query("SELECT 1");
        console.log("✅ MySQL connection verified");
        
        connection.release();
        
        // Monitor pool events
        mysqlPool.on('connection', (connection) => {
            console.log('🔌 New MySQL connection established');
        });
        
        mysqlPool.on('enqueue', () => {
            console.log('⏳ MySQL query queued - waiting for available connection');
        });
        
        return mysqlPool;
    } catch (error) {
        console.error("❌ MySQL Connection Error:", error.message);
        console.error("Error Code:", error.code);
        console.error("Error Errno:", error.errno);
        
        // Retry connection after 5 seconds
        console.log("🔄 Retrying MySQL connection in 5 seconds...");
        setTimeout(initializeMySQL, 5000);
        throw error;
    }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
    
    const shutdownTimeout = setTimeout(() => {
        console.error("⚠️ Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);
    
    try {
        // Close MySQL connections
        if (mysqlPool) {
            console.log("🔌 Closing MySQL connections...");
            await mysqlPool.end();
            console.log("✅ MySQL connections closed");
        }
        
        // Close MongoDB connection (if using)
        if (mongoose.connection.readyState === 1) {
            console.log("🍃 Closing MongoDB connection...");
            await mongoose.connection.close();
            console.log("✅ MongoDB connection closed");
        }
        
        // Close HTTP server
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

// Method 1: Connect to MongoDB (Recommended)
const initializeMongoDB = async () => {
    try {
        const connectionInstance = await connectDB();
        if (connectionInstance) {
            console.log(`🍃 MongoDB connected successfully`);
            console.log(`📊 MongoDB Host: ${connectionInstance.connection.host}`);
            console.log(`📁 MongoDB Database: ${connectionInstance.connection.name}`);
        }
        return true;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        console.log("🔄 Retrying MongoDB connection in 5 seconds...");
        setTimeout(initializeMongoDB, 5000);
        return false;
    }
};

// Method 2: Alternative MongoDB connection using mongoose directly
const initializeMongoDBAlt = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`🍃 MongoDB connected: ${connectionInstance.connection.host}`);
        return true;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        return false;
    }
};

// Start the application server
const startServer = async () => {
    try {
        const PORT = process.env.PORT || 5000;
        
        // Initialize MySQL (required for your app)
        await initializeMySQL();
        
        // Initialize MongoDB (optional but recommended for your app)
        // Choose one method:
        // await initializeMongoDB(); // Method 1: Using your connectDB function
        // OR
        // await initializeMongoDBAlt(); // Method 2: Direct mongoose connection
        
        // Store server instance for graceful shutdown
        app.server = app.listen(PORT, () => {
            console.log("\n🚀 Server started successfully!");
            console.log(`🌐 Server is running on port: ${PORT}`);
            console.log(`📍 Local URL: http://localhost:${PORT}`);
            console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
            console.log("\n📊 Database Status:");
            console.log("  • MySQL: ✅ Connected");
            console.log("  • MongoDB: ✅ Connected (if configured)");
            console.log("\n✨ Application ready to accept requests\n");
        });
        
        // Handle server errors
        app.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', error);
            }
        });
        
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

// Health check endpoints (optional)
app.get('/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            mysql: mysqlPool ? 'connected' : 'disconnected',
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        }
    };
    res.status(200).json(health);
});

app.get('/health/mysql', async (req, res) => {
    try {
        const [rows] = await mysqlPool.query('SELECT 1 as connected');
        res.status(200).json({ 
            status: 'OK', 
            mysql: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'ERROR', 
            mysql: 'disconnected',
            error: error.message 
        });
    }
});

// Export the MySQL pool for use in other modules
export { mysqlPool };

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
startServer().catch((error) => {
    console.error("❌ Application failed to start:", error);
    process.exit(1);
});

// Export for testing purposes
export { initializeMySQL, initializeMongoDB, gracefulShutdown };