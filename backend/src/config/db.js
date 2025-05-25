const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "localhost",
    user: "family_admin",
    password: "raayan",
    database: "family_tree_db",
  },
});

module.exports = db;