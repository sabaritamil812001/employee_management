const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const empController = require("../Controller/Employee_controller.js");
const emp_model = require("../Model/Employee_Model.js");
const task_model = require("../Model/Task_Model.js");

// Create an instance of MongoMemoryServer
let mongoServer;

// Set up Express app
const app = express();
app.use(express.json());

// Set up routes for the controller
app.get("/user/showAllEmp", empController.getAllEmployee);
app.get(
  "/user/getUserByUserId/:employee_id",
  empController.getEmployeeDetailsById
);
app.get("/user/showPieChart", empController.getPieChartData);
app.get("/user/showbarChart", empController.getBarChartData);
app.get("/user/getAllEmp", empController.fetchAllEmp);

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
    await emp_model.deleteMany({}); // Clear the collection after each test
    await task_model.deleteMany({});
  });

  test("GET /user/showAllEmp should return all employees", async () => {
    const mockTasks = [
      {
        task_id: "T050",
        task_title: "jhugfvcdxcgvbhjnk",
        task_description: "nhgvfcttgvnhj",
        emp_id: "E003",
        task_status: "In Progress",
      },
    ];

    await task_model.insertMany(mockTasks);
    const mockEmployees = [
      {
        employee_id: "E003",
        name: "Charlie Brown",
        department: "Marketing",
        task_ids: ["T050"],
      },
    ];
    await emp_model.insertMany(mockEmployees);

    const response = await request(app).get("/user/showAllEmp");

    expect(response.status).toBe(200);

    expect(response.body[0].name).toBe("Charlie Brown");
  });

  //GET  /user/getUserByUserId/:employee_id //Status Code : 200
  test("GET /user/getUserByUserId/:employee_id should return employee details", async () => {
    const mockEmployee = { employee_id: "1", name: "John Doe", task_ids: [] };
    await emp_model.create(mockEmployee);

    const response = await request(app).get("/user/getUserByUserId/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockEmployee);
  });

  //GET  /user/getUserByUserId/:employee_id //Status Code : 404
  test("GET /getUserByUserId/:employee_id should return 404 for non-existent employee", async () => {
    const response = await request(app).get("/user/getUserByUserId/T999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Employee not found" });
  });

  //GET /user/showPieChart //Status Code :  200
  test("GET /user/showPieChart should return pie chart data", async () => {
    await emp_model.insertMany([
      { employee_id: "1", name: "Shiva", department: "HR" },
      { employee_id: "2", name: "duwara", department: "HR" },
      { employee_id: "3", name: "sabari", department: "IT" },
      { employee_id: "4", name: "gowri", department: "IT" },
      { employee_id: "5", name: "alvi", department: "IT" },
    ]);

    const response = await request(app).get("/user/showPieChart");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ HR: 2, IT: 3 }));
  });

  // GET /user/showbarChart //Status Code : 200
  test("GET /user/showbarChart should return bar chart data", async () => {
    const date = new Date();
    await emp_model.insertMany([
      {
        employee_id: "1",
        name: "Shiva",
        date_of_joining: new Date(date.setMonth(date.getMonth() - 1)),
      }, // last month
      {
        employee_id: "3",
        name: "sabari",
        date_of_joining: new Date(date.setMonth(date.getMonth() - 1)),
      }, // last month
      {
        employee_id: "2",
        name: "gowri",
        date_of_joining: new Date(date.setMonth(date.getMonth())),
      }, // this month
    ]);

    const response = await request(app).get("/user/showbarChart");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        April: 0,
        August: 2,
        December: 0,
        February: 0,
        January: 0,
        July: 0,
        June: 0,
        March: 0,
        May: 0,
        November: 0,
        October: 0,
        September: 1,
      })
    );
  });

  // GET /user/getAllEmp //Status Code : 200
  test("GET /user/getAllEmp should return all employees with specific fields", async () => {
    const mockEmployees = [
      { name: "John Doe", employee_id: "1", task_ids: [] },
    ];
    await emp_model.insertMany(mockEmployees);

    const response = await request(app).get("/user/getAllEmp");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockEmployees);
  });

  // GET /user/getAllEmp //Status Code : 500
  test("GET /user/showAllEmp should return 500 on database error", async () => {
    jest.spyOn(emp_model, "aggregate").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/user/showAllEmp");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });

  //GET  /user/getUserByUserId/:employee_id //Status Code : 500
  test("GET /getUserByUserId/:employee_id should return 500 on error", async () => {
    jest.spyOn(emp_model, "findOne").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/user/getUserByUserId/1");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });

  //GET /user/showPieChart //Status Code :  500
  test("GET /showPieChart should return 500 on error", async () => {
    jest.spyOn(emp_model, "aggregate").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/user/showPieChart");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });

  // GET /user/showbarChart //Status Code : 500
  test("GET /showbarChart should return 500 on error", async () => {
    jest.spyOn(emp_model, "aggregate").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/user/showbarChart");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });

  // GET /user/getAllEmp //Status Code : 500
  test("GET /getAllEmp should return 500 on error", async () => {
    jest.spyOn(emp_model, "find").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/user/getAllEmp");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });
});
