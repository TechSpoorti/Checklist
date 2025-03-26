const express = require("express");
const db = require("../backend_config/db");
const router = express.Router();
// const db = require(db) // Import MySQL connection
// Get all unit lines
router.get("/", (req, res) => {
    const { unit_id } = req.query;  // Get unit_id from request query
    if (!unit_id) {
        return res.status(400).json({ error: "unit_id is required" });
    }
    const sql = "SELECT * FROM line JOIN unit ON line.unit_id = unit.unit_id WHERE line.unit_id = ? AND line.status = 'active';";
    db.query(sql, [unit_id], (err, result) => {
        if (err) {
            console.error("Error fetching unit lines:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

module.exports = router;
