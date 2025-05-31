require('dotenv').config({ path: __dirname + '/.env' });
const isDev = process.env.DEV === "true";
console.log("Knex is using DATABASE_URL:", process.env.DATABASE_URL);

module.exports = {
  client: "pg",
  connection: isDev
    ? {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "family_admin",
      password: process.env.DB_PASSWORD || "raayan",
      database: process.env.DB_NAME || "family_tree_db",
    }
    : process.env.DATABASE_URL,
  migrations: {
    directory: "./database/migrations",
  },
  seeds: {
    directory: "./database/seeds",
  },
};

console.log("connection:", module.exports.connection, isDev ? "Development Mode" : "Production Mode");