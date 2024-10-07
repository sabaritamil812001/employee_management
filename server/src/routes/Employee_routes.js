const express = require("express");

const router = express.Router();

const empController = require("../Controller/Employee_controller");

router.get("/showAllEmp", empController.getAllEmployee);

router.get(
  "/getUserByUserId/:employee_id",
  empController.getEmployeeDetailsById
);

router.get("/showPieChart", empController.getPieChartData);

router.get("/showbarChart", empController.getBarChartData);

router.get('/getAllEmp' , empController.fetchAllEmp)


module.exports = router;
