const express = require("express");
const router = express.Router();
const db = require("../config/db");
const PersonService = require("../services/PersonService");
const RelationshipService = require("../services/RelationshipService");
const EventService = require("../services/EventService");
const FamilyTreeService = require("../services/FamilyTreeService");
const RecentMemberService = require("../services/RecentMemberService");

// Get all family members with related info
router.get("/members", async (req, res) => {
  try {
    const family = await PersonService.getAllPersons(db);
    res.json(family);
  } catch (error) {
    res.status(500).json({ error: "Error fetching family members" });
  }
});

// Get recent family members (last 5 added)
router.get("/members/recent", async (req, res) => {
  try {
    const recentMembers = await RecentMemberService.getRecentMembers(db, 5);
    res.json(recentMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific family member by ID (with all related info)
router.get("/members/:id", async (req, res) => {
  try {
    const person = await PersonService.getPersonById(req.params.id, db);
    if (!person) {
      return res.status(404).json({ error: "Family member not found" });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching family member" });
  }
});

// Add a new family member
router.post("/members", async (req, res) => {
  try {
    const person = await PersonService.createPerson(req.body, db);
    res.json({ message: "Family member added successfully!", id: person.id });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error adding family member" });
  }
});

// Update an existing family member
router.put("/members/:id", async (req, res) => {
  try {
    const person = await PersonService.updatePerson(req.params.id, req.body, db);
    res.json({ message: "Family member updated successfully!", id: person.id });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error updating family member" });
  }
});

// Delete a family member
router.delete("/members/:id", async (req, res) => {
  try {
    await PersonService.deletePerson(req.params.id, db);
    res.json({ message: "Family member deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting family member" });
  }
});

// Get family relationships for a person
router.get("/relationships", async (req, res) => {
  try {
    const relations = await RelationshipService.getAllRelationships(db);
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

router.get("/relationships/:id", async (req, res) => {
  try {
    const relations = await RelationshipService.getRelationshipsForPerson(req.params.id, db);
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

// Get all family events with organizer name
router.get("/events", async (req, res) => {
  try {
    const events = await EventService.getAllEvents(db);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
  }
});

// Add a new family event
router.post("/events", async (req, res) => {
  try {
    const event = await EventService.createEvent(req.body, db);
    res.json({ message: "Event added successfully!", id: event.id });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error adding event" });
  }
});

// Delete a family event
router.delete("/events/:id", async (req, res) => {
  try {
    await EventService.deleteEvent(req.params.id, db);
    res.json({ message: "Event deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error deleting event" });
  }
});

// Endpoint to get family tree for a person
router.get("/tree/:id", async (req, res) => {
  const personId = parseInt(req.params.id, 10);
  if (isNaN(personId)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const tree = await FamilyTreeService.getFamilyTree(personId, db);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: "Error building family tree", details: error.message });
  }
});

// Help FAQ
router.get("/help/faq", (req, res) => {
  res.json([
    { question: "How do I add a new family member?", answer: "Click the 'Add' button in the header and fill the form." },
    { question: "How do I upload a profile picture?", answer: "You can upload an image file or paste an image URL in the add member form." },
    { question: "How are relationships managed?", answer: "Add relationships in the add member form. The system will auto-link relatives." }
  ]);
});

// Help About
router.get("/help/about", (req, res) => {
  res.json({
    about: "Family Tree is a platform to manage and visualize your family history, relationships, and events. It helps you keep track of your lineage and connect with relatives."
  });
});

// Help Contact
router.get("/help/contact", (req, res) => {
  res.json({
    contact: "For support, email us at raayany@outlook.com.com"
  });
});

// Make sure you are exporting the router, not the app/server instance.
// At the end of this file, you should have:
module.exports = router;