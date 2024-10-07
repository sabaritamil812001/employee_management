const taskModel = require("../Model/Task_Model");

const EmpContr = require("../Controller/Employee_controller");
const { response } = require("express");

const getTaskDetailByTaskId = async (request, response) => {
  const task_id = request.params.task_id;
  try {
    const result = await taskModel.findOne({ task_id: task_id });
    if (result) {
      response.status(200).json(result);
    } else {
      response.status(404).send("Task not Found");
    }
  } catch (error) {
    response.status(500).send("Internal Server Error");
  }
};

const getTasksByTaskId = async (req, res) => {
  const emp_id = req.params.emp_id;
  try {
    const result = await taskModel.find({ emp_id: emp_id }, { __v: 0, _id: 0 });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// Function to get the next task ID
const getNextTaskId = async () => {
  const lastTask = await taskModel.findOne().sort({ task_id: -1 }).exec();
  if (lastTask) {
    const lastId = lastTask.task_id; // Get the last task ID
    const numberPart = parseInt(lastId.slice(1), 10); // Extract numeric part
    const nextId = `T${(numberPart + 1).toString().padStart(3, "0")}`; // Increment and format
    return nextId;
  }
  return "T001"; // Return the starting ID if no tasks exist
};

// Function to handle posting a new task
const postTask = async (req, res) => {
  try {
    const taskId = await getNextTaskId(); // Get the next task ID
    const task = { ...req.body, task_id: taskId }; // Include the task ID in the task object

    const newTask = new taskModel(task);
    const savedTask = await newTask.save(); // Save the new task to the database
    EmpContr.addTaskIdToEmp(taskId, task.emp_id);

    res
      .status(201)
      .json({ message: "Task created successfully", task: savedTask });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to create task", details: error.message });
  }
};

const updateTaskById = async (req, res) => {
  const task_id = req.params.task_id;
  const updatedTask = req.body;
  try {
    const result = await taskModel.updateOne(
      { task_id: task_id },
      { $set: updatedTask } // Use the entire updated task object
    );
    if (result.modifiedCount === 0) {
      return res.status(404).send("Task not found or no changes made");
    }
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const deleteTaskById = async (req, res) => {
  const task_id = req.params.task_id;
  try {
    const result = await taskModel.deleteOne({ task_id });
    if (result.deletedCount === 0) {
      return res.status(404).send("Task not found");
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getTaskDetailByTaskId,
  getTasksByTaskId,
  postTask,
  updateTaskById,
  deleteTaskById,
};
