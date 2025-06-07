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

// Helper to increment ID
let personId = 1;
function nextPersonId() {
    return personId++;
}

exports.seed = async function (knex) {
    // Deletes ALL existing entries
    await knex("relationships").del();
    await knex("deaths").del();
    await knex("marriages").del();
    await knex("family_events").del();
    await knex("users").del();
    await knex("persons").del();

    // --- Data pools ---
    const firstNamesM = ["John", "Michael", "David", "Chris", "James", "Robert", "William", "Richard", "Charles", "Joseph"];
    const firstNamesF = ["Jane", "Emily", "Sarah", "Olivia", "Sophia", "Emma", "Linda", "Mary", "Patricia", "Jennifer"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"];
    const occupations = ["Engineer", "Doctor", "Teacher", "Artist", "Lawyer", "Nurse", "Scientist", "Writer"];
    const nationalities = ["American", "Canadian", "British", "Australian", "Indian"];
    const places = ["New York", "London", "Toronto", "Sydney", "Delhi", "San Francisco", "Paris", "Berlin"];
    const now = new Date();

    // --- Generate persons, relationships, marriages, deaths ---
    const persons = [];
    const relationships = [];
    const marriages = [];
    const deaths = [];

    // Helper to create a person
    function createPerson({ gender, first_name, last_name, dob, place_of_birth, current_location, occupation, nationality, phone, email, profile_picture, biography, nickname }) {
        const id = nextPersonId();
        return {
            id,
            first_name,
            last_name,
            nickname: nickname || `nick${id}`,
            gender,
            dob,
            place_of_birth,
            current_location,
            occupation,
            nationality,
            phone: phone || `+1-555-01${String(id).padStart(3, "0")}`,
            email: email || `user${id}@example.com`,
            profile_picture: profile_picture || (gender === "Male" ? "/images/ajay.jpg" : "/images/neetu.jpg"),
            biography: biography || `Biography for member ${id}`,
            social_media: JSON.stringify({}),
            created_at: now,
            updated_at: now
        };
    }

    // Helper to create a marriage
    function createMarriage(person_id, spouse_id, marriage_date, divorce_date = null) {
        marriages.push({
            person_id,
            spouse_id,
            marriage_date,
            divorce_date,
            created_at: now,
            updated_at: now
        });
        marriages.push({
            person_id: spouse_id,
            spouse_id: person_id,
            marriage_date,
            divorce_date,
            created_at: now,
            updated_at: now
        });
    }

    // Helper to create parent/child relationships
    function relateParentsChild(fatherId, motherId, childId) {
        relationships.push(
            { person_id: childId, relative_id: fatherId, relationship_type: "Parent", created_at: now, updated_at: now },
            { person_id: childId, relative_id: motherId, relationship_type: "Parent", created_at: now, updated_at: now },
            { person_id: fatherId, relative_id: childId, relationship_type: "Child", created_at: now, updated_at: now },
            { person_id: motherId, relative_id: childId, relationship_type: "Child", created_at: now, updated_at: now }
        );
    }

    // Helper to create sibling relationships
    function relateSiblings(siblingIds) {
        for (let i = 0; i < siblingIds.length; i++) {
            for (let j = 0; j < siblingIds.length; j++) {
                if (i !== j) {
                    relationships.push({
                        person_id: siblingIds[i],
                        relative_id: siblingIds[j],
                        relationship_type: "Sibling",
                        created_at: now,
                        updated_at: now
                    });
                }
            }
        }
    }

    // Helper to create spouse relationships
    function relateSpouses(id1, id2) {
        relationships.push(
            { person_id: id1, relative_id: id2, relationship_type: "Spouse", created_at: now, updated_at: now },
            { person_id: id2, relative_id: id1, relationship_type: "Spouse", created_at: now, updated_at: now }
        );
    }

    // Helper to create a death record
    function createDeath(person, minYear = 2010, maxYear = 2020) {
        // Only create death if person is old enough
        const dobYear = parseInt(person.dob.split("-")[0]);
        const deathYear = Math.max(dobYear + 40, minYear);
        const date = randomDate(new Date(deathYear, 0, 1), new Date(maxYear, 0, 1));
        deaths.push({
            person_id: person.id,
            date,
            cause: pick(["Natural", "Accident", "Illness"]),
            place: pick(places),
            obituary: `Obituary for member ${person.id}`,
            created_at: now,
            updated_at: now
        });
    }

    // --- Generate 10 lineages, each with 3 generations, each family with 4 children, and their children ---
    let lineageCount = 10;
    let allChildren = [];
    for (let l = 0; l < lineageCount; l++) {
        // Generation 1: Founding couple
        const father = createPerson({
            gender: "Male",
            first_name: pick(firstNamesM),
            last_name: pick(lastNames),
            dob: randomDate(new Date(1940, 0, 1), new Date(1950, 0, 1)),
            place_of_birth: pick(places),
            current_location: pick(places),
            occupation: pick(occupations),
            nationality: pick(nationalities)
        });
        const mother = createPerson({
            gender: "Female",
            first_name: pick(firstNamesF),
            last_name: father.last_name,
            dob: randomDate(new Date(1942, 0, 1), new Date(1952, 0, 1)),
            place_of_birth: pick(places),
            current_location: pick(places),
            occupation: pick(occupations),
            nationality: pick(nationalities)
        });
        persons.push(father, mother);
        createMarriage(father.id, mother.id, randomDate(new Date(1960, 0, 1), new Date(1970, 0, 1)));
        relateSpouses(father.id, mother.id);

        // Generation 2: 4 children
        const childrenGen2 = [];
        for (let c = 0; c < 4; c++) {
            const gender = c % 2 === 0 ? "Male" : "Female";
            const child = createPerson({
                gender,
                first_name: gender === "Male" ? pick(firstNamesM) : pick(firstNamesF),
                last_name: father.last_name,
                dob: randomDate(new Date(1965, 0, 1), new Date(1975, 0, 1)),
                place_of_birth: pick(places),
                current_location: pick(places),
                occupation: pick(occupations),
                nationality: pick(nationalities)
            });
            persons.push(child);
            relateParentsChild(father.id, mother.id, child.id);
            childrenGen2.push(child.id);
        }
        relateSiblings(childrenGen2);

        // Generation 3: Each of 3 children gets married and has 2-3 children
        for (let i = 0; i < 3; i++) {
            const parent = persons.find(p => p.id === childrenGen2[i]);
            // Spouse
            const spouseGender = parent.gender === "Male" ? "Female" : "Male";
            const spouse = createPerson({
                gender: spouseGender,
                first_name: spouseGender === "Male" ? pick(firstNamesM) : pick(firstNamesF),
                last_name: parent.last_name,
                dob: randomDate(new Date(1967, 0, 1), new Date(1977, 0, 1)),
                place_of_birth: pick(places),
                current_location: pick(places),
                occupation: pick(occupations),
                nationality: pick(nationalities)
            });
            persons.push(spouse);
            createMarriage(parent.id, spouse.id, randomDate(new Date(1985, 0, 1), new Date(1995, 0, 1)));
            relateSpouses(parent.id, spouse.id);

            // Children (2-3)
            const childrenGen3 = [];
            const numChildren = 2 + Math.floor(Math.random() * 2);
            for (let j = 0; j < numChildren; j++) {
                const gender = j % 2 === 0 ? "Male" : "Female";
                const child = createPerson({
                    gender,
                    first_name: gender === "Male" ? pick(firstNamesM) : pick(firstNamesF),
                    last_name: parent.last_name,
                    dob: randomDate(new Date(1990, 0, 1), new Date(2005, 0, 1)),
                    place_of_birth: pick(places),
                    current_location: pick(places),
                    occupation: pick(occupations),
                    nationality: pick(nationalities)
                });
                persons.push(child);
                relateParentsChild(parent.id, spouse.id, child.id);
                childrenGen3.push(child.id);
                allChildren.push(child.id);
            }
            relateSiblings(childrenGen3);
        }
        allChildren = allChildren.concat(childrenGen2);
    }

    // --- Add more random persons to reach 500+ ---
    while (persons.length < 520) {
        const gender = Math.random() > 0.5 ? "Male" : "Female";
        persons.push(createPerson({
            gender,
            first_name: gender === "Male" ? pick(firstNamesM) : pick(firstNamesF),
            last_name: pick(lastNames),
            dob: randomDate(new Date(1950, 0, 1), new Date(2010, 0, 1)),
            place_of_birth: pick(places),
            current_location: pick(places),
            occupation: pick(occupations),
            nationality: pick(nationalities)
        }));
    }

    // --- Add some deaths (only for persons born before 1980) ---
    persons.forEach(person => {
        const birthYear = parseInt(person.dob.split("-")[0]);
        if (birthYear < 1980 && Math.random() < 0.4) {
            createDeath(person, birthYear + 40, 2022);
        }
    });

    // --- Insert all data ---
    await knex("persons").insert(persons);
    await knex("relationships").insert(relationships);
    await knex("marriages").insert(marriages);
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
