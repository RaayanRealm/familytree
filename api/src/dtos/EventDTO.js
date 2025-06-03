class EventDTO {
    constructor(entity, organizer_name = null) {
        this.id = entity.id;
        this.event_name = entity.event_name;
        this.event_date = entity.event_date;
        this.location = entity.location;
        this.event_description = entity.event_description;
        this.organizer_id = entity.organizer_id;
        this.organizer_name = organizer_name;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }
}
module.exports = EventDTO;
