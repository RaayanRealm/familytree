CREATE TABLE persons (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE NOT NULL,
    place_of_birth VARCHAR(255),
    current_location VARCHAR(255),
    occupation VARCHAR(255),
    nationality VARCHAR(100),
    ethnicity VARCHAR(100),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    social_media JSONB, -- Store links like Twitter, LinkedIn
    biography TEXT,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    person_id INT REFERENCES persons(id) ON DELETE CASCADE,
    relative_id INT REFERENCES persons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) CHECK (relationship_type IN (
        'Parent', 'Child', 'Sibling', 'Spouse', 'Grandparent', 'Grandchild', 
        'Cousin', 'Uncle', 'Aunt', 'Nephew', 'Niece'
    )),
    additional_info TEXT,
    UNIQUE(person_id, relative_id, relationship_type)
);

CREATE TABLE marriages (
    id SERIAL PRIMARY KEY,
    person_id INT REFERENCES persons(id) ON DELETE CASCADE,
    spouse_id INT REFERENCES persons(id) ON DELETE CASCADE,
    marriage_date DATE NOT NULL,
    anniversary_celebration BOOLEAN DEFAULT TRUE,
    divorce_date DATE NULL,
    UNIQUE(person_id, spouse_id)
);

CREATE TABLE deaths (
    id SERIAL PRIMARY KEY,
    person_id INT REFERENCES persons(id) ON DELETE CASCADE,
    death_date DATE NOT NULL,
    cause_of_death VARCHAR(255),
    burial_place VARCHAR(255),
    obituary TEXT
);

CREATE TABLE lineages (
    id SERIAL PRIMARY KEY,
    lineage_name VARCHAR(255) NOT NULL,
    root_person_id INT REFERENCES persons(id) ON DELETE CASCADE,
    origin_date DATE NULL,
    historical_notes TEXT
);

CREATE TABLE family_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(255),
    event_description TEXT,
    organizer_id INT REFERENCES persons(id) ON DELETE SET NULL
);