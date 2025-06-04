exports.up = function (knex) {
  return knex.schema.createTable("relationships", table => {
    table.increments("id").primary();
    table.integer("person_id").references("id").inTable("persons").onDelete("CASCADE");
    table.integer("relative_id").references("id").inTable("persons").onDelete("CASCADE");
    table.string("relationship_type").checkIn([
      "Parent", "Child", "Sibling", "Spouse", "Grandparent", "Grandchild"
    ]);
    table.text("additional_info");
    table.unique(["person_id", "relative_id", "relationship_type"]);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("relationships");
};