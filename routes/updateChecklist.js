const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

router.patch('/updateChecklist', async (req, res) => {
    const { checklist_id, measured_value,after_maintenance_value, remark, captured_image_after_inspection, part_id } = req.body;
  
    

    // Validate the necessary parameters
    if (!checklist_id || !part_id || !measured_value ||!after_maintenance_value|| !remark || !captured_image_after_inspection) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    try {
        // SQL query to update checklist
        const query = `
            UPDATE checklist1
            SET measured_value = ?,after_maintenance_value =?, remark = ?, captured_image_after_inspection = ?
            WHERE checklist_id = ? AND part_id = ?;
        `;

        // Execute the query
        const result = await db.query(query, [measured_value,after_maintenance_value, remark, captured_image_after_inspection, checklist_id, part_id]);

        // Check if the row was updated
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Checklist item not found or no changes made' });
        }

        res.status(200).send({ message: 'Checklist updated successfully' });
    } catch (error) {
        console.error('Error updating checklist:', error);
        res.status(500).send({ error: 'Failed to update checklist' });
    }
});

module.exports = router;
