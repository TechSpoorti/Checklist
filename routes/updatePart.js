const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

router.patch('/updatePartStage', async (req, res) => {
    const { part_id, stage,approval_status } = req.body;

    // Validate the necessary parameters
    if (!part_id || !stage||!approval_status) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    try {
        // SQL query to update the stage
        const query = `
            UPDATE part
            SET stage = ?,approval_status=?
            WHERE part_id = ?;
        `;

        // Execute the query
        const result = await db.query(query, [stage,approval_status, part_id]);

        // Check if the row was updated
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Part not found or no changes made' });
        }

        res.status(200).send({ message: 'Part stage updated successfully' });
    } catch (error) {
        console.error('Error updating part stage:', error);
        res.status(500).send({ error: 'Failed to update part stage' });
    }
});

module.exports = router;
