const express = require("express");
const cors = require("cors");
const familyRoutes = require("./src/routes/familyRoutes");
const UserRoutes = require("./src/routes/UserRoutes");
const path = require("path");
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

const allowedOrigins = [
    "https://familytree-gamma.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow all localhost variations and Vercel frontend
        if (
            allowedOrigins.includes(origin) ||
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true,
}));
app.use(express.json());

// Always mount both /api/* and root-level routes for compatibility
app.use("/api", UserRoutes);
app.use("/api/family", familyRoutes);
app.use("/family", familyRoutes);
app.use("/users", UserRoutes);

// Serve images locally only; Vercel serves from /public automatically
if (process.env.VERCEL !== "true") {
    app.use("/images", express.static(path.join(__dirname, "public/images")));
}

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL === "true") {
    // Vercel serverless: export handler
    module.exports = app;
} else {
    // Local dev: start server
    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    module.exports = server;
}