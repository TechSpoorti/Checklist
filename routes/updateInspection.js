const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");


// ✅ Update inspection data for checklist1 table
router.patch("/updateInspection", (req, res) => {
    const {
        checklist_id,
        part_id,
        remarks_by_engineer,
        observation,
        captured_image_during_inspection,
        material_required
    } = req.body;

    if (!checklist_id || !part_id||!remarks_by_engineer||!observation|!captured_image_during_inspection||!material_required) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
        UPDATE checklist1 
        SET 
            remarks_by_engineer = ?, 
            observation = ?,
            captured_image_during_inspection = ?, 
            material_required = ? 
        WHERE checklist_id = ? AND part_id = ?
    `;

    db.query(sql, [
        remarks_by_engineer, 
        observation,
        captured_image_during_inspection, 
        material_required, 
        checklist_id, 
        part_id
    ], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Inspection item not found" });
        }

        res.json({ message: "Inspection updated successfully", data: results });
    });
});

module.exports = router;