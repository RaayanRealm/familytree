const EventEntity = require("../entities/EventEntity");
const EventDTO = require("../dtos/EventDTO");

class EventService {
    static async getAllEvents(db) {
        const rows = await db("family_events")
            .leftJoin("persons", "family_events.organizer_id", "persons.id")
            .select(
                "family_events.*",
                db.raw("CONCAT(persons.first_name, ' ', persons.last_name) as organizer_name")
            )
            .orderBy("event_date", "desc");
        return rows.map(row => new EventDTO(new EventEntity(row), row.organizer_name));
    }

    static async createEvent(data, db) {
        // Only allow fields defined in EventEntity
        const insertData = {
            event_name: data.event_name,
            event_date: data.event_date,
            location: data.location,
            event_description: data.event_description,
            organizer_id: data.organizer_id,
        };
        const [row] = await db("family_events").insert(insertData).returning("*");
        // Get organizer name if possible
        let organizer_name = null;
        if (row.organizer_id) {
            const person = await db("persons").where({ id: row.organizer_id }).first();
            if (person) {
                organizer_name = `${person.first_name} ${person.last_name}`;
            }
        }
        return new EventDTO(new EventEntity(row), organizer_name);
    }

    static async deleteEvent(eventId, db) {
        await db("family_events").where({ id: eventId }).del();
    }
}

module.exports = EventService;
