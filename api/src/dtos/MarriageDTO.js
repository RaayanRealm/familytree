class MarriageDTO {
    constructor(entity) {
        this.id = entity.id;
        this.person_id = entity.person_id;
        this.spouse_id = entity.spouse_id;
        this.marriage_date = entity.marriage_date;
        this.divorce_date = entity.divorce_date;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }
}
module.exports = MarriageDTO;
