module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL || {
    host: "localhost",
    user: "family_admin",
    password: "raayan",
    database: "family_tree_db",
  },
  migrations: {
    directory: "./database/migrations",
  },
  seeds: {
    directory: "./database/seeds",
  },
};