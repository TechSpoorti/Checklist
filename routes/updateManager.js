const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");


// ✅ Update inspection data for checklist1 table
router.patch("/updateManager", (req, res) => {
    const {
        checklist_id,
        part_id,
        remarks_by_engineer,
        obseravation,
        captured_image_during_inspection,
        action_to_be_taken,
        remarks_by_section_incharge,
        material_required
    } = req.body;

    if (!checklist_id || !part_id||!action_to_be_taken||!remarks_by_section_incharge) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
        UPDATE checklist1 
        SET 
            remarks_by_section_incharge = ?, 
            action_to_be_taken = ? 
        WHERE checklist_id = ? AND part_id = ?
    `;

    db.query(sql, [
        remarks_by_section_incharge, 
        action_to_be_taken, 
        checklist_id, 
        part_id
    ], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Manager Inspection item not found" });
        }

        res.json({ message: "Manager Inspection updated successfully", data: results });
    });
});

module.exports = router;