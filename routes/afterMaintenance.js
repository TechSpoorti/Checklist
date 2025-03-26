const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

router.post('/updateAfterMaintenance', async (req, res) => {
    const { checklist_id, partid, after_maintenance_value } = req.body;

    // Validate required fields
    if (!checklist_id || !partid || !after_maintenance_value) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    try {
        // SQL query to update only after_maintenance_value
        const query = `
            UPDATE checklist
            SET after_maintenance_value = ?
            WHERE checklist_id = ? AND partid = ?;
        `;

        // Execute the query
        const result = await db.query(query, [after_maintenance_value, checklist_id, partid]);

        // Check if the row was updated
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Checklist item not found or no changes made' });
        }

        res.status(200).send({ message: 'after_maintenance_value updated successfully' });
    } catch (error) {
        console.error('Error updating after_maintenance_value:', error);
        res.status(500).send({ error: 'Failed to update after_maintenance_value' });
    }
});

module.exports = router;
