const express = require("express");
const router = express.Router();
const db = require("../config/db");
const UserService = require("../services/UserService");
const UserEntity = require("../entities/UserEntity");
const UserDTO = require("../dtos/UserDTO");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Session setup (should be in your main app.js/server.js, but for demo here)
router.use(session({
    secret: process.env.SESSION_SECRET || "familytree_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}));

// Middleware: Authenticate JWT and session
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1] || req.session.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    jwt.verify(token, process.env.JWT_SECRET || "familytree_jwt", (err, user) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

// Multer setup for image uploads (profile_picture)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../../public/images");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${base}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Create user (no authentication required)
router.post("/users", upload.single("profile_picture_file"), async (req, res) => {
    try {
        let { username, password, name, email, phone } = req.body;
        let profile_picture = "";
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const safeUser = String(username).replace(/[^a-zA-Z0-9]/g, "");
            const newFileName = `${safeUser}_${Date.now()}${ext}`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            fs.renameSync(req.file.path, newFilePath);
            profile_picture = `/images/${newFileName}`;
        }
        // set default role and member id
        const role = "viewer"; // Default role
        const member_id = 1; // No member id for new users
        const user = await UserService.createUser(
            { username, password, role, member_id, name, email, phone, profile_picture },
            db
        );
        res.json({ message: "User created", user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error creating user" });
    }
});

// Update user (admin or self)
router.put("/users/:id", authenticate, upload.single("profile_picture_file"), async (req, res) => {
    if (req.user.role !== "admin" && String(req.user.id) !== String(req.params.id)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    try {
        let updates = { ...req.body };
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const safeUser = String(req.body.username || req.user.username).replace(/[^a-zA-Z0-9]/g, "");
            const newFileName = `${safeUser}_${Date.now()}${ext}`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            fs.renameSync(req.file.path, newFilePath);
            updates.profile_picture = `/images/${newFileName}`;
        }
        const user = await UserService.updateUser(req.params.id, updates, db);
        res.json({ message: "User updated", user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error updating user" });
    }
});

// Delete user (admin only)
router.delete("/users/:id", authenticate, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    try {
        const user = await UserService.deleteUser(req.params.id, db);
        res.json({ message: "User deleted", user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error deleting user" });
    }
});

// Get user info (admin or self)
router.get("/users/:id", authenticate, async (req, res) => {
    if (req.user.role !== "admin" && String(req.user.id) !== String(req.params.id)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    try {
        const user = await UserService.getUserById(req.params.id, db);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error fetching user" });
    }
});

// Get all users (admin only)
router.get("/users", authenticate, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    try {
        const users = await UserService.getAllUsers(db);
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error fetching users" });
    }
});

module.exports = router;
