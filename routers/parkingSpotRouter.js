const express = require("express");
const router = express.Router();

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

router.get("/", async (req, res) => {
  try {
    const query = "SELECT * FROM properties";
    const result = await pool.query(query);
    res.json({ properties: result.rows });
  } catch (error) {
    console.error("Error retrieving properties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
