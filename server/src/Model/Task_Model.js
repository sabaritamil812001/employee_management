const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    task_id: {
      type: String,
    },
    task_title: {
      type: String,
      required: true,
    },
    task_description: {
      type: String,
      required: true,
    },
    emp_id: {
      type: String,
    },
    task_status: {
      type: String,
    },
    due_date: {
      type: Date,
    },
  },
  {
    collection: "Tasks",
  }
);

const Task = mongoose.model("Tasks", taskSchema);
module.exports = Task;
