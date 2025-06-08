const express = require("express");
const router = express.Router();
const db = require("../config/db");
const PersonService = require("../services/PersonService");
const RelationshipService = require("../services/RelationshipService");
const EventService = require("../services/EventService");
const FamilyTreeService = require("../services/FamilyTreeService");
const RecentMemberService = require("../services/RecentMemberService");
const MarriageService = require("../services/MarriageService");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cloudinary = require('cloudinary').v2;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const UserService = require("../services/UserService");
const NodeCache = require("node-cache");
const isDev = process.env.DEV === "true";

// Multer setup for image uploads
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
const membersCache = new NodeCache({ stdTTL: 300 }); // cache for 5 minutes

if (!isDev) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Logging helpers with debug control
const DEBUG = process.env.DEBUG === "true";
const log = (...args) => DEBUG && console.log("[familyRoutes]", ...args);
const logError = (...args) => console.error("[familyRoutes][ERROR]", ...args);

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

// Middleware: Role/lineage check
function authorize(action) {
  return async (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role === "admin") return next();
    if (action === "edit" || action === "add") {
      // Only allow if editor and editing/adding in their lineage
      if (user.role !== "editor") return res.status(403).json({ error: "Forbidden" });
      // For edit, check if target member is a descendant of user.member_id
      const targetId = req.params.id || req.body.member_id || req.body.id;
      if (!targetId) return res.status(400).json({ error: "No target member specified" });
      const isDescendant = await UserService.isDescendant(user.member_id, targetId, db);
      if (!isDescendant && String(user.member_id) !== String(targetId)) {
        return res.status(403).json({ error: "Forbidden: not in your lineage" });
      }
      return next();
    }
    if (action === "view") {
      // viewer can see all, guest can see only their lineage
      if (user.role === "viewer") return next();
      if (user.role === "guest") {
        const targetId = req.params.id || req.body.member_id || req.body.id;
        const isDescendant = await UserService.isDescendant(user.member_id, targetId, db);
        if (!isDescendant && String(user.member_id) !== String(targetId)) {
          return res.status(403).json({ error: "Forbidden: not in your lineage" });
        }
        return next();
      }
    }
    return res.status(403).json({ error: "Forbidden" });
  };
}

// --- Auth APIs ---

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserService.findByUsername(username, db);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    member_id: user.member_id
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || "familytree_jwt", { expiresIn: "2h" });
  req.session.token = token;
  res.json({ token, user: payload });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// Session info
router.get("/session", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// --- Protect APIs ---

// Add a new family member (editor/admin only, lineage check)
router.post("/members", authenticate, authorize("add"), (req, res, next) => {
  log("POST /members called, content-type:", req.headers["content-type"]);
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    upload.single("profile_picture_file")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      try {
        const personDataObj = JSON.parse(req.body.personData);
        log("Creating member with data:", personDataObj);
        const result = await PersonService.createPersonWithMedia(personDataObj, req.file, db, {
          isDev,
          uploadToCloudinary: PersonService.uploadToCloudinary,
          uploadUrlToCloudinary: PersonService.uploadUrlToCloudinary,
          downloadImageToFile: PersonService.downloadImageToFile,
          fs,
          path
        });
        log("Member created:", result.id);
        res.json({ message: "Family member added successfully!", id: result.id });
      } catch (error) {
        logError("Error adding family member:", error);
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    });
  } else {
    (async () => {
      try {
        const result = await PersonService.createPersonWithMedia(req.body, null, db, {
          isDev,
          uploadToCloudinary: PersonService.uploadToCloudinary,
          uploadUrlToCloudinary: PersonService.uploadUrlToCloudinary,
          downloadImageToFile: PersonService.downloadImageToFile,
          fs,
          path
        });
        res.json({ message: "Family member added successfully!", id: result.id });
      } catch (error) {
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    })();
  }
});

