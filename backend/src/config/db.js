require('dotenv').config({ path: __dirname + '/../../.env' });
const knex = require("knex");

const isDev = process.env.DEV === "true";

const db = knex({
  client: "pg",
  connection: isDev
    ? {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "family_admin",
      password: process.env.DB_PASSWORD || "raayan",
      database: process.env.DB_NAME || "family_tree_db",
    }
    : process.env.DATABASE_URL,
});

console.log("connection:", db.client.config.connection,
  isDev ? "Development Mode" : "Production Mode");
module.exports = db;