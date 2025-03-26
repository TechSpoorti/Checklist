const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");
// Get all equipments
router.get("/", (req, res) => {
    const { line_id } = req.query; // Get line_id from query params
    if (!line_id) {
        return res.status(400).json({ error: "line_id is required" });
    }
    const sql = "SELECT * FROM equipment LEFT JOIN equipment_type ON equipment.equipment_type = equipment_type.equipment_type_id WHERE equipment.line_id = ? AND equipment.status = 'active';";
    db.query(sql, [line_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});
module.exports = router;