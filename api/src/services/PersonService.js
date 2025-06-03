const PersonEntity = require("../entities/PersonEntity");
const PersonDTO = require("../dtos/PersonDTO");
const DeathEntity = require("../entities/DeathEntity");
const DeathDTO = require("../dtos/DeathDTO");
const MarriageEntity = require("../entities/MarriageEntity");
const MarriageDTO = require("../dtos/MarriageDTO");
const RelationshipEntity = require("../entities/RelationshipEntity");
const RelationshipDTO = require("../dtos/RelationshipDTO");

class PersonService {
    static async getAllPersons(db) {
        const rows = await db("persons").select("*");
        const results = [];
        for (const row of rows) {
            const entity = new PersonEntity(row);
            const deaths = await this.getDeathsForPerson(entity.id, db);
            const marriages = await this.getMarriagesForPerson(entity.id, db);
            const relationships = await this.getRelationshipsForPerson(entity.id, db);
            results.push(new PersonDTO(entity, deaths, marriages, relationships));
        }
        return results;
    }

    static async getRecentPersons(db, limit = 5) {
        const rows = await db("persons")
            .select("id", "first_name", "last_name", "profile_picture", "biography", "created_at")
            .orderBy("created_at", "desc")
            .limit(limit);
        return rows.map(row => new PersonDTO(new PersonEntity(row)));
    }

    static async getPersonById(id, db) {
        const row = await db("persons").where({ id }).first();
        if (!row) return null;
        const entity = new PersonEntity(row);
        const deaths = await this.getDeathsForPerson(id, db);
        const marriages = await this.getMarriagesForPerson(id, db);
        const relationships = await this.getRelationshipsForPerson(id, db);
        return new PersonDTO(entity, deaths, marriages, relationships);
    }

    static async createPerson(personData, db) {
        const [row] = await db("persons").insert(personData).returning("*");
        return new PersonDTO(new PersonEntity(row));
    }

    static async updatePerson(id, personData, db) {
        const [row] = await db("persons").where({ id }).update(personData).returning("*");
        return new PersonDTO(new PersonEntity(row));
    }

    static async deletePerson(id, db) {
        await db("persons").where({ id }).del();
        return true;
    }

    static async getDeathsForPerson(personId, db) {
        const rows = await db("deaths").where({ person_id: personId }).select("*");
        return rows.map(row => new DeathDTO(new DeathEntity(row)));
    }

    static async getMarriagesForPerson(personId, db) {
        const rows = await db("marriages")
            .where(function () {
                this.where({ person_id: personId }).orWhere({ spouse_id: personId });
            })
            .select("*");
        return rows.map(row => new MarriageDTO(new MarriageEntity(row)));
    }

    static async getRelationshipsForPerson(personId, db) {
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
}

module.exports = PersonService;
