const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Set up multer for image uploads (move this to the top, outside the route)
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
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // <-- this is the multer instance

// Get all family members with related info
router.get("/members", async (req, res) => {
  try {
    const family = await db("persons").select("*");
    // For each person, fetch related deaths and marriages
    const results = await Promise.all(
      family.map(async (member) => {
        const deaths = await db("deaths").where({ person_id: member.id }).select("*");
        const marriages = await db("marriages")
          .where(function () {
            this.where({ person_id: member.id }).orWhere({ spouse_id: member.id });
          })
          .select("*");
        return {
          ...member,
          deaths,
          marriages
        };
      })
    );
    res.json(results);
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

// Get a specific family member by ID (with all related info)
router.get("/members/:id", async (req, res) => {
  try {
    const personId = parseInt(req.params.id, 10);
    if (isNaN(personId)) {
      return res.status(400).json({ error: "Invalid member ID" });
    }

    // Fetch the main person
    const familyMember = await db("persons").where({ id: personId }).first();
    if (!familyMember) {
      return res.status(404).json({ error: "Family member not found" });
    }

    // deaths: person_id (int), date_of_death (date), cause (string)
    const deaths = await db("deaths").where({ person_id: personId }).select("*");

    // marriages: person_id (int), spouse_id (int), marriage_date (date), divorce_date (date)
    const marriages = await db("marriages")
      .where(function () {
        this.where({ person_id: personId }).orWhere({ spouse_id: personId });
      })
      .select("*");

    res.json({
      ...familyMember,
      deaths,
      marriages
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching family member" });
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

// Add a new family member (with relationships and deaths, and image upload)
router.post("/members", (req, res, next) => {
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    upload.single("profile_picture_file")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      const trx = await db.transaction();
      try {
        const personDataObj = JSON.parse(req.body.personData);
        const { deaths, relationships, death, first_name, last_name, ...personData } = personDataObj;

        // Insert person first to get the personId
        const [person] = await trx("persons").insert({
          ...personData,
          first_name,
          last_name
        }).returning("*");
        const personId = person.id || person;

        // Handle profile picture file
        if (req.file) {
          // Build new filename as FirstName_LastName_personId.ext
          const ext = path.extname(req.file.originalname);
          const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
          const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
          const newFileName = `${safeFirst}_${safeLast}_${personId}${ext}`;
          const imagesDir = path.join(__dirname, "../../public/images");
          const newFilePath = path.join(imagesDir, newFileName);

          // If file exists, delete it
          if (fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
          }

          // Move uploaded file to new filename
          fs.renameSync(req.file.path, newFilePath);

          // Update profile_picture path in DB
          await trx("persons").where({ id: personId }).update({
            profile_picture: `/images/${newFileName}`
          });
        }

        // Insert deaths if provided
        if (Array.isArray(deaths) && deaths.length > 0) {
          for (const death of deaths) {
            await trx("deaths").insert({
              person_id: personId,
              date: death.date || null,
              cause: death.cause || null,
              place: death.place || null,
              obituary: death.obituary || null
            });
          }
        }

        // Insert relationships (and their reverse)
        if (Array.isArray(relationships) && relationships.length > 0) {
          for (const rel of relationships) {
            if (!["Parent", "Child", "Sibling", "Spouse"].includes(rel.relationship_type)) continue;
            await trx("relationships").insert({
              person_id: personId,
              relative_id: rel.relative_id,
              relationship_type: rel.relationship_type
            });
            let reverseType = null;
            switch (rel.relationship_type) {
              case "Parent": reverseType = "Child"; break;
              case "Child": reverseType = "Parent"; break;
              case "Sibling": reverseType = "Sibling"; break;
              case "Spouse": reverseType = "Spouse"; break;
            }
            if (reverseType) {
              await trx("relationships").insert({
                person_id: rel.relative_id,
                relative_id: personId,
                relationship_type: reverseType
              });
            }
          }

          // Auto-generate Grandparent/Grandchild relationships
          // For each parent, add their parents as grandparents to the new member
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const grandparentRels = await trx("relationships")
              .where({ person_id: parentId, relationship_type: "Parent" });

            for (const grandparentRel of grandparentRels) {
              await trx("relationships").insert({
                person_id: grandparentRel.relative_id,
                relative_id: personId,
                relationship_type: "Grandparent"
              });
              await trx("relationships").insert({
                person_id: personId,
                relative_id: grandparentRel.relative_id,
                relationship_type: "Grandchild"
              });
            }
          }

          const childIds = relationships
            .filter(r => r.relationship_type === "Child")
            .map(r => r.relative_id);

          for (const childId of childIds) {
            const grandchildRels = await trx("relationships")
              .where({ person_id: childId, relationship_type: "Child" });

            for (const grandchildRel of grandchildRels) {
              await trx("relationships").insert({
                person_id: personId,
                relative_id: grandchildRel.relative_id,
                relationship_type: "Grandparent"
              });
              await trx("relationships").insert({
                person_id: grandchildRel.relative_id,
                relative_id: personId,
                relationship_type: "Grandchild"
              });
            }
          }
        }
        await trx.commit();
        res.json({ message: "Family member added successfully!", id: personId });
      } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    });
  } else {
    (async () => {
      const trx = await db.transaction();
      try {
        const { deaths, relationships, death, ...personData } = req.body;
        const [person] = await trx("persons").insert(personData).returning("*");
        const personId = person.id || person;

        if (Array.isArray(deaths) && deaths.length > 0) {
          for (const death of deaths) {
            await trx("deaths").insert({
              person_id: personId,
              date: death.date || null,
              cause: death.cause || null,
              place: death.place || null,
              obituary: death.obituary || null
            });
          }
        }

        // Insert relationships (and their reverse)
        if (Array.isArray(relationships) && relationships.length > 0) {
          for (const rel of relationships) {
            if (!["Parent", "Child", "Sibling", "Spouse"].includes(rel.relationship_type)) continue;
            await trx("relationships").insert({
              person_id: personId,
              relative_id: rel.relative_id,
              relationship_type: rel.relationship_type
            });
            let reverseType = null;
            switch (rel.relationship_type) {
              case "Parent": reverseType = "Child"; break;
              case "Child": reverseType = "Parent"; break;
              case "Sibling": reverseType = "Sibling"; break;
              case "Spouse": reverseType = "Spouse"; break;
            }
            if (reverseType) {
              await trx("relationships").insert({
                person_id: rel.relative_id,
                relative_id: personId,
                relationship_type: reverseType
              });
            }
          }

          // Auto-generate Grandparent/Grandchild relationships
          // For each parent, add their parents as grandparents to the new member
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const grandparentRels = await trx("relationships")
              .where({ person_id: parentId, relationship_type: "Parent" });

            for (const grandparentRel of grandparentRels) {
              await trx("relationships").insert({
                person_id: grandparentRel.relative_id,
                relative_id: personId,
                relationship_type: "Grandparent"
              });
              await trx("relationships").insert({
                person_id: personId,
                relative_id: grandparentRel.relative_id,
                relationship_type: "Grandchild"
              });
            }
          }

          const childIds = relationships
            .filter(r => r.relationship_type === "Child")
            .map(r => r.relative_id);

          for (const childId of childIds) {
            const grandchildRels = await trx("relationships")
              .where({ person_id: childId, relationship_type: "Child" });

            for (const grandchildRel of grandchildRels) {
              await trx("relationships").insert({
                person_id: personId,
                relative_id: grandchildRel.relative_id,
                relationship_type: "Grandparent"
              });
              await trx("relationships").insert({
                person_id: grandchildRel.relative_id,
                relative_id: personId,
                relationship_type: "Grandchild"
              });
            }
          }
        }
        await trx.commit();
        res.json({ message: "Family member added successfully!", id: personId });
      } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    })();
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

// Get all family events with organizer name
router.get("/events", async (req, res) => {
  try {
    const events = await db("family_events")
      .leftJoin("persons", "family_events.organizer_id", "persons.id")
      .select(
        "family_events.*",
        db.raw("CONCAT(persons.first_name, ' ', persons.last_name) as organizer_name")
      )
      .orderBy("event_date", "desc");
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
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
    contact: "For support, email us at support@familytree.com or call +1-800-FAMILY."
  });
});

module.exports = router;