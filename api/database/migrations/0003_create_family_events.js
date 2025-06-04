exports.up = function (knex) {
  return knex.schema.createTable("family_events", table => {
    table.increments("id").primary();
    table.string("event_name").notNullable();
    table.date("event_date").notNullable();
    table.string("location");
    table.text("event_description");
    table.integer("organizer_id").references("id").inTable("persons").onDelete("SET NULL");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("family_events");
};