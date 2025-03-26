const express = require("express");
const db = require("../backend_config/db");
const router = express.Router();

// Get units assigned to a specific user and role
router.get("/", (req, res) => {
    const { username, role } = req.query;

    if (!username || !role) {
        return res.status(400).json({ error: "Username and role are required" });
    }

    // SQL query to fetch only assigned units
    const sql = `
        SELECT DISTINCT u.unit_id, u.unit_name, u.status, u.image_name
        FROM unit u
        JOIN role_assignment ra ON u.unit_id = ra.unit_name
        WHERE (ra.inspector = ? AND ? = 'inspector')   
           OR (ra.approver1 = ? AND ? = 'approver1')
           OR (ra.approver2 = ? AND ? = 'approver2')
           OR (ra.approver3 = ? AND ? = 'approver3')
           OR (ra.approver4 = ? AND ? = 'approver4')
           OR (ra.approver5 = ? AND ? = 'approver5')
           OR(ra.manager = ? AND ? = 'manager')
           OR(ra.inspector2 =? AND ? ='inspector2')
           AND u.status = 'active';
    `;

    const params = [username, role,username, role,username,role, username, role, username, role, username, role, username, role, username, role];

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});

module.exports = router;
