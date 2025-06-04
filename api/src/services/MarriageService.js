const MarriageEntity = require("../entities/MarriageEntity");
const MarriageDTO = require("../dtos/MarriageDTO");

class MarriageService {
    static async createMarriage(data, db) {
        const { person_id, spouse_id, marriage_date, divorce_date } = data;
        if (!person_id || !spouse_id || person_id === spouse_id) {
            throw new Error("Invalid spouse selection.");
        }
        const [marriageRow] = await db("marriages")
            .insert({
                person_id,
                spouse_id,
                marriage_date,
                divorce_date
            })
            .returning("*");
        // Also add relationships as Spouse for both
        await db("relationships").insert([
            { person_id, relative_id: spouse_id, relationship_type: "Spouse" },
            { person_id: spouse_id, relative_id: person_id, relationship_type: "Spouse" }
        ]);
        const marriageEntity = new MarriageEntity(marriageRow);
        return new MarriageDTO(marriageEntity);
    }
}

module.exports = MarriageService;
