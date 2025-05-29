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
      nickname: "Johnny",
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
    { first_name: "Jane", last_name: "Doe", nickname: "Janey", gender: "Female", dob: "1982-08-15", place_of_birth: "Los Angeles, USA", current_location: "San Francisco, USA", occupation: "Doctor", nationality: "American", phone: "9876543290", email: "jane.doe@example.com", profile_picture: "/images/neetu.jpg", biography: "Jane is a compassionate doctor working in the field of pediatrics." },
    { first_name: "Ajay", last_name: "Sharma", nickname: "AJ", gender: "Male", dob: "1980-05-10", place_of_birth: "Delhi, India", current_location: "Mumbai, India", occupation: "Engineer", nationality: "Indian", phone: "1234567890", email: "ajay.sharma@example.com", profile_picture: "/images/ajay.jpg", biography: "Ajay is an experienced engineer with a passion for innovation." },
    { first_name: "Neetu", last_name: "Sharma", nickname: "Neets", gender: "Female", dob: "1985-07-15", place_of_birth: "Mumbai, India", current_location: "Mumbai, India", occupation: "Doctor", nationality: "Indian", phone: "9876543210", email: "neetu.sharma@example.com", profile_picture: "/images/neetu.jpg", biography: "Neetu is a compassionate doctor working in the field of pediatrics." },
    { first_name: "Vikram", last_name: "Singh", nickname: "Vicky", gender: "Male", dob: "1975-09-20", place_of_birth: "Chennai, India", current_location: "Bangalore, India", occupation: "Professor", nationality: "Indian", phone: "2233445566", email: "vikram.singh@example.com", profile_picture: "/images/ajay.jpg", biography: "Vikram is a professor specializing in physics research." },
    { first_name: "Megha", last_name: "Verma", nickname: "Meg", gender: "Female", dob: "1990-11-12", place_of_birth: "Kolkata, India", current_location: "Delhi, India", occupation: "Artist", nationality: "Indian", phone: "3344556677", email: "megha.verma@example.com", profile_picture: "/images/neetu.jpg", biography: "Megha is an accomplished painter whose works are displayed globally." },
    { first_name: "Carlos", last_name: "Martinez", nickname: "Carlito", gender: "Male", dob: "1970-03-22", place_of_birth: "Madrid, Spain", current_location: "Barcelona, Spain", occupation: "Chef", nationality: "Spanish", phone: "4455667788", email: "carlos.martinez@example.com", profile_picture: "/images/ajay.jpg", biography: "Carlos is a renowned chef in Barcelona." },
    { first_name: "Maria", last_name: "Martinez", nickname: "Mari", gender: "Female", dob: "1972-06-18", place_of_birth: "Barcelona, Spain", current_location: "Barcelona, Spain", occupation: "Teacher", nationality: "Spanish", phone: "5566778899", email: "maria.martinez@example.com", profile_picture: "/images/neetu.jpg", biography: "Maria teaches literature at a local school." },
    { first_name: "Liam", last_name: "Smith", nickname: "Lee", gender: "Male", dob: "2000-01-01", place_of_birth: "London, UK", current_location: "London, UK", occupation: "Student", nationality: "British", phone: "6677889900", email: "liam.smith@example.com", profile_picture: "/images/ajay.jpg", biography: "Liam is a university student." },
    { first_name: "Olivia", last_name: "Smith", nickname: "Liv", gender: "Female", dob: "2002-02-02", place_of_birth: "London, UK", current_location: "London, UK", occupation: "Student", nationality: "British", phone: "7788990011", email: "olivia.smith@example.com", profile_picture: "/images/neetu.jpg", biography: "Olivia is Liam's younger sister." },
    { first_name: "David", last_name: "Brown", nickname: "Dave", gender: "Male", dob: "1965-04-10", place_of_birth: "Sydney, Australia", current_location: "Melbourne, Australia", occupation: "Architect", nationality: "Australian", phone: "8899001122", email: "david.brown@example.com", profile_picture: "/images/ajay.jpg", biography: "David designs skyscrapers." },
    { first_name: "Emma", last_name: "Brown", nickname: "Em", gender: "Female", dob: "1967-05-15", place_of_birth: "Melbourne, Australia", current_location: "Melbourne, Australia", occupation: "Nurse", nationality: "Australian", phone: "9900112233", email: "emma.brown@example.com", profile_picture: "/images/neetu.jpg", biography: "Emma is a senior nurse." },
    { first_name: "Lucas", last_name: "Brown", nickname: "Luke", gender: "Male", dob: "1995-07-20", place_of_birth: "Melbourne, Australia", current_location: "Sydney, Australia", occupation: "Photographer", nationality: "Australian", phone: "1011121314", email: "lucas.brown@example.com", profile_picture: "/images/ajay.jpg", biography: "Lucas is a wildlife photographer." },
    { first_name: "Sophia", last_name: "Brown", nickname: "Sophie", gender: "Female", dob: "1998-09-25", place_of_birth: "Melbourne, Australia", current_location: "Sydney, Australia", occupation: "Designer", nationality: "Australian", phone: "1213141516", email: "sophia.brown@example.com", profile_picture: "/images/neetu.jpg", biography: "Sophia is a graphic designer." },
    { first_name: "Ethan", last_name: "Lee", nickname: "E", gender: "Male", dob: "1988-12-12", place_of_birth: "Seoul, South Korea", current_location: "Busan, South Korea", occupation: "Musician", nationality: "Korean", phone: "1314151617", email: "ethan.lee@example.com", profile_picture: "/images/ajay.jpg", biography: "Ethan plays the piano professionally." },
    { first_name: "Mia", last_name: "Lee", nickname: "Mimi", gender: "Female", dob: "1990-10-10", place_of_birth: "Busan, South Korea", current_location: "Busan, South Korea", occupation: "Dancer", nationality: "Korean", phone: "1415161718", email: "mia.lee@example.com", profile_picture: "/images/neetu.jpg", biography: "Mia is a ballet dancer." },
    { first_name: "Noah", last_name: "Kim", nickname: "Nono", gender: "Male", dob: "2010-03-03", place_of_birth: "Seoul, South Korea", current_location: "Busan, South Korea", occupation: "Student", nationality: "Korean", phone: "1516171819", email: "noah.kim@example.com", profile_picture: "/images/ajay.jpg", biography: "Noah is the son of Ethan and Mia." },
    { first_name: "Ava", last_name: "Kim", nickname: "Avy", gender: "Female", dob: "2012-04-04", place_of_birth: "Busan, South Korea", current_location: "Busan, South Korea", occupation: "Student", nationality: "Korean", phone: "1617181920", email: "ava.kim@example.com", profile_picture: "/images/neetu.jpg", biography: "Ava is Noah's younger sister." },
    { first_name: "William", last_name: "Garcia", nickname: "Will", gender: "Male", dob: "1978-08-08", place_of_birth: "Mexico City, Mexico", current_location: "Guadalajara, Mexico", occupation: "Lawyer", nationality: "Mexican", phone: "1718192021", email: "william.garcia@example.com", profile_picture: "/images/ajay.jpg", biography: "William is a senior lawyer." },
    { first_name: "Isabella", last_name: "Garcia", nickname: "Bella", gender: "Female", dob: "1980-09-09", place_of_birth: "Guadalajara, Mexico", current_location: "Guadalajara, Mexico", occupation: "Chef", nationality: "Mexican", phone: "1819202122", email: "isabella.garcia@example.com", profile_picture: "/images/neetu.jpg", biography: "Isabella is a pastry chef." }
  ]).returning("id");

  // Insert relationships (Parent, Child, Sibling, Spouse, Grandparent, Grandchild)
  await knex("relationships").insert([
    // John/Jane Doe family
    { person_id: persons[0].id, relative_id: persons[1].id, relationship_type: "Spouse" },
    { person_id: persons[1].id, relative_id: persons[0].id, relationship_type: "Spouse" },
    // Ajay/Neetu Sharma family
    { person_id: persons[2].id, relative_id: persons[3].id, relationship_type: "Spouse" },
    { person_id: persons[3].id, relative_id: persons[2].id, relationship_type: "Spouse" },
    // Siblings
    { person_id: persons[8].id, relative_id: persons[9].id, relationship_type: "Sibling" },
    { person_id: persons[9].id, relative_id: persons[8].id, relationship_type: "Sibling" },
    { person_id: persons[12].id, relative_id: persons[13].id, relationship_type: "Sibling" },
    { person_id: persons[13].id, relative_id: persons[12].id, relationship_type: "Sibling" },
    // Parent/Child
    { person_id: persons[0].id, relative_id: persons[8].id, relationship_type: "Parent" },
    { person_id: persons[1].id, relative_id: persons[8].id, relationship_type: "Parent" },
    { person_id: persons[8].id, relative_id: persons[0].id, relationship_type: "Child" },
    { person_id: persons[8].id, relative_id: persons[1].id, relationship_type: "Child" },
    // Grandparent/Grandchild
    { person_id: persons[0].id, relative_id: persons[16].id, relationship_type: "Grandparent" },
    { person_id: persons[16].id, relative_id: persons[0].id, relationship_type: "Grandchild" },
    // More relationships for diversity
    { person_id: persons[14].id, relative_id: persons[15].id, relationship_type: "Spouse" },
    { person_id: persons[15].id, relative_id: persons[14].id, relationship_type: "Spouse" },
    { person_id: persons[16].id, relative_id: persons[17].id, relationship_type: "Sibling" },
    { person_id: persons[17].id, relative_id: persons[16].id, relationship_type: "Sibling" },
    { person_id: persons[14].id, relative_id: persons[16].id, relationship_type: "Parent" },
    { person_id: persons[15].id, relative_id: persons[16].id, relationship_type: "Parent" },
    { person_id: persons[16].id, relative_id: persons[14].id, relationship_type: "Child" },
    { person_id: persons[16].id, relative_id: persons[15].id, relationship_type: "Child" },
    // Garcia family
    { person_id: persons[18].id, relative_id: persons[19].id, relationship_type: "Spouse" },
    { person_id: persons[19].id, relative_id: persons[18].id, relationship_type: "Spouse" }
  ]);

  // Insert marriages
  await knex("marriages").insert([
    { person_id: persons[0].id, spouse_id: persons[1].id, marriage_date: "2005-06-20" },
    { person_id: persons[2].id, spouse_id: persons[3].id, marriage_date: "2010-01-15" },
    { person_id: persons[14].id, spouse_id: persons[15].id, marriage_date: "2012-09-09" },
    { person_id: persons[18].id, spouse_id: persons[19].id, marriage_date: "2000-05-05" }
  ]);

  // Insert deaths
  await knex("deaths").insert([
    {
      person_id: persons[1].id,
      date: "2023-04-10",
      cause: "Natural Causes",
      place: "San Francisco Cemetery",
      obituary: "Jane was a loving wife, mother, and doctor who touched many lives."
    },
    {
      person_id: persons[5].id,
      date: "2022-11-01",
      cause: "Accident",
      place: "Delhi Memorial Park",
      obituary: "Megha was a talented artist and beloved friend."
    },
    {
      person_id: persons[7].id,
      date: "2021-08-15",
      cause: "Illness",
      place: "Barcelona Central",
      obituary: "Maria inspired generations of students."
    },
    {
      person_id: persons[11].id,
      date: "2019-03-20",
      cause: "Heart Attack",
      place: "Melbourne Resting Grounds",
      obituary: "Emma was a pillar of her community and family."
    }
  ]);

  // Insert lineages
  await knex("lineages").insert([
    {
      lineage_name: "Doe Family",
      root_person_id: persons[0].id,
      origin_date: "1900-01-01",
      historical_notes: "This lineage dates back to the early 1900s with deep heritage in New York."
    },
    {
      lineage_name: "Sharma Family",
      root_person_id: persons[2].id,
      origin_date: "1925-03-15",
      historical_notes: "A respected family from Delhi, known for their contributions to engineering and medicine."
    },
    {
      lineage_name: "Garcia Family",
      root_person_id: persons[18].id,
      origin_date: "1880-07-04",
      historical_notes: "A prominent family in Mexico, with a long tradition in law and culinary arts."
    },
    {
      lineage_name: "Brown Family",
      root_person_id: persons[10].id,
      origin_date: "1950-05-20",
      historical_notes: "The Browns have been influential in architecture and healthcare in Australia."
    },
    {
      lineage_name: "Lee-Kim Family",
      root_person_id: persons[14].id,
      origin_date: "1970-09-09",
      historical_notes: "A creative family from Korea, known for music, dance, and the arts."
    }
  ]);

  // Insert family events
  await knex("family_events").insert([
    {
      event_name: "Doe Family Reunion",
      event_date: "2024-12-25",
      location: "New York, USA",
      event_description: "Annual family gathering for all Doe family members.",
      organizer_id: persons[0].id
    },
    {
      event_name: "Ajay & Neetu Wedding",
      event_date: "2010-01-15",
      location: "Mumbai, India",
      event_description: "Wedding ceremony of Ajay and Neetu Sharma.",
      organizer_id: persons[2].id
    },
    {
      event_name: "Garcia Family Anniversary",
      event_date: "2020-05-05",
      location: "Guadalajara, Mexico",
      event_description: "20th wedding anniversary celebration for William and Isabella Garcia.",
      organizer_id: persons[18].id
    },
    {
      event_name: "Brown Family Picnic",
      event_date: "2023-03-10",
      location: "Melbourne Park, Australia",
      event_description: "A fun-filled picnic for the Brown family.",
      organizer_id: persons[10].id
    },
    {
      event_name: "Lee-Kim Talent Show",
      event_date: "2022-09-18",
      location: "Busan, South Korea",
      event_description: "A showcase of music and dance by the Lee-Kim family.",
      organizer_id: persons[14].id
    }
  ]);

  console.log("✅ Seed data inserted successfully!");
};