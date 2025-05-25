exports.seed = async function (knex) {
  // Clear existing data
  await knex("family_events").del();
  await knex("lineages").del();
  await knex("deaths").del();
  await knex("marriages").del();
  await knex("relationships").del();
  await knex("persons").del();

  // Insert data into `persons` table
  const persons = await knex("persons").insert([
    {
      first_name: "John",
      last_name: "Doe",
      gender: "Male",
      dob: "1980-05-10",
      place_of_birth: "New York, USA",
      current_location: "San Francisco, USA",
      occupation: "Software Engineer",
      nationality: "American",
      phone: "1234557890",
      email: "john.doe@example.com",
      profile_picture: "/images/ajay.jpg",
      biography: "John is an experienced engineer with a passion for innovation."
    },
    {
      first_name: "Jane",
      last_name: "Doe",
      gender: "Female",
      dob: "1982-08-15",
      place_of_birth: "Los Angeles, USA",
      current_location: "San Francisco, USA",
      occupation: "Doctor",
      nationality: "American",
      phone: "9876543290",
      email: "jane.doe@example.com",
      profile_picture: "/images/neetu.jpg",
      biography: "Jane is a compassionate doctor working in the field of pediatrics."
    },
    {
      first_name: "Ajay", last_name: "Sharma", gender: "Male", dob: "1980-05-10",
      place_of_birth: "Delhi, India", current_location: "Mumbai, India",
      occupation: "Engineer", nationality: "Indian", phone: "1234567890",
      email: "ajay.sharma@example.com", profile_picture: "/images/ajay.jpg",
      biography: "Ajay is an experienced engineer with a passion for innovation."
    },

    {
      first_name: "Neetu", last_name: "Sharma", gender: "Female", dob: "1985-07-15",
      place_of_birth: "Mumbai, India", current_location: "Mumbai, India",
      occupation: "Doctor", nationality: "Indian", phone: "9876543210",
      email: "neetu.sharma@example.com", profile_picture: "/images/neetu.jpg",
      biography: "Neetu is a compassionate doctor working in the field of pediatrics."
    },

    {
      first_name: "Vikram", last_name: "Singh", gender: "Male", dob: "1975-09-20",
      place_of_birth: "Chennai, India", current_location: "Bangalore, India",
      occupation: "Professor", nationality: "Indian", phone: "2233445566",
      email: "vikram.singh@example.com", profile_picture: "/images/ajay.jpg",
      biography: "Vikram is a professor specializing in physics research."
    },

    {
      first_name: "Megha", last_name: "Verma", gender: "Female", dob: "1990-11-12",
      place_of_birth: "Kolkata, India", current_location: "Delhi, India",
      occupation: "Artist", nationality: "Indian", phone: "3344556677",
      email: "megha.verma@example.com", profile_picture: "/images/neetu.jpg",
      biography: "Megha is an accomplished painter whose works are displayed globally."
    },

  ]).returning("id");


  await knex("relationships").insert([
    { person_id: persons[0].id, relative_id: persons[1].id, relationship_type: "Spouse" },
    { person_id: persons[1].id, relative_id: persons[0].id, relationship_type: "Spouse" },
    { person_id: persons[2].id, relative_id: persons[3].id, relationship_type: "Spouse" },
    { person_id: persons[3].id, relative_id: persons[2].id, relationship_type: "Spouse" },
    { person_id: persons[4].id, relative_id: persons[5].id, relationship_type: "Spouse" },
    { person_id: persons[5].id, relative_id: persons[4].id, relationship_type: "Spouse" },
  ]);




  // Insert data into `marriages` table
  await knex("marriages").insert([
    {
      person_id: persons[0].id,
      spouse_id: persons[1].id,
      marriage_date: "2005-06-20",
    },
  ]);

  // Insert data into `deaths` table (if any family members passed away)
  await knex("deaths").insert([
    {
      person_id: persons[1].id,
      death_date: "2023-04-10",
      cause_of_death: "Natural Causes",
      burial_place: "San Francisco Cemetery",
      obituary: "Loving wife and mother.",
    },
  ]);

  // Insert data into `lineages` table (family history tracking)
  await knex("lineages").insert([
    {
      lineage_name: "Doe Family",
      root_person_id: persons[0].id,
      origin_date: "1900-01-01",
      historical_notes: "This lineage dates back to 1900s with deep heritage.",
    },
  ]);

  // Insert data into `family_events` table
  await knex("family_events").insert([
    {
      event_name: "Doe Family Reunion",
      event_date: "2024-12-25",
      location: "New York, USA",
      event_description: "Annual family gathering.",
      organizer_id: persons[0].id,
    },
  ]);

  await knex("relationships").insert([
    { person_id: 1, relative_id: 2, relationship_type: "Spouse" },
    { person_id: 2, relative_id: 1, relationship_type: "Spouse" }, // ✅ Add the reverse relation
  ]);


  console.log("✅ Seed data inserted successfully!");
};