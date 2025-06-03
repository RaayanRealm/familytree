class EventEntity {
    constructor(row) {
        this.id = row.id;
        this.event_name = row.event_name;
        this.event_date = row.event_date;
        this.location = row.location;
        this.event_description = row.event_description;
        this.organizer_id = row.organizer_id;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = EventEntity;
