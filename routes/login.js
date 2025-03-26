const express = require("express");
const router = express.Router();
const db = require("../backend_config/db");

// POST login route
router.post("/api/login", (req, res) => {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, and role are required" });
    }

    // Check if the user exists
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];

        // Validate password
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Query to check if username exists under the selected role column
        const roleQuery = `SELECT * FROM role_assignment WHERE ?? = ?`;
        db.query(roleQuery, [role, username], (err, roleResults) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            if (roleResults.length === 0) {
                return res.status(403).json({ message: "Unauthorized: Role mismatch" });
            }

            // If role is valid, login is successful
            res.json({ message: "Login successful", role });
        });
    });
});

module.exports = router;
