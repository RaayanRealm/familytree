const PersonEntity = require("../entities/PersonEntity");
const PersonDTO = require("../dtos/PersonDTO");
const DeathEntity = require("../entities/DeathEntity");
const DeathDTO = require("../dtos/DeathDTO");
const MarriageEntity = require("../entities/MarriageEntity");
const MarriageDTO = require("../dtos/MarriageDTO");
const RelationshipEntity = require("../entities/RelationshipEntity");
const RelationshipDTO = require("../dtos/RelationshipDTO");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cloudinary = require('cloudinary').v2;

const DEBUG = process.env.DEBUG === "true";
class PersonService {
    static debug(...args) { if (DEBUG) console.debug("[PersonService]", ...args); }
    static info(...args) { if (DEBUG) console.info("[PersonService]", ...args); }
    static error(...args) { console.error("[PersonService][ERROR]", ...args); }

    static async getAllPersons(db) {
        this.debug("getAllPersons called");
        const rows = await db("persons").select("*");
        const results = [];
        for (const row of rows) {
            const entity = new PersonEntity(row);
            const deaths = await this.getDeathsForPerson(entity.id, db);
            const marriages = await this.getMarriagesForPerson(entity.id, db);
            const relationships = await this.getRelationshipsForPerson(entity.id, db);
            results.push(new PersonDTO(entity, deaths, marriages, relationships));
        }
        this.info("getAllPersons returning", results.length, "members");
        return results;
    }

    static async getRecentPersons(db, limit = 5) {
        this.debug("getRecentPersons called, limit:", limit);
        const rows = await db("persons")
            .select("id", "first_name", "last_name", "profile_picture", "biography", "created_at")
            .orderBy("created_at", "desc")
            .limit(limit);
        return rows.map(row => new PersonDTO(new PersonEntity(row)));
    }

    static async getPersonById(id, db) {
        this.debug("getPersonById called with id:", id);
        const row = await db("persons").where({ id }).first();
        if (!row) {
            this.info("getPersonById: not found", id);
            return null;
        }
        const entity = new PersonEntity(row);
        const deaths = await this.getDeathsForPerson(id, db);
        const marriages = await this.getMarriagesForPerson(id, db);
        const relationships = await this.getRelationshipsForPerson(id, db);
        this.info("getPersonById returning member:", id);
        return new PersonDTO(entity, deaths, marriages, relationships);
    }

    static async deletePerson(id, db) {
        this.info("deletePerson called with id:", id);
        await db("persons").where({ id }).del();
        return true;
    }

    static async getDeathsForPerson(personId, db) {
        this.debug("getDeathsForPerson called for personId:", personId);
        const rows = await db("deaths").where({ person_id: personId }).select("*");
        return rows.map(row => new DeathDTO(new DeathEntity(row)));
    }

    static async getMarriagesForPerson(personId, db) {
        this.debug("getMarriagesForPerson called for personId:", personId);
        const rows = await db("marriages")
            .where(function () {
                this.where({ person_id: personId }).orWhere({ spouse_id: personId });
            })
            .select("*");
        return rows.map(row => new MarriageDTO(new MarriageEntity(row)));
    }

    static async getRelationshipsForPerson(personId, db) {
        this.debug("getRelationshipsForPerson called for personId:", personId);
        const rows = await db("relationships")
            .where({ person_id: personId })
            .join("persons", "relationships.relative_id", "persons.id")
            .select(
                "relationships.*",
                "persons.first_name",
                "persons.last_name"
            );
        return rows.map(row => {
            const entity = new RelationshipEntity(row);
            const relativeName = `${row.first_name} ${row.last_name}`;
            return new RelationshipDTO(entity, relativeName);
        });
    }

