const MarriageEntity = require("../entities/MarriageEntity");
const MarriageDTO = require("../dtos/MarriageDTO");

class MarriageService {
    static async createMarriage(data, db) {
        const { person_id, spouse_id, marriage_date, divorce_date } = data;
        if (!person_id || !spouse_id || person_id === spouse_id) {
            throw new Error("Invalid spouse selection.");
        }
        // Check if marriage already exists
        const existingMarriage = await db("marriages")
            .where(function () {
                this.where({ person_id, spouse_id })
                    .orWhere({ person_id: spouse_id, spouse_id: person_id });
            })
            .first();
        if (existingMarriage) {
            // update the existing marriage record
            const [updatedMarriage] = await db("marriages")
                .where({ id: existingMarriage.id })
                .update({
                    marriage_date,
                    divorce_date
                })
                .returning("*");
            const marriageEntity = new MarriageEntity(updatedMarriage);
            return new MarriageDTO(marriageEntity);
        } else {
            // Insert the marriage record
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
}

module.exports = MarriageService;
