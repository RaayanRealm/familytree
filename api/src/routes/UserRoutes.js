const express = require("express");
const router = express.Router();
const db = require("../config/db");
const UserService = require("../services/UserService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require("express-session");

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

// Create user (admin only)
router.post("/users", authenticate, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    try {
        const user = await UserService.createUser(req.body, db);
        res.json({ message: "User created", user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error creating user" });
    }
});

// Update user (admin or self)
router.put("/users/:id", authenticate, async (req, res) => {
    if (req.user.role !== "admin" && String(req.user.id) !== String(req.params.id)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    try {
        const user = await UserService.updateUser(req.params.id, req.body, db);
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
        const user = await db("users").where({ id: req.params.id }).first();
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message || "Error fetching user" });
    }
});

module.exports = router;