    static async createPersonWithMedia(personData, file, db, helpers) {
        this.info("createPersonWithMedia called");
        const trx = await db.transaction();
        try {
            let { deaths, relationships, first_name, last_name, profile_picture, ...personFields } = personData;
            // Insert person
            const [person] = await trx("persons").insert({
                ...personFields,
                first_name,
                last_name
            }).returning("*");
            const personId = person.id || person;

            // Handle profile picture
            await this._handleProfilePicture({
                personId, first_name, last_name, profile_picture, file, trx, ...helpers
            });

            // Insert deaths
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

            // Insert relationships (and their reverse), skip duplicates
            if (Array.isArray(relationships) && relationships.length > 0) {
                for (const rel of relationships) {
                    if (!["Parent", "Child", "Sibling", "Spouse"].includes(rel.relationship_type)) continue;

                    // If adding a Child relationship, also add for all spouses of the person
                    if (rel.relationship_type === "Child") {
                        // Find all spouses of the person
                        const spouseRows = await trx("relationships")
                            .where({ person_id: personId, relationship_type: "Spouse" })
                            .select("relative_id");
                        for (const spouse of spouseRows) {
                            // Add Child relationship for spouse if not already present
                            try {
                                await trx("relationships")
                                    .insert({
                                        person_id: spouse.relative_id,
                                        relative_id: rel.relative_id,
                                        relationship_type: "Child"
                                    })
                                    .onConflict(["person_id", "relative_id", "relationship_type"])
                                    .ignore();
                            } catch (e) {
                                this.debug("Duplicate spouse-child relationship skipped:", spouse.relative_id, rel.relative_id, "Child");
                            }
                            // Add reverse Parent relationship for the child to spouse
                            try {
                                await trx("relationships")
                                    .insert({
                                        person_id: rel.relative_id,
                                        relative_id: spouse.relative_id,
                                        relationship_type: "Parent"
                                    })
                                    .onConflict(["person_id", "relative_id", "relationship_type"])
                                    .ignore();
                            } catch (e) {
                                this.debug("Duplicate child-parent relationship skipped:", rel.relative_id, spouse.relative_id, "Parent");
                            }
                        }
                    }

                    // Add the main relationship
                    try {
                        await trx("relationships")
                            .insert({
                                person_id: personId,
                                relative_id: rel.relative_id,
                                relationship_type: rel.relationship_type
                            })
                            .onConflict(["person_id", "relative_id", "relationship_type"])
                            .ignore();
                    } catch (e) {
                        this.debug("Duplicate relationship skipped (create):", personId, rel.relative_id, rel.relationship_type);
                    }
                    let reverseType = null;
                    switch (rel.relationship_type) {
                        case "Parent": reverseType = "Child"; break;
                        case "Child": reverseType = "Parent"; break;
                        case "Sibling": reverseType = "Sibling"; break;
                        case "Spouse": reverseType = "Spouse"; break;
                    }
                    if (reverseType) {
                        try {
                            await trx("relationships")
                                .insert({
                                    person_id: rel.relative_id,
                                    relative_id: personId,
                                    relationship_type: reverseType
                                })
                                .onConflict(["person_id", "relative_id", "relationship_type"])
                                .ignore();
                        } catch (e) {
                            this.debug("Duplicate relationship skipped (create-reverse):", rel.relative_id, personId, reverseType);
                        }
                    }
                }
            }
            await trx.commit();
            this.info("createPersonWithMedia committed for id:", personId);
            return { id: personId };
        } catch (error) {
            await trx.rollback();
            this.error("createPersonWithMedia error:", error);
            throw error;
        }
    }

    static async updatePersonWithMedia(personId, personData, file, db, helpers) {
        this.info("updatePersonWithMedia called for id:", personId);
        const trx = await db.transaction();
        try {
            let { deaths, relationships, first_name, last_name, profile_picture, ...personFields } = personData;
            await trx("persons").where({ id: personId }).update({
                ...personFields,
                first_name,
                last_name
            });

            // Handle profile picture
            await this._handleProfilePicture({
                personId, first_name, last_name, profile_picture, file, trx, ...helpers
            });

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

            // --- Relationship update logic with spouse-child sync ---
            // 1. Get all current relationships for this person
            const currentRels = await trx("relationships")
                .where({ person_id: personId })
                .select("relative_id", "relationship_type");

            // 2. Get all spouse ids for this person
            const spouseRows = await trx("relationships")
                .where({ person_id: personId, relationship_type: "Spouse" })
                .select("relative_id");
            const spouseIds = spouseRows.map(s => s.relative_id);

            // 3. Build sets for quick lookup
            const currentRelSet = new Set(currentRels.map(r => `${r.relative_id}:${r.relationship_type}`));
            const newRelSet = new Set(
                (relationships || []).map(r => `${r.relative_id}:${r.relationship_type}`)
            );

            // 4. Remove all relationships for this person (as before)
            await trx("relationships").where({ person_id: personId }).del();

            // 5. Remove all spouse-child relationships for this person (if a child is removed from this person, remove from spouse too)
            //    Only remove for relationships that are not in the new list
            for (const rel of currentRels) {
                if (rel.relationship_type === "Child" && !newRelSet.has(`${rel.relative_id}:Child`)) {
                    // Remove from all spouses
                    for (const spouseId of spouseIds) {
                        await trx("relationships")
                            .where({
                                person_id: spouseId,
                                relative_id: rel.relative_id,
                                relationship_type: "Child"
                            })
                            .del();
                        // Remove reverse Parent relationship for the child to spouse
                        await trx("relationships")
                            .where({
                                person_id: rel.relative_id,
                                relative_id: spouseId,
                                relationship_type: "Parent"
                            })
                            .del();
                    }
                }
            }

            // 6. Insert new relationships (and their reverse), and sync child to spouse
            if (Array.isArray(relationships) && relationships.length > 0) {
                for (const rel of relationships) {
                    if (!["Parent", "Child", "Sibling", "Spouse"].includes(rel.relationship_type)) continue;

                    // If adding a Child relationship, also add for all spouses of the person
                    if (rel.relationship_type === "Child") {
                        for (const spouseId of spouseIds) {
                            try {
                                await trx("relationships")
                                    .insert({
                                        person_id: spouseId,
                                        relative_id: rel.relative_id,
                                        relationship_type: "Child"
                                    })
                                    .onConflict(["person_id", "relative_id", "relationship_type"])
                                    .ignore();
                            } catch (e) {
                                this.debug("Duplicate spouse-child relationship skipped (update):", spouseId, rel.relative_id, "Child");
                            }
                            try {
                                await trx("relationships")
                                    .insert({
                                        person_id: rel.relative_id,
                                        relative_id: spouseId,
                                        relationship_type: "Parent"
                                    })
                                    .onConflict(["person_id", "relative_id", "relationship_type"])
                                    .ignore();
                            } catch (e) {
                                this.debug("Duplicate child-parent relationship skipped (update):", rel.relative_id, spouseId, "Parent");
                            }
                        }
                    }

                    // Add the main relationship
                    try {
                        await trx("relationships")
                            .insert({
                                person_id: personId,
                                relative_id: rel.relative_id,
                                relationship_type: rel.relationship_type
                            })
                            .onConflict(["person_id", "relative_id", "relationship_type"])
                            .ignore();
                    } catch (e) {
                        this.debug("Duplicate relationship skipped (update):", personId, rel.relative_id, rel.relationship_type);
                    }
                    let reverseType = null;
                    switch (rel.relationship_type) {
                        case "Parent": reverseType = "Child"; break;
                        case "Child": reverseType = "Parent"; break;
                        case "Sibling": reverseType = "Sibling"; break;
                        case "Spouse": reverseType = "Spouse"; break;
                    }
                    if (reverseType) {
                        try {
                            await trx("relationships")
                                .insert({
                                    person_id: rel.relative_id,
                                    relative_id: personId,
                                    relationship_type: reverseType
                                })
                                .onConflict(["person_id", "relative_id", "relationship_type"])
                                .ignore();
                        } catch (e) {
                            this.debug("Duplicate relationship skipped (update-reverse):", rel.relative_id, personId, reverseType);
                        }
                    }
                }
            }
            await trx.commit();
            this.info("updatePersonWithMedia committed for id:", personId);
            return { id: personId };
        } catch (error) {
            await trx.rollback();
            this.error("updatePersonWithMedia error:", error);
            throw error;
        }
    }

