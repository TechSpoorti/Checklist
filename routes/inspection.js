const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");



// ✅ Fetch inspection data based on `partid` from the checklist1 table
router.get("/", (req, res) => {
    const { part_id } = req.query;

    if (!part_id) {
        return res.status(400).json({ error: "Missing part_id parameter" });
    }

    const sql = "SELECT checklist1.*, unit_name, equipment_name,stage FROM checklist1 JOIN part ON checklist1.part_id = part.part_id JOIN equipment ON part.equipment_id = equipment.eq_id JOIN line ON equipment.line_id = line.line_id JOIN unit ON line.unit_id = unit.unit_id WHERE checklist1.part_id = ?;";
    db.query(sql, [part_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});



module.exports = router;
