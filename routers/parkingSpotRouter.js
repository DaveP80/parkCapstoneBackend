const express = require("express");
const router = express.Router();
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

router.get("/:id", async (req, res) => {
  const spotId = req.params.id;

  try {
    const query = `
    SELECT p.*, s.*, 
       cu.first_name AS client_first_name, cu.last_name AS client_last_name, cu.email AS client_email, 
       ru.renter_id, ru.renter_address, ru.renter_email
FROM parking_spaces p
JOIN properties s ON p.property_lookup_id = s.property_id
LEFT JOIN client_user cu ON p.customer_id = cu.id
LEFT JOIN renter_user ru ON p.customer_id = ru.renter_id
WHERE p.space_id = $1;


    `;

    console.log("SQL Query:", query);

    const result = await pool.query(query, [spotId]);
    console.log("Query Result:", result.rows);

    if (result.rows.length > 0) {
      const parkingSpot = result.rows[0];
      res.json(parkingSpot);
    } else {
      res.status(404).json({ error: "Parking spot not found" });
    }
  } catch (error) {
    console.error("Error retrieving parking spot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
