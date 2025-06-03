const RelationshipEntity = require("../entities/RelationshipEntity");
const RelationshipDTO = require("../dtos/RelationshipDTO");

class RelationshipService {
    static async getAllRelationships(db) {
        const rows = await db("relationships")
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

    static async createRelationship(data, db) {
        const [row] = await db("relationships").insert(data).returning("*");
        return new RelationshipDTO(new RelationshipEntity(row));
    }

    static async deleteRelationshipsForPerson(personId, db) {
        await db("relationships").where({ person_id: personId }).del();
    }
}

module.exports = RelationshipService;
