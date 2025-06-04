const bcrypt = require("bcryptjs");

/**
 * Helper to generate random date between two dates
 */
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        .toISOString().split("T")[0];
}

/**
 * Helper to pick random from array
 */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

exports.seed = async function (knex) {
    // Deletes ALL existing entries
    await knex("relationships").del();
    await knex("deaths").del();
    await knex("marriages").del();
    await knex("family_events").del();
    await knex("users").del();
    await knex("persons").del();

    // --- Persons ---
    const firstNames = ["John", "Jane", "Alex", "Emily", "Michael", "Sarah", "David", "Olivia", "Chris", "Sophia"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"];
    const genders = ["Male", "Female"];
    const occupations = ["Engineer", "Doctor", "Teacher", "Artist", "Lawyer", "Nurse", "Scientist", "Writer"];
    const nationalities = ["American", "Canadian", "British", "Australian", "Indian"];
    const places = ["New York", "London", "Toronto", "Sydney", "Delhi", "San Francisco", "Paris", "Berlin"];
    const now = new Date();

    const persons = [];
    for (let i = 1; i <= 100; i++) {
        const gender = pick(genders);
        persons.push({
            id: i,
            first_name: pick(firstNames),
            last_name: pick(lastNames),
            nickname: `nick${i}`,
            gender,
            dob: randomDate(new Date(1940, 0, 1), new Date(2010, 0, 1)),
            place_of_birth: pick(places),
            current_location: pick(places),
            occupation: pick(occupations),
            nationality: pick(nationalities),
            phone: `+1-555-01${String(i).padStart(3, "0")}`,
            email: `user${i}@example.com`,
            profile_picture: gender === "Male" ? "/images/ajay.jpg" : "/images/neetu.jpg",
            biography: `Biography for member ${i}`,
            social_media: JSON.stringify({}),
            created_at: now,
            updated_at: now
        });
    }
    await knex("persons").insert(persons);

    // --- Relationships (simple parent/child/sibling/spouse) ---
    const relationships = [];
    for (let i = 2; i <= 100; i++) {
        // Parent-child
        if (i > 2) {
            relationships.push({
                person_id: i,
                relative_id: i - 1,
                relationship_type: "Parent",
                created_at: now,
                updated_at: now
            });
            relationships.push({
                person_id: i - 1,
                relative_id: i,
                relationship_type: "Child",
                created_at: now,
                updated_at: now
            });
        }
        // Sibling
        if (i % 2 === 0 && i > 2) {
            relationships.push({
                person_id: i,
                relative_id: i - 2,
                relationship_type: "Sibling",
                created_at: now,
                updated_at: now
            });
            relationships.push({
                person_id: i - 2,
                relative_id: i,
                relationship_type: "Sibling",
                created_at: now,
                updated_at: now
            });
        }
        // Spouse
        if (i % 10 === 0) {
            relationships.push({
                person_id: i,
                relative_id: i - 1,
                relationship_type: "Spouse",
                created_at: now,
                updated_at: now
            });
            relationships.push({
                person_id: i - 1,
                relative_id: i,
                relationship_type: "Spouse",
                created_at: now,
                updated_at: now
            });
        }
    }
    await knex("relationships").insert(relationships);

    // --- Marriages ---
    const marriages = [];
    for (let i = 10; i <= 100; i += 10) {
        marriages.push({
            person_id: i,
            spouse_id: i - 1,
            marriage_date: randomDate(new Date(1990, 0, 1), new Date(2015, 0, 1)),
            divorce_date: null,
            created_at: now,
            updated_at: now
        });
    }
    await knex("marriages").insert(marriages);

    // --- Deaths ---
    const deaths = [];
    for (let i = 1; i <= 20; i++) {
        deaths.push({
            person_id: i,
            date: randomDate(new Date(2010, 0, 1), new Date(2020, 0, 1)),
            cause: pick(["Natural", "Accident", "Illness"]),
            place: pick(places),
            obituary: `Obituary for member ${i}`,
            created_at: now,
            updated_at: now
        });
    }
    await knex("deaths").insert(deaths);

    // --- Family Events ---
    const events = [];
    for (let i = 1; i <= 10; i++) {
        events.push({
            event_name: `Family Event ${i}`,
            event_date: randomDate(new Date(2015, 0, 1), new Date(2024, 0, 1)),
            location: pick(places),
            event_description: `Description for event ${i}`,
            organizer_id: pick(persons).id,
            created_at: now,
            updated_at: now
        });
    }
    await knex("family_events").insert(events);

    // --- Users (4 roles) ---
    const users = [
        {
            username: "admin",
            password_hash: await bcrypt.hash("adminpass", 10),
            role: "admin",
            member_id: 1,
            created_at: now,
            updated_at: now
        },
        {
            username: "editor",
            password_hash: await bcrypt.hash("editorpass", 10),
            role: "editor",
            member_id: 2,
            created_at: now,
            updated_at: now
        },
        {
            username: "viewer",
            password_hash: await bcrypt.hash("viewerpass", 10),
            role: "viewer",
            member_id: 3,
            created_at: now,
            updated_at: now
        },
        {
            username: "guest",
            password_hash: await bcrypt.hash("guestpass", 10),
            role: "guest",
            member_id: 4,
            created_at: now,
            updated_at: now
        }
    ];
    await knex("users").insert(users);
};
