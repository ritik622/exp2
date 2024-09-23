Employee Management System
This is a simple Employee Management System built using Node.js, MongoDB, and an HTML front-end. The system allows you to add, update, and delete employees, and it calculates the adjusted salary based on the number of duty leaves an employee takes.

Features
Add new employees with their details such as ID, name, department, monthly salary, duty leave, and date of joining.
Automatically calculate the adjusted salary based on the duty leaves.
View the list of all employees in a table format.
Update existing employee records.
Delete employees from the database.
Stores employee data in MongoDB as well as in a local JSON file for persistence.
Technologies Used
Node.js: Backend server handling HTTP requests and responses.
MongoDB: Database for storing employee data.
HTML/CSS: Front-end for user interaction.
JavaScript: For handling business logic such as salary calculations.
Querystring: Parsing form data submitted by the user.
File System (fs): Storing data in a local JSON file.
Prerequisites
Before running this project, make sure you have the following installed on your system:

Node.js
MongoDB
You should also have MongoDB running locally on your machine.

Setup
Clone the repository:

bash
Copy code
git clone https://github.com/username/repo-name.git
cd repo-name
Install the dependencies:

bash
Copy code
npm install
Ensure MongoDB is running on your local machine. By default, it will connect to:

arduino
Copy code
mongodb://localhost:27017
Update the MongoDB URI and database configuration in the code if necessary.

Start the server:

bash
Copy code
node index.js
Open your browser and navigate to http://localhost:3000 to use the application.

Usage
Add Employee: Fill out the employee details on the form and submit to add the employee.
View Employees: Click on "View Employees" to see the list of all employees, including their adjusted monthly and annual salary.
Delete Employee: Click on the "Delete" button next to the employee to remove them from the system.
Update Employee: Click on the "Update" button to modify employee details.
Project Structure
bash
Copy code
.
├── index.js           # Main server file
├── index.html         # HTML file for the front-end
├── experiment_data.json  # Local JSON file for storing employee data
└── README.md          # Project documentation
Salary Calculation
Adjusted Salary: The system calculates the adjusted salary based on the number of duty leaves. It assumes that each month has 30 days.

Formula:

makefile
Copy code
adjustedMonthlySalary = monthlySalary - (monthlySalary / 30 * dutyLeave)
Annual Salary: The adjusted annual salary is then calculated by multiplying the adjusted monthly salary by 12.

MongoDB Operations
The employee data is stored in a MongoDB collection called employees in a database named employeeDB.
You can update, delete, or add employees, and the changes will reflect in both MongoDB and the experiment_data.json file.
Example Request
Here is a sample employee object that is inserted into the MongoDB collection:

json
Copy code
{
  "empId": "101",
  "empName": "John Doe",
  "department": "HR",
  "monthlySalary": 3000,
  "dutyLeave": 2,
  "annualSalary": 34800,
  "doj": "2023-05-10"
}