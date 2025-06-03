const express = require("express");
const cors = require("cors");
const familyRoutes = require("./src/routes/familyRoutes");
const path = require("path");
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/family", familyRoutes);
app.use("/images", express.static(path.join(__dirname, "public/images")));

const PORT = process.env.PORT || 5000;

// Always start the server for local/dev, but do NOT export a handler for Vercel here.
// Vercel should use its own entrypoint (api/family.js or similar).
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));