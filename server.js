const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');
const db = require('./backend_config/db'); 


const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());


// Import routes
const unitRoutes = require("./routes/units");
const unitLineRoutes = require("./routes/unit_lines");  // Updated
const equipmentRoutes = require("./routes/equipments");
const partRoutes = require("./routes/parts");
const checklistRoutes = require("./routes/Checklist")
const checklistUpdateRoutes = require("./routes/updateChecklist")
const updateAfterMaintenanceValue = require("./routes/afterMaintenance")
const Inspection = require("./routes/inspection")
const inspectionUpdateRoutes = require("./routes/updateInspection")
const updateRoutes = require("./routes/updateManager")
const loginRoutes = require("./routes/login")
const imageRoutes = require("./routes/upload")
const approverRoutes = require("./routes/approver")
const approver2Routes = require("./routes/approver2")
const approver3Routes = require("./routes/approver3")
const approver4Routes = require("./routes/approver4")
const approver5Routes = require("./routes/approver5")
const updatePartRoute = require("./routes/updatePart")


// Use routes
app.use("/api/units", unitRoutes);
app.use("/api/unit_lines", unitLineRoutes);  // Updated
app.use("/api/equipments", equipmentRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api",checklistUpdateRoutes);
app.use("/api",updateAfterMaintenanceValue);
app.use("/api/inspection",Inspection)
app.use("/api",inspectionUpdateRoutes);
app.use("/api",updateRoutes);
app.use("/",loginRoutes);
app.use("/api",imageRoutes)
app.use("/api",approverRoutes)
app.use("/api",approver2Routes)
app.use("/api",approver3Routes)
app.use("/api",approver4Routes)
app.use("/api",approver5Routes)
app.use("/api",updatePartRoute)
app.use("/api/conditions",checklistRoutes)


app.use('/images', express.static(path.join(__dirname, 'images')));


// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${port}`);
});

