exports.up = function(knex) {
  return knex.schema.createTable("persons", table => {
    table.increments("id").primary();
    table.string("first_name").notNullable();
    table.string("last_name");
    table.string("gender").notNullable().checkIn(["Male", "Female", "Other"]);
    table.date("dob").notNullable();
    table.string("place_of_birth");
    table.string("current_location");
    table.string("occupation");
    table.string("nationality");
    table.string("phone").unique();
    table.string("email").unique();
    table.json("social_media");
    table.text("biography");
    table.string("profile_picture").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("persons");
};