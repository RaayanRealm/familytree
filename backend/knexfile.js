module.exports = {
  client: "pg",
  connection: {
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