exports.up = function (knex) {
  return knex.schema.createTable("deaths", table => {
    table.increments("id").primary();
    table.integer("person_id").references("id").inTable("persons").onDelete("CASCADE");
    table.date("date").notNullable();
    table.string("cause");
    table.string("place");
    table.text("obituary");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("deaths");
};