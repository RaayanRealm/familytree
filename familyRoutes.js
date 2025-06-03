const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cloudinary = require('cloudinary').v2;
const isDev = process.env.DEV === "true";

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

// Add this at the top for consistent logging
const log = (...args) => {
  // Print to Vercel logs (stdout)
  console.log("[familyRoutes]", ...args);
  // Optionally, send to Cloudinary if needed (not required for debugging)
};

if (!isDev) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  log("Cloudinary config set:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET
  });
}

log("ENV DEV:", process.env.DEV, "isDev:", isDev, "NODE_ENV:", process.env.NODE_ENV, "Vercel:", !!process.env.VERCEL);

// Get all family members with related info
router.get("/members", async (req, res) => {
  log("GET /members called");
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
  log("GET /members/:id called with id:", req.params.id);
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

// Helper to download image from URL and save to disk as .jpeg
async function downloadImageToFile(url, destPath) {
  const response = await axios({
    method: "get",
    url,
    responseType: "stream",
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FamilyTreeBot/1.0)"
    }
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Helper to upload image buffer/file to Cloudinary and get URL
async function uploadToCloudinary(filePath, publicId) {
  log("Uploading file to Cloudinary:", filePath, publicId);
  return cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    folder: "familytree",
    overwrite: true,
    resource_type: "image"
  });
}

// Helper to upload image from URL to Cloudinary
async function uploadUrlToCloudinary(imageUrl, publicId) {
  log("Uploading image URL to Cloudinary:", imageUrl, publicId);
  return cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    folder: "familytree",
    overwrite: true,
    resource_type: "image"
  });
}

