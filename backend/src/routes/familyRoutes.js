const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all family members
router.get("/members", async (req, res) => {
  try {
    const family = await db("persons").select("*");
    res.json(family);
  } catch (error) {
    res.status(500).json({ error: "Error fetching family members" });
  }
});

// Get recent family members (last 5 added)
router.get("/members/recent", async (req, res) => {
  try {
    const recentMembers = await db("persons")
      .select("id", "first_name", "last_name", "profile_picture", "biography", "created_at")
      .orderBy("created_at", "desc")
      .limit(5);
    if (!recentMembers.length) {
      throw new Error("No recent members found");
    }

    res.json(recentMembers);
  } catch (error) {
    res.status(500).json({ error: error.message }); // ✅ Send precise error message
  }
});

// Get a specific family member by ID
router.get("/members/:id", async (req, res) => {
  try {
    const familyMember = await db("persons").where({ id: req.params.id }).first();
    if (!familyMember) {
      return res.status(404).json({ error: "Family member not found" });
    }
    res.json(familyMember);
  } catch (error) {
    res.status(500).json({ error: "Error fetching family member" });
  }
});

// Get family relationships for a person
router.get("/relationships", async (req, res) => {
  try {
    const relations = await db("relationships").select("*");
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

// Get family relationships for a person
router.get("/relationships/:id", async (req, res) => {
  try {
    const relations = await db("relationships")
      .where({ person_id: req.params.id })
      .join("persons", "relationships.relative_id", "persons.id")
      .select("persons.first_name", "persons.last_name", "relationships.relationship_type", "persons.id");
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

// Add a new family member
router.post("/members", async (req, res) => {
  try {
    const [id] = await db("persons").insert(req.body).returning("id");
    res.json({ message: "Family member added successfully!", id });
  } catch (error) {
    res.status(500).json({ error: "Error adding family member" });
  }
});

// Delete a family member
router.delete("/members/:id", async (req, res) => {
  try {
    await db("persons").where({ id: req.params.id }).del();
    res.json({ message: "Family member deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting family member" });
  }
});

module.exports = router;