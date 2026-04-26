import mysql from "mysql2/promise.js";

// MySQL Pool
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root123",
  database: process.env.DB_NAME || "roadguard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
export const connectDB = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    console.log("✅ MySQL Connected");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL Error:", error.message);
    process.exit(1);
  }
};

export default mysqlPool;