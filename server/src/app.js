const express = require("express");

const app = express();

app.use(express.json());

const cors = require("cors");

app.use(cors());

const empRoutes = require("./routes/Employee_routes");
const taskRoutes = require("./routes/Task_Routes");

app.use("/user", empRoutes);
app.use("/task", taskRoutes);

module.exports = app;
