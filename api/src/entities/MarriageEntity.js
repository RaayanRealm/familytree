class MarriageEntity {
    constructor(row) {
        this.id = row.id;
        this.person_id = row.person_id;
        this.spouse_id = row.spouse_id;
        this.marriage_date = row.marriage_date;
        this.divorce_date = row.divorce_date;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = MarriageEntity;
