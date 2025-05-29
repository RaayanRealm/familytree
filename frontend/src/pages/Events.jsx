import React, { useEffect, useState } from "react";
import { getFamilyEvents } from "../services/api";
import "../styles/Events.css";

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

const Events = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        getFamilyEvents().then(setEvents);
    }, []);

    return (
        <div className="events-container">
            <h2>Family Events</h2>
            <div className="events-list">
                {events.length === 0 && <div className="no-events">No events found.</div>}
                {events.map(event => (
                    <div className="event-card" key={event.id}>
                        <div className="event-header">
                            <span className="event-title">{event.event_name}</span>
                            <span className="event-date">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="event-location">{event.location}</div>
                        <div className="event-description">{event.event_description}</div>
                        {event.organizer_name && (
                            <div className="event-organizer">
                                <span>Organizer: {event.organizer_name}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
