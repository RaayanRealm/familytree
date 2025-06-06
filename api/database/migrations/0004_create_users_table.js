exports.up = function (knex) {
    return knex.schema.createTable("users", function (table) {
        table.increments("id").primary();
        table.string("username").unique().notNullable();
        table.string("password_hash").notNullable();
        table.string("role").notNullable(); // admin, editor, viewer, guest
        table.integer("member_id").references("id").inTable("persons").onDelete("SET NULL");
        table.string("name");
        table.string("email");
        table.string("phone");
        table.string("profile_picture");
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("users");
};
