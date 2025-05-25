exports.up = function(knex) {
  return knex.schema.createTable("marriages", table => {
    table.increments("id").primary();
    table.integer("person_id").references("id").inTable("persons").onDelete("CASCADE");
    table.integer("spouse_id").references("id").inTable("persons").onDelete("CASCADE");
    table.date("marriage_date").notNullable();
    table.boolean("anniversary_celebration").defaultTo(true);
    table.date("divorce_date").nullable();
    table.unique(["person_id", "spouse_id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("marriages");
};