    static async downloadImageToFile(url, destPath) {
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

    static async uploadToCloudinary(filePath, publicId) {
        return cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            folder: "familytree",
            overwrite: true,
            resource_type: "image"
        });
    }

    static async uploadUrlToCloudinary(imageUrl, publicId) {
        return cloudinary.uploader.upload(imageUrl, {
            public_id: publicId,
            folder: "familytree",
            overwrite: true,
            resource_type: "image"
        });
    }

    static async _handleProfilePicture({ personId, first_name, last_name, profile_picture, file, trx, isDev }) {
        this.debug("_handleProfilePicture called for id:", personId);

        if (isDev) {
            if (file) {
                const ext = path.extname(file.originalname);
                const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
                const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
                const newFileName = `${safeFirst}_${safeLast}_${personId}${ext}`;
                const imagesDir = path.join(__dirname, "../../public/images");
                const newFilePath = path.join(imagesDir, newFileName);

                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir, { recursive: true });
                }

                if (fs.existsSync(file.path)) {
                    if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
                    fs.renameSync(file.path, newFilePath);
                    await trx("persons").where({ id: personId }).update({
                        profile_picture: `/images/${newFileName}`
                    });
                } else {
                    this.error("_handleProfilePicture: file.path does not exist", file.path);
                }
            } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
                const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
                const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
                const personName = `${safeFirst}_${safeLast}`.replace(/_+$/, "");
                const newFileName = `${personName}_${personId}.jpeg`;
                const imagesDir = path.join(__dirname, "../../public/images");
                const newFilePath = path.join(imagesDir, newFileName);

                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir, { recursive: true });
                }

                if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
                try {
                    await this.downloadImageToFile(profile_picture, newFilePath);
                    await trx("persons").where({ id: personId }).update({
                        profile_picture: `/images/${newFileName}`
                    });
                } catch (err) {
                    this.error("_handleProfilePicture: downloadImageToFile error", err);
                }
            }
        } else {
            if (file) {
                const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
                const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
                const publicId = `${safeFirst}_${safeLast}_${personId}`;
                try {
                    const result = await this.uploadToCloudinary(file.path, publicId);
                    await trx("persons").where({ id: personId }).update({
                        profile_picture: result.secure_url
                    });
                    fs.unlinkSync(file.path);
                } catch (err) { }
            } else if (profile_picture && typeof profile_picture === "string" && profile_picture.startsWith("http")) {
                const safeFirst = String(first_name).replace(/[^a-zA-Z0-9]/g, "");
                const safeLast = String(last_name).replace(/[^a-zA-Z0-9]/g, "");
                const publicId = `${safeFirst}_${safeLast}_${personId}`;
                try {
                    const result = await this.uploadUrlToCloudinary(profile_picture, publicId);
                    await trx("persons").where({ id: personId }).update({
                        profile_picture: result.secure_url
                    });
                } catch (err) { }
            }
        }
    }
}

module.exports = PersonService;
