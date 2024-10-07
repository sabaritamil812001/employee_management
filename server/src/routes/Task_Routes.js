const express = require("express");

const router = express.Router();

const taskController = require("../Controller/TaskController");

router.get("/showAllById/:task_id", taskController.getTaskDetailByTaskId);

router.get("/showTasksByTaskId/:emp_id", taskController.getTasksByTaskId);

router.post("/submitForm", taskController.postTask);

router.put("/updateTask/:task_id", taskController.updateTaskById);

router.delete('/deleteTask/:task_id' , taskController.deleteTaskById)//dd

module.exports = router;
