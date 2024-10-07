const mongoose = require("mongoose");

const empSchema = mongoose.Schema(
  {
    employee_id: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    date_of_joining: {
      type: Date,
    },
    department: {
      type: String,
    },
    task_ids: {
      type: [String],
    },
  },
  {
    collection: "Employee",
  }
);

const Emp = mongoose.model("Employee", empSchema);
module.exports = Emp;