// Update an existing family member (editor/admin only, lineage check)
router.put("/members/:id", authenticate, authorize("edit"), (req, res, next) => {
  const personId = parseInt(req.params.id, 10);
  log("PUT /members/:id called with id:", personId, "content-type:", req.headers["content-type"]);
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    upload.single("profile_picture_file")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      try {
        const personDataObj = JSON.parse(req.body.personData);
        log("Updating member with id:", personId, "data:", personDataObj);
        const result = await PersonService.updatePersonWithMedia(personId, personDataObj, req.file, db, {
          isDev,
          uploadToCloudinary: PersonService.uploadToCloudinary,
          uploadUrlToCloudinary: PersonService.uploadUrlToCloudinary,
          downloadImageToFile: PersonService.downloadImageToFile,
          fs,
          path
        });
        log("Member updated:", result.id);
        res.json({ message: "Family member updated successfully!", id: result.id });
      } catch (error) {
        logError("Error updating family member:", error);
        res.status(500).json({ error: error.message || "Error updating family member" });
      }
    });
  } else {
    (async () => {
      try {
        const result = await PersonService.updatePersonWithMedia(personId, req.body, null, db, {
          isDev,
          uploadToCloudinary: PersonService.uploadToCloudinary,
          uploadUrlToCloudinary: PersonService.uploadUrlToCloudinary,
          downloadImageToFile: PersonService.downloadImageToFile,
          fs,
          path
        });
        res.json({ message: "Family member updated successfully!", id: result.id });
      } catch (error) {
        res.status(500).json({ error: error.message || "Error updating family member" });
      }
    })();
  }
});

// Get all family members (viewer/editor/admin only) with pagination support
router.get("/members", authenticate, authorize("view"), async (req, res) => {
  let { page = 1, limit = 50 } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 50;

  const cacheKey = `members_page_${page}_limit_${limit}`;
  const cached = membersCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Get total count for pagination
    const total = await db("persons").count("id as count").first();
    // Get paginated persons
    const persons = await db("persons")
      .select("*")
      .orderBy("id")
      .limit(limit)
      .offset((page - 1) * limit);
    const personIds = persons.map(row => row.id);

    // Fetch deaths, marriages, relationships in bulk for these persons
    const deaths = await db("deaths").whereIn("person_id", personIds).select("*");
    const deathsByPerson = {};
    for (const d of deaths) deathsByPerson[d.person_id] = d;

    const marriages = await db("marriages").where(function () {
      this.whereIn("person_id", personIds).orWhereIn("spouse_id", personIds);
    }).select("*");
    const marriagesByPerson = {};
    for (const id of personIds) {
      marriagesByPerson[id] = marriages
        .filter(m => m.person_id === id || m.spouse_id === id);
    }

    const relationships = await db("relationships")
      .whereIn("person_id", personIds)
      .join("persons", "relationships.relative_id", "persons.id")
      .select(
        "relationships.*",
        "persons.first_name as relative_first_name",
        "persons.last_name as relative_last_name"
      );
    const relationshipsByPerson = {};
    for (const id of personIds) {
      relationshipsByPerson[id] = relationships
        .filter(r => r.person_id === id);
    }

    // Assemble DTOs (use PersonService if needed)
    const results = persons.map(row => {
      const entity = new (require("../entities/PersonEntity"))(row);
      const DeathDTO = require("../dtos/DeathDTO");
      const DeathEntity = require("../entities/DeathEntity");
      const MarriageDTO = require("../dtos/MarriageDTO");
      const MarriageEntity = require("../entities/MarriageEntity");
      const RelationshipDTO = require("../dtos/RelationshipDTO");
      const RelationshipEntity = require("../entities/RelationshipEntity");
      const PersonDTO = require("../dtos/PersonDTO");
      const death = deathsByPerson[entity.id]
        ? new DeathDTO(new DeathEntity(deathsByPerson[entity.id]))
        : null;
      const marriages = (marriagesByPerson[entity.id] || []).map(m => new MarriageDTO(new MarriageEntity(m)));
      const relationships = (relationshipsByPerson[entity.id] || []).map(r => {
        const entityR = new RelationshipEntity(r);
        const relativeName = `${r.relative_first_name} ${r.relative_last_name}`;
        return new RelationshipDTO(entityR, relativeName);
      });
      return new PersonDTO(entity, death, marriages, relationships);
    });

    const response = {
      members: results,
      total: total.count || 0,
      page,
      limit
    };
    membersCache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Error fetching family members" });
  }
});

