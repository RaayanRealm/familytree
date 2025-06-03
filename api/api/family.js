const express = require("express");
const familyRoutes = require("../src/routes/familyRoutes");

const app = express();
app.use(express.json());
app.use(familyRoutes);

module.exports = app;
