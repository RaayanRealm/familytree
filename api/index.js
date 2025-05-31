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
if (process.env.VERCEL) {
    // On Vercel, export the handler
    module.exports = (req, res) => app(req, res);
} else {
    // Local development
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}