// Add a new family member (with relationships and deaths, and image upload)
router.post("/members", (req, res, next) => {
  log("POST /members called, isDev:", isDev, "content-type:", req.headers["content-type"]);
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    log("Handling multipart/form-data for member creation");
    upload.single("profile_picture_file")(req, res, async function (err) {
      log("POST /members multer upload, isDev:", isDev, "req.file:", !!req.file);
      if (err) {
        log("Image upload failed:", err.message);
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      const trx = await db.transaction();
      try {
        const personDataObj = JSON.parse(req.body.personData);
        log("Parsed personData:", personDataObj);
        let { deaths, relationships, death, first_name, last_name, profile_picture, ...personData } = personDataObj;

        // --- Add missing parent spouses as parents ---
        if (Array.isArray(relationships)) {
          // Find all parent IDs from relationships
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          // For each parent, find their spouses and add as parent if not already present
          for (const parentId of parentIds) {
            const spouseRows = await db("relationships")
              .where({ person_id: parentId, relationship_type: "Spouse" })
              .select("relative_id");
            for (const spouse of spouseRows) {
              // Only add if not already present as parent
              if (
                !relationships.some(
                  r => r.relationship_type === "Parent" && r.relative_id === spouse.relative_id
                )
              ) {
                relationships.push({
                  relative_id: spouse.relative_id,
                  relationship_type: "Parent"
                });
              }
            }
          }
        }
        // --- End add missing parent spouses ---

        // Insert person first to get the personId
        const [person] = await trx("persons").insert({
          ...personData,
          first_name,
          last_name
        }).returning("*");
        const personId = person.id || person;
        log("Inserted person with id:", personId);

        // Handle profile picture file or URL
        if (isDev) {
          log("DEV MODE: using local file storage for images");
          // Local storage as before
          if (req.file) {
            const ext = path.extname(req.file.originalname);
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const newFileName = `${safeFirst}_${safeLast}_${personId}${ext}`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            fs.renameSync(req.file.path, newFilePath);
            await trx("persons").where({ id: personId }).update({
              profile_picture: `/images/${newFileName}`
            });
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            // Download and save locally as before
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
            const newFileName = `${personName}_${personId}.jpeg`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            try {
              await downloadImageToFile(profile_picture, newFilePath);
              await trx("persons").where({ id: personId }).update({
                profile_picture: `/images/${newFileName}`
              });
            } catch (err) {
              log("Failed to download image from URL:", err.message);
            }
          }
        } else {
          log("PROD MODE: using Cloudinary for images");
          // Always use Cloudinary in production, never write to local disk
          if (req.file) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              const result = await uploadToCloudinary(req.file.path, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
              fs.unlinkSync(req.file.path);
            } catch (err) {
              log("Cloudinary upload failed:", err.message);
            }
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading image URL to Cloudinary (no local save):", profile_picture, publicId);
              const result = await uploadUrlToCloudinary(profile_picture, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
            } catch (err) {
              log("Cloudinary upload from URL failed:", err.message);
            }
          }
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
        log("Committing transaction for person:", personId);
        await trx.commit();
        await invalidateFamilyTreeCache(personId, db);
        log("Family member added successfully:", personId);
        res.json({ message: "Family member added successfully!", id: personId });
      } catch (error) {
        log("Error adding family member:", error.message);
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    });
  } else {
    log("Handling JSON body for member creation");
    (async () => {
      const trx = await db.transaction();
      try {
        let { deaths, relationships, death, profile_picture, ...personData } = req.body;

        // --- Add missing parent spouses as parents ---
        if (Array.isArray(relationships)) {
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const spouseRows = await db("relationships")
              .where({ person_id: parentId, relationship_type: "Spouse" })
              .select("relative_id");
            for (const spouse of spouseRows) {
              if (
                !relationships.some(
                  r => r.relationship_type === "Parent" && r.relative_id === spouse.relative_id
                )
              ) {
                relationships.push({
                  relative_id: spouse.relative_id,
                  relationship_type: "Parent"
                });
              }
            }
          }
        }
        // --- End add missing parent spouses ---

        // Insert person first to get the personId
        const [person] = await trx("persons").insert(personData).returning("*");
        const personId = person.id || person;
        log("Inserted person with id:", personId);

        // Handle profile picture from URL (for JSON body)
        if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
          if (isDev) {
            log("DEV MODE: using local file storage for images");
            // Local storage as before
            const safeFirst = String(personData.first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(personData.last_name).replace(/[^a-zA-Z0-9]/g, "");
            const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
            const newFileName = `${personName}_${personId}.jpeg`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            try {
              await downloadImageToFile(profile_picture, newFilePath);
              await trx("persons").where({ id: personId }).update({
                profile_picture: `/images/${newFileName}`
              });
            } catch (err) {
              log("Failed to download image from URL:", err.message);
            }
          } else {
            // PROD: Always use Cloudinary, never write to local disk
            const safeFirst = String(personData.first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(personData.last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading image URL to Cloudinary (no local save):", profile_picture, publicId);
              const result = await uploadUrlToCloudinary(profile_picture, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
            } catch (err) {
              log("Cloudinary upload from URL failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload from URL failed: " + err.message });
            }
          }
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
        log("Committing transaction for person:", personId);
        await trx.commit();
        await invalidateFamilyTreeCache(personId, db);
        log("Family member added successfully:", personId);
        res.json({ message: "Family member added successfully!", id: personId });
      } catch (error) {
        log("Error adding family member:", error.message);
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error adding family member" });
      }
    })();
  }
});

// Add a new marriage
router.post("/marriages", async (req, res) => {
  try {
    const { person_id, spouse_id, marriage_date, divorce_date } = req.body;
    if (!person_id || !spouse_id || person_id === spouse_id) {
      return res.status(400).json({ error: "Invalid spouse selection." });
    }
    await db("marriages").insert({
      person_id,
      spouse_id,
      marriage_date,
      divorce_date
    });
    // Also add relationships as Spouse for both
    await db("relationships").insert([
      { person_id, relative_id: spouse_id, relationship_type: "Spouse" },
      { person_id: spouse_id, relative_id: person_id, relationship_type: "Spouse" }
    ]);
    res.json({ message: "Marriage added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding marriage" });
  }
});

// Update an existing family member (with relationships and deaths, and image upload)
router.put("/members/:id", (req, res, next) => {
  log("PUT /members/:id called, isDev:", isDev, "content-type:", req.headers["content-type"]);
  const personId = parseInt(req.params.id, 10);
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    log("Handling multipart/form-data for member update");
    upload.single("profile_picture_file")(req, res, async function (err) {
      log("PUT /members/:id multer upload, isDev:", isDev, "req.file:", !!req.file);
      if (err) {
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      const trx = await db.transaction();
      try {
        const personDataObj = JSON.parse(req.body.personData);
        let { deaths, relationships, death, first_name, last_name, profile_picture, ...personData } = personDataObj;

        // Remove marriages if present
        delete personData.marriages;

        // --- Add missing parent spouses as parents (same as POST) ---
        if (Array.isArray(relationships)) {
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const spouseRows = await db("relationships")
              .where({ person_id: parentId, relationship_type: "Spouse" })
              .select("relative_id");
            for (const spouse of spouseRows) {
              if (
                !relationships.some(
                  r => r.relationship_type === "Parent" && r.relative_id === spouse.relative_id
                )
              ) {
                relationships.push({
                  relative_id: spouse.relative_id,
                  relationship_type: "Parent"
                });
              }
            }
          }
        }
        // --- End add missing parent spouses ---

        // Update person
        await trx("persons").where({ id: personId }).update({
          ...personData,
          first_name,
          last_name
        });

        // Handle profile picture file or URL
        if (isDev) {
          log("DEV MODE: using local file storage for images");
          // Local storage as before
          if (req.file) {
            const ext = path.extname(req.file.originalname);
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const newFileName = `${safeFirst}_${safeLast}_${personId}${ext}`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            fs.renameSync(req.file.path, newFilePath);
            await trx("persons").where({ id: personId }).update({
              profile_picture: `/images/${newFileName}`
            });
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            // Download and save locally as before
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
            const newFileName = `${personName}_${personId}.jpeg`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            try {
              await downloadImageToFile(profile_picture, newFilePath);
              await trx("persons").where({ id: personId }).update({
                profile_picture: `/images/${newFileName}`
              });
            } catch (err) {
              log("Failed to download image from URL:", err.message);
            }
          }
        } else {
          log("PROD MODE: using Cloudinary for images");
          // Always use Cloudinary in production, never write to local disk
          if (req.file) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading file to Cloudinary (no local save):", req.file.path, publicId);
              const result = await uploadToCloudinary(req.file.path, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
              fs.unlinkSync(req.file.path);
            } catch (err) {
              log("Cloudinary upload failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload failed: " + err.message });
            }
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading image URL to Cloudinary (no local save):", profile_picture, publicId);
              const result = await uploadUrlToCloudinary(profile_picture, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
            } catch (err) {
              log("Cloudinary upload from URL failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload from URL failed: " + err.message });
            }
          }
        }

        // Remove old deaths and insert new ones
        await trx("deaths").where({ person_id: personId }).del();
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

        // Remove old relationships and insert new ones
        await trx("relationships").where({ person_id: personId }).del();
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
        }

        await trx.commit();
        await invalidateFamilyTreeCache(personId, db);
        res.json({ message: "Family member updated successfully!", id: personId });
      } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error updating family member" });
      }
    });
  } else {
    (async () => {
      const trx = await db.transaction();
      try {
        let { deaths, relationships, death, profile_picture, ...personData } = req.body;
        delete personData.marriages;

        // --- Add missing parent spouses as parents (same as POST) ---
        if (Array.isArray(relationships)) {
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const spouseRows = await db("relationships")
              .where({ person_id: parentId, relationship_type: "Spouse" })
              .select("relative_id");
            for (const spouse of spouseRows) {
              if (
                !relationships.some(
                  r => r.relationship_type === "Parent" && r.relative_id === spouse.relative_id
                )
              ) {
                relationships.push({
                  relative_id: spouse.relative_id,
                  relationship_type: "Parent"
                });
              }
            }
          }
        }
        // --- End add missing parent spouses ---

        // Update person
        await trx("persons").where({ id: personId }).update(personData);

        // Handle profile picture from URL (for JSON body)
        if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
          if (isDev) {
            log("DEV MODE: using local file storage for images");
            // Local storage as before
            const safeFirst = String(personData.first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(personData.last_name).replace(/[^a-zA-Z0-9]/g, "");
            const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
            const newFileName = `${personName}_${personId}.jpeg`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            try {
              await downloadImageToFile(profile_picture, newFilePath);
              await trx("persons").where({ id: personId }).update({
                profile_picture: `/images/${newFileName}`
              });
            } catch (err) {
              log("Failed to download image from URL:", err.message);
            }
          } else {
            // PROD: Always use Cloudinary, never write to local disk
            const safeFirst = String(personData.first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(personData.last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading image URL to Cloudinary (no local save):", profile_picture, publicId);
              const result = await uploadUrlToCloudinary(profile_picture, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
            } catch (err) {
              log("Cloudinary upload from URL failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload from URL failed: " + err.message });
            }
          }
        }

        // Remove old deaths and insert new ones
        await trx("deaths").where({ person_id: personId }).del();
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

        // Remove old relationships and insert new ones
        await trx("relationships").where({ person_id: personId }).del();
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
        }

        await trx.commit();
        await invalidateFamilyTreeCache(personId, db);
        res.json({ message: "Family member updated successfully!", id: personId });
      } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error updating family member" });
      }
    })();
  }
});


