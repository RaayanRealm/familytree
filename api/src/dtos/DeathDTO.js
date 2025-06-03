class DeathDTO {
    constructor(entity) {
        this.id = entity.id;
        this.date = entity.date;
        this.cause = entity.cause;
        this.place = entity.place;
        this.obituary = entity.obituary;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }
}
module.exports = DeathDTO;
