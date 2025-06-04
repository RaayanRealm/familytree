exports.up = function (knex) {
  return knex.schema.createTable("lineages", table => {
    table.increments("id").primary();
    table.string("lineage_name").notNullable();
    table.integer("root_person_id").references("id").inTable("persons").onDelete("CASCADE");
    table.date("origin_date").nullable();
    table.text("historical_notes");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("lineages");
};