// Add a new marriage
router.post("/marriages", async (req, res) => {
  try {
    const { person_id, spouse_id, marriage_date, divorce_date } = req.body;
    if (!person_id || !spouse_id || person_id === spouse_id) {
      return res.status(400).json({ error: "Invalid spouse selection." });
    }
    await db("marriages").insert({
      person_id,
      spouse_id,
      marriage_date,
      divorce_date
    });
    // Also add relationships as Spouse for both
    await db("relationships").insert([
      { person_id, relative_id: spouse_id, relationship_type: "Spouse" },
      { person_id: spouse_id, relative_id: person_id, relationship_type: "Spouse" }
    ]);
    res.json({ message: "Marriage added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding marriage" });
  }
});

// Update an existing family member (with relationships and deaths, and image upload)
router.put("/members/:id", (req, res, next) => {
  log("PUT /members/:id called, isDev:", isDev, "content-type:", req.headers["content-type"]);
  const personId = parseInt(req.params.id, 10);
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    log("Handling multipart/form-data for member update");
    upload.single("profile_picture_file")(req, res, async function (err) {
      log("PUT /members/:id multer upload, isDev:", isDev, "req.file:", !!req.file);
      if (err) {
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      const trx = await db.transaction();
      try {
        const personDataObj = JSON.parse(req.body.personData);
        let { deaths, relationships, death, first_name, last_name, profile_picture, ...personData } = personDataObj;

        // Remove marriages if present
        delete personData.marriages;

        // --- Add missing parent spouses as parents (same as POST) ---
        if (Array.isArray(relationships)) {
          const parentIds = relationships
            .filter(r => r.relationship_type === "Parent")
            .map(r => r.relative_id);

          for (const parentId of parentIds) {
            const spouseRows = await db("relationships")
              .where({ person_id: parentId, relationship_type: "Spouse" })
              .select("relative_id");
            for (const spouse of spouseRows) {
              if (
                !relationships.some(
                  r => r.relationship_type === "Parent" && r.relative_id === spouse.relative_id
                )
              ) {
                relationships.push({
                  relative_id: spouse.relative_id,
                  relationship_type: "Parent"
                });
              }
            }
          }
        }
        // --- End add missing parent spouses ---

        // Update person
        await trx("persons").where({ id: personId }).update({
          ...personData,
          first_name,
          last_name
        });

        // Handle profile picture file or URL
        if (isDev) {
          log("DEV MODE: using local file storage for images");
          // Local storage as before
          if (req.file) {
            const ext = path.extname(req.file.originalname);
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const newFileName = `${safeFirst}_${safeLast}_${personId}${ext}`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            fs.renameSync(req.file.path, newFilePath);
            await trx("persons").where({ id: personId }).update({
              profile_picture: `/images/${newFileName}`
            });
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            // Download and save locally as before
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
            const newFileName = `${personName}_${personId}.jpeg`;
            const imagesDir = path.join(__dirname, "../../public/images");
            const newFilePath = path.join(imagesDir, newFileName);
            if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
            try {
              await downloadImageToFile(profile_picture, newFilePath);
              await trx("persons").where({ id: personId }).update({
                profile_picture: `/images/${newFileName}`
              });
            } catch (err) {
              log("Failed to download image from URL:", err.message);
            }
          }
        } else {
          log("PROD MODE: using Cloudinary for images");
          // Always use Cloudinary in production, never write to local disk
          if (req.file) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading file to Cloudinary (no local save):", req.file.path, publicId);
              const result = await uploadToCloudinary(req.file.path, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
              fs.unlinkSync(req.file.path);
            } catch (err) {
              log("Cloudinary upload failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload failed: " + err.message });
            }
          } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
            const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
            const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
            const publicId = `${safeFirst}_${safeLast}_${personId}`;
            try {
              log("Uploading image URL to Cloudinary (no local save):", profile_picture, publicId);
              const result = await uploadUrlToCloudinary(profile_picture, publicId);
              await trx("persons").where({ id: personId }).update({
                profile_picture: result.secure_url
              });
            } catch (err) {
              log("Cloudinary upload from URL failed:", err.message);
              return res.status(500).json({ error: "Cloudinary upload from URL failed: " + err.message });
            }
          }
        }

        // Remove old deaths and insert new ones
        await trx("deaths").where({ person_id: personId }).del();
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

        // Remove old relationships and insert new ones
        await trx("relationships").where({ person_id: personId }).del();
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
        }

        await trx.commit();
        await invalidateFamilyTreeCache(personId, db);
        res.json({ message: "Family member updated successfully!", id: personId });
      } catch (error) {
        await trx.rollback();
        res.status(500).json({ error: error.message || "Error updating family member" });
      }
    })();
  }
});

// Add a new marriage
router.post("/marriages", async (req, res) => {
  try {
    const { person_id, spouse_id, marriage_date, divorce_date } = req.body;
    if (!person_id || !spouse_id || person_id === spouse_id) {
      return res.status(400).json({ error: "Invalid spouse selection." });
    }
    await db("marriages").insert({
      person_id,
      spouse_id,
      marriage_date,
      divorce_date
    });
    // Also add relationships as Spouse for both
    await db("relationships").insert([
      { person_id, relative_id: spouse_id, relationship_type: "Spouse" },
      { person_id: spouse_id, relative_id: person_id, relationship_type: "Spouse" }
    ]);
    res.json({ message: "Marriage added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding marriage" });
  }
});

// Make sure you are exporting the router, not the app/server instance.
// At the end of this file, you should have:
module.exports = router;