// Get recent family members (last 5 added)
router.get("/members/recent", async (req, res) => {
  log("GET /members/recent called");
  try {
    const recentMembers = await RecentMemberService.getRecentMembers(db, 5);
    log("Fetched recent members:", recentMembers.length);
    res.json(recentMembers);
  } catch (error) {
    logError("Error fetching recent members:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific family member by ID (viewer/editor/admin/guest with lineage check)
router.get("/members/:id", authenticate, authorize("view"), async (req, res) => {
  log("GET /members/:id called with id:", req.params.id);
  try {
    const person = await PersonService.getPersonById(req.params.id, db);
    if (!person) {
      log("Family member not found:", req.params.id);
      return res.status(404).json({ error: "Family member not found" });
    }
    res.json(person);
  } catch (error) {
    logError("Error fetching family member:", error);
    res.status(500).json({ error: error.message || "Error fetching family member" });
  }
});

// Delete a family member (editor/admin only, lineage check)
router.delete("/members/:id", authenticate, authorize("edit"), async (req, res) => {
  log("DELETE /members/:id called with id:", req.params.id);
  const personId = parseInt(req.params.id, 10);
  if (isNaN(personId)) {
    logError("Invalid member ID for deletion:", req.params.id);
    return res.status(400).json({ error: "Invalid member ID" });
  }
  try {
    const deleted = await PersonService.deletePerson(personId, db);
    if (!deleted) {
      log("Family member not found for deletion:", personId);
      return res.status(404).json({ error: "Family member not found" });
    }
    log("Family member deleted:", personId);
    res.json({ message: "Family member deleted successfully!" });
  } catch (error) {
    logError("Error deleting family member:", error);
    res.status(500).json({ error: error.message || "Error deleting family member" });
  }
});

// Get family relationships for a person
router.get("/relationships", async (req, res) => {
  log("GET /relationships called");
  try {
    const relations = await RelationshipService.getAllRelationships(db);
    log("Fetched relationships:", relations.length);
    res.json(relations);
  } catch (error) {
    logError("Error fetching relationships:", error);
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

router.get("/relationships/:id", async (req, res) => {
  log("GET /relationships/:id called with id:", req.params.id);
  try {
    const relations = await RelationshipService.getRelationshipsForPerson(req.params.id, db);
    log("Fetched relationships for person:", req.params.id, relations.length);
    res.json(relations);
  } catch (error) {
    logError("Error fetching relationships:", error);
    res.status(500).json({ error: "Error fetching relationships" });
  }
});

// Get all family events with organizer name
router.get("/events", async (req, res) => {
  log("GET /events called");
  try {
    const events = await EventService.getAllEvents(db);
    log("Fetched events:", events.length);
    res.json(events);
  } catch (error) {
    logError("Error fetching events:", error);
    res.status(500).json({ error: "Error fetching events" });
  }
});

// Add a new family event
router.post("/events", async (req, res) => {
  log("POST /events called with data:", req.body);
  try {
    const event = await EventService.createEvent(req.body, db);
    log("Event created:", event.id);
    res.json({ message: "Event added successfully!", id: event.id });
  } catch (error) {
    logError("Error adding event:", error);
    res.status(500).json({ error: error.message || "Error adding event" });
  }
});

// Delete a family event
router.delete("/events/:id", async (req, res) => {
  log("DELETE /events/:id called with id:", req.params.id);
  try {
    await EventService.deleteEvent(req.params.id, db);
    log("Event deleted:", req.params.id);
    res.json({ message: "Event deleted successfully!" });
  } catch (error) {
    logError("Error deleting event:", error);
    res.status(500).json({ error: error.message || "Error deleting event" });
  }
});

// Endpoint to get family tree for a person
router.get("/tree/:id", async (req, res) => {
  log("GET /tree/:id called with id:", req.params.id);
  const personId = parseInt(req.params.id, 10);
  if (isNaN(personId)) {
    logError("Invalid ID for tree:", req.params.id);
    return res.status(400).json({ error: "Invalid ID" });
  }
  try {
    const tree = await FamilyTreeService.getFamilyTree(personId, db);
    log("Fetched tree for person:", personId);
    res.json(tree);
  } catch (error) {
    logError("Error building family tree:", error);
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

// Add a new marriage
router.post("/marriages", async (req, res) => {
  log("POST /marriages called with data:", req.body);
  try {
    const marriage = await MarriageService.createMarriage(req.body, db);
    log("Marriage added:", marriage);
    res.json({ message: "Marriage added successfully!", marriage });
  } catch (error) {
    logError("Error adding marriage:", error);
    res.status(500).json({ error: "Error adding marriage" });
  }
});

// Make sure you are exporting the router, not the app/server instance.
// At the end of this file, you should have:
module.exports = router;