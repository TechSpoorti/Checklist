const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

// Get all parts
router.get("/", (req, res) => {
    const { equipment_id } = req.query; // Extracting equipment_id from query params

    if (!equipment_id) {
        return res.status(400).json({ error: "equipment_id is required" });
    }

    const sql = "SELECT * FROM part LEFT JOIN equipment ON part.equipment_id=equipment.eq_id LEFT JOIN part_type ON part.part_type = part_type.part_type_id WHERE part.equipment_id = ? AND part.status = 'active';";
    
 
   // SELECT * FROM equipment LEFT JOIN equipment_type on equipment.equipment_type = equipment_type.equipment_type_id WHERE line_id = ? AND status='active'
   // 
   //SELECT * FROM part  WHERE equipment_id = ? AND status='active'
    db.query(sql, [equipment_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});


module.exports = router;
