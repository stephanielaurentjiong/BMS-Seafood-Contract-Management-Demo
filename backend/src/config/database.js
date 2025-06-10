const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test connection
pool.on("connect", () => {
  console.log("📦 Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

// Test the connection on startup
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connection test successful");
  })
  .catch((err) => {
    console.error("❌ Database connection test failed:", err);
  });

module.exports = pool;
