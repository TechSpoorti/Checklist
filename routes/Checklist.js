const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

// ✅ Fetch checklist based on `partid`
router.get("/", (req, res) => {
    const { part_id } = req.query;

    if (!part_id) {
        return res.status(400).json({ error: "Missing partid parameter" });
    }

    const sql = "SELECT * FROM checklist1 WHERE part_id = ?";
    db.query(sql, [part_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});
router.get("/conditions", (req, res) => {
    const sql = "SELECT * FROM eq_condition";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);  // Send all conditions to the frontend
    });
});

// ✅ Update checklist values


module.exports = router;
