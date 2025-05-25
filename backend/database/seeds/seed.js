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
      phone: "1234567890",
      email: "john.doe@example.com",
      profile_picture: "/images/ajay.jpg",
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
      phone: "9876543210",
      email: "jane.doe@example.com",
      profile_picture: "/images/neetu.jpg",
    },
  ]).returning("id");


  await knex("relationships").insert([
    { person_id: 1, relative_id: 2, relationship_type: "Spouse" },
    { person_id: 2, relative_id: 1, relationship_type: "Spouse" },
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