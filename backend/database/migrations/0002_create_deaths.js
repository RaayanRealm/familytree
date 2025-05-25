exports.up = function(knex) {
  return knex.schema.createTable("deaths", table => {
    table.increments("id").primary();
    table.integer("person_id").references("id").inTable("persons").onDelete("CASCADE");
    table.date("death_date").notNullable();
    table.string("cause_of_death");
    table.string("burial_place");
    table.text("obituary");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("deaths");
};