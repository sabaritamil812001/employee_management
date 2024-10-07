const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const taskController = require("../Controller/TaskController.js");
const task_model = require("../Model/Task_Model.js");

// Create an instance of MongoMemoryServer
let mongoServer;

// Set up Express app
const app = express();
app.use(express.json());

// Set up routes for the controller
app.get("/task/showAllById/:task_id", taskController.getTaskDetailByTaskId);
app.get("/task/showTasksByTaskId/:emp_id", taskController.getTasksByTaskId);
app.post("/task/submitForm", taskController.postTask);
app.delete("/task/deleteTask/:task_id", taskController.deleteTaskById);
app.put("/task/updateTask/:task_id", taskController.updateTaskById);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Emp_Controller API Tests", () => {
  afterEach(async () => {
    await task_model.deleteMany({}); // Clear the collection after each test
  });

  describe("GET /task/showAllById/:task_id", () => {
    // GET  /task/showAllById/:task_id  Status Code : 200
    test("should return task details", async () => {
      const mockTask = {
        task_id: "T001",
        task_title: "Jump from 9th floor",
        task_description: "Fly like vadivelu",
        task_status: "In Progress",
      };
      await task_model.create(mockTask);

      const response = await request(app).get("/task/showAllById/T001");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining(mockTask));
    });

    test("should return 404 if task does not exist", async () => {
      const response = await request(app).get("/task/showAllById/T999");

      expect(response.status).toBe(404);
      expect(response.text).toEqual("Task not Found");
    });

    test("should return 500 on server error", async () => {
      jest.spyOn(task_model, "findOne").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/task/showAllById/T001");

      expect(response.status).toBe(500);
      expect(response.text).toEqual("Internal Server Error");
    });
  });

  describe("GET /task/showTasksByTaskId/:emp_id", () => {
    test("should return all employee tasks", async () => {
      const mockTask = {
        task_id: "T001",
        task_title: "Jump from 9th floor",
        task_description: "Fly like vadivelu",
        task_status: "In Progress",
        emp_id: "E002",
      };
      await task_model.create(mockTask);

      const response = await request(app).get("/task/showTasksByTaskId/E002");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([mockTask]));
    });

    test("should return 500 on server error", async () => {
      jest.spyOn(task_model, "find").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/task/showTasksByTaskId/E001");

      expect(response.status).toBe(500);
      expect(response.text).toEqual("Internal Server Error");
    });
  });

  describe("POST /submitForm", () => {
    test("should create a new task", async () => {
      const newTaskOne = {
        task_title: "Jump from 9th floor",
        task_description: "Fly like vadivelu",
        task_status: "In Progress",
        due_date: "2024-10-22T00:00:00.000Z",
        emp_id: "",
      };

      const response = await request(app).post("/task/submitForm").send(newTaskOne);

      expect(response.status).toBe(201);
      expect(response.body.message).toEqual("Task created successfully");

      const createdTaskId = response.body.task.task_id;
      const taskInDb = await task_model.findOne({ task_id: createdTaskId });

      expect(taskInDb).toBeTruthy();
      expect(taskInDb.task_title).toBe(newTaskOne.task_title);
      expect(taskInDb.task_description).toBe(newTaskOne.task_description);
      expect(taskInDb.task_status).toBe(newTaskOne.task_status);
      expect(taskInDb.due_date.toISOString()).toBe(newTaskOne.due_date);

      const newTaskTwo = {
        task_title: "Jump from 9th floor",
        task_description: "Fly like Shiva",
        task_status: "In Progress",
        due_date: "2024-10-22T00:00:00.000Z",
        emp_id: "",
      };
      const response2 = await request(app)
        .post("/task/submitForm")
        .send(newTaskTwo);

      expect(response2.status).toBe(201);
      expect(response2.body.message).toEqual("Task created successfully");

      const createdTaskId2 = response2.body.task.task_id;
      const taskInDb2 = await task_model.findOne({ task_id: createdTaskId2 });

      expect(taskInDb2).toBeTruthy();
      expect(taskInDb2.task_title).toBe("Jump from 9th floor");
      expect(taskInDb2.task_description).toBe(newTaskTwo.task_description);
      expect(taskInDb2.task_status).toBe(newTaskTwo.task_status);
      expect(taskInDb2.due_date.toISOString()).toBe(newTaskTwo.due_date);
    });

    test("should return 400 if task creation fails due to missing fields", async () => {
      const invalidTask = {
        task_description: "Description of the task",
        task_status: "In Progress",
        due_date: "2024-10-22T00:00:00.000Z",
        emp_id: "E001",
      };

      const response = await request(app)
        .post("/task/submitForm")
        .send(invalidTask);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ error: "Failed to create task" })
      );
    });
  });

  describe("DELETE /deleteTask/:task_id", () => {
    test("should delete a task", async () => {
      const taskToDelete = {
        task_id: "T001",
        task_title: "Jump from 9th floor",
        task_description: "Fly like vadivelu",
        task_status: "In Progress",
        due_date: "2024-10-22T00:00:00.000Z",
        emp_id: "E001",
      };

      await task_model.create(taskToDelete);

      const response = await request(app).delete(
        `/task/deleteTask/${taskToDelete.task_id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toEqual("Task deleted successfully");

      const deletedTask = await task_model.findOne({
        task_id: taskToDelete.task_id,
      });
      expect(deletedTask).toBeNull();
    });

    test("should return 404 if task does not exist", async () => {
      const response = await request(app).delete("/task/deleteTask/T999");

      expect(response.status).toBe(404);
      expect(response.text).toEqual("Task not found");
    });

    test("should return 500 on server error", async () => {
      jest.spyOn(task_model, "deleteOne").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app).delete("/task/deleteTask/T001");

      expect(response.status).toBe(500);
      expect(response.text).toEqual("Internal Server Error");
    });
  });

  describe("PUT /updateTask/:task_id", () => {
    test("should update a task", async () => {
      const taskToUpdate = {
        task_id: "T001",
        task_title: "Jump from 9th floor",
        task_description: "Fly like vadivelu",
        task_status: "In Progress",
        due_date: "2024-10-22T00:00:00.000Z",
        emp_id: "E001",
      };

      await task_model.create(taskToUpdate);

      const updatedTask = {
        task_title: "Jump from 10th floor",
        task_description: "Fly like a bird",
        task_status: "Completed",
        due_date: "2024-11-01T00:00:00.000Z",
      };

      const response = await request(app)
        .put(`/task/updateTask/${taskToUpdate.task_id}`)
        .send(updatedTask);

      expect(response.status).toBe(200);
      expect(response.body.message).toEqual("Task updated successfully");

      const updatedTaskInDb = await task_model.findOne({
        task_id: taskToUpdate.task_id,
      });
      expect(updatedTaskInDb).toBeTruthy();
      expect(updatedTaskInDb.task_title).toBe(updatedTask.task_title);
      expect(updatedTaskInDb.task_description).toBe(
        updatedTask.task_description
      );
      expect(updatedTaskInDb.task_status).toBe(updatedTask.task_status);
      expect(updatedTaskInDb.due_date.toISOString()).toBe(updatedTask.due_date);
    });

    test("should return 404 if task does not exist", async () => {
      const nonExistentTaskId = "T999";
      const updatedTask = {
        task_title: "Updated Title",
        task_description: "Updated Description",
        task_status: "Completed",
        due_date: "2024-11-01T00:00:00.000Z",
      };

      const response = await request(app)
        .put(`/task/updateTask/${nonExistentTaskId}`)
        .send(updatedTask);

      expect(response.status).toBe(404);
      expect(response.text).toEqual("Task not found or no changes made");
    });

    test("should return 500 on server error during update", async () => {
      jest.spyOn(task_model, "updateOne").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const updatedTask = {
        task_title: "Updated Title",
        task_description: "Updated Description",
        task_status: "Completed",
        due_date: "2024-11-01T00:00:00.000Z",
      };

      const response = await request(app)
        .put("/task/updateTask/T001")
        .send(updatedTask);

      expect(response.status).toBe(500);
      expect(response.text).toEqual("Internal Server Error");
    });
  });
});
