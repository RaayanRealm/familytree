class DeathEntity {
    constructor(row) {
        this.id = row.id;
        this.person_id = row.person_id;
        this.date = row.date;
        this.cause = row.cause;
        this.place = row.place;
        this.obituary = row.obituary;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = DeathEntity;
