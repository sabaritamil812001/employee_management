const empModel = require("../Model/Employee_Model");

const getAllEmployee = async (request, response) => {
  try {
    const result = await empModel.aggregate([
      {
        // Match employees with non-empty task_ids
        $match: {
          task_ids: { $ne: [] }, // Ensure task_ids array is not empty
        },
      },
      {
        $lookup: {
          from: "Tasks",
          localField: "task_ids", // Field from Employee
          foreignField: "task_id", // Field from Tasks
          as: "tasks", // Output array
        },
      },
      {
        $unwind: {
          path: "$tasks", // Unwind the tasks array
          // Remove preserveNullAndEmptyArrays to exclude employees without tasks
        },
      },
      {
        $project: {
          _id: 0,
          employee_id: 1,
          name: 1,
          task_id: "$tasks.task_id",
          task_title: "$tasks.task_title",
        },
      },
    ]);
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getEmployeeDetailsById = async (request, response) => {
  const employee_Id = request.params.employee_id;
  try {
    const employee = await empModel.findOne(
      { employee_id: employee_Id },
      { __v: 0, _id: 0 }
    );
    if (employee) {
      response.status(200).json(employee);
    } else {
      response.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getPieChartData = async (request, response) => {
  try {
    const result = await empModel.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { _id: 0, department: "$_id", count: 1 } },
    ]);

    const departmentCounts = Object.fromEntries(
      result.map(({ department, count }) => [department, count])
    );

    response.json(departmentCounts);
  } catch (error) {
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getBarChartData = async (req, res) => {
  try {
    const result = await empModel.aggregate([
      {
        $group: {
          _id: { $month: "$date_of_joining" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          count: 1,
        },
      },
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formattedResults = monthNames.reduce((acc, month) => {
      acc[month] = 0; // Initialize all months to 0
      return acc;
    }, {});

    result.forEach((doc) => {
      formattedResults[monthNames[doc.month - 1]] = doc.count; // Use month name as key
    });

    res.json(formattedResults); // Send the formatted results
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchAllEmp = async (req, res) => {
  try {
    const result = await empModel.find(
      {},
      { name: 1, employee_id: 1, _id: 0, task_ids: 1 }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addTaskIdToEmp = async (task_id, emp_id) => {
  await empModel.updateOne(
    { employee_id: emp_id }, // Filter by the employee ID
    { $push: { task_ids: task_id } } // Add the new task_id to the array
  );
};

module.exports = {
  getAllEmployee,
  getEmployeeDetailsById,
  getPieChartData,
  getBarChartData,
  addTaskIdToEmp,
  fetchAllEmp,
};
