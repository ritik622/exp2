const http = require('http');
const path = require('path');
const fs = require('fs');
const qs = require('querystring');
const { MongoClient } = require('mongodb');

const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017'; 
const DB_NAME = 'employeeDB';
const COLLECTION_NAME = 'employees';

// Create a new MongoClient instance
const client = new MongoClient(MONGO_URI);

function calculateAdjustedSalary(monthlySalary, dutyLeave) {
    const dailySalary = monthlySalary / 30; 
    const salaryDeduction = dutyLeave * dailySalary;
    return monthlySalary - salaryDeduction;
}

async function main() {
    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const server = http.createServer(async (req, res) => {
            if (req.method === 'GET' && req.url === '/') {
                fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                });
            } else if (req.method === 'POST' && req.url === '/submit') {
                let body = '';

                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const parsedData = qs.parse(body);
                    const { empId, empName, department, monthlySalary, dutyLeave, doj } = parsedData;
                    const monthlySalaryFloat = parseFloat(monthlySalary);
                    const dutyLeaveInt = parseInt(dutyLeave);
                    const adjustedMonthlySalary = calculateAdjustedSalary(monthlySalaryFloat, dutyLeaveInt);
                    const annualSalary = adjustedMonthlySalary * 12;

                    const employee = {
                        empId,
                        empName,
                        department,
                        monthlySalary: monthlySalaryFloat,
                        dutyLeave: dutyLeaveInt,
                        annualSalary,
                        doj
                    };

                    // Save to MongoDB
                    try {
                        await collection.insertOne(employee);
                    } catch (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }

                    // Save to file
                    fs.readFile('experiment_data.json', 'utf8', (err, data) => {
                        let employees = [];
                        if (!err) {
                            employees = JSON.parse(data);
                        }
                        employees.push(employee);
                        fs.writeFile('experiment_data.json', JSON.stringify(employees, null, 2), err => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Internal Server Error');
                            } else {
                                res.writeHead(302, { 'Location': '/employees' });
                                res.end();
                            }
                        });
                    });
                });
            } else if (req.method === 'POST' && req.url.startsWith('/delete')) {
                let body = '';

                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const parsedData = qs.parse(body);
                    const { empId } = parsedData;

                    try {
                        await collection.deleteOne({ empId });
                        res.writeHead(302, { 'Location': '/employees' });
                        res.end();
                    } catch (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    }
                });
            } else if (req.method === 'GET' && req.url === '/employees') {
                try {
                    const employees = await collection.find({}).toArray();
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Employee List</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    background-color: #f4f4f4;
                                    margin: 0;
                                    padding: 20px;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                }
                                h1 {
                                    color: #333;
                                }
                                table {
                                    width: 80%;
                                    border-collapse: collapse;
                                    margin-top: 20px;
                                }
                                th, td {
                                    padding: 12px;
                                    border: 1px solid #ddd;
                                    text-align: left;
                                }
                                th {
                                    background-color: #007bff;
                                    color: white;
                                }
                                tr:nth-child(even) {
                                    background-color: #f2f2f2;
                                }
                                a {
                                    display: inline-block;
                                    margin-top: 20px;
                                    text-decoration: none;
                                    color: #007bff;
                                }
                                a:hover {
                                    text-decoration: underline;
                                }
                                form {
                                    display: inline;
                                }
                                button {
                                    background-color: #ff4d4d;
                                    color: white;
                                    border: none;
                                    padding: 5px 10px;
                                    border-radius: 3px;
                                    cursor: pointer;
                                }
                                button:hover {
                                    background-color: #e60000;
                                }
                                .update-button {
                                    background-color: #28a745;
                                    color: white;
                                    border: none;
                                    padding: 5px 10px;
                                    border-radius: 3px;
                                    cursor: pointer;
                                }
                                .update-button:hover {
                                    background-color: #218838;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>Employee List</h1>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Employee Name</th>
                                        <th>Department</th>
                                        <th>Monthly Salary</th>
                                        <th>Duty Leave</th>
                                        <th>Annual Salary</th>
                                        <th>Date of Joining</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `);
                    employees.forEach(employee => {
                        res.write(`
                            <tr>
                                <td>${employee.empId}</td>
                                <td>${employee.empName}</td>
                                <td>${employee.department}</td>
                                <td>${employee.monthlySalary}</td>
                                <td>${employee.dutyLeave}</td>
                                <td>${employee.annualSalary}</td>
                                <td>${employee.doj}</td>
                                <td>
                                    <form action="/delete" method="POST" style="display:inline;">
                                        <input type="hidden" name="empId" value="${employee.empId}">
                                        <button type="submit">Delete</button>
                                    </form>
                                    <form action="/update" method="GET" style="display:inline;">
                                        <input type="hidden" name="empId" value="${employee.empId}">
                                        <button type="submit" class="update-button">Update</button>
                                    </form>
                                </td>
                            </tr>
                        `);
                    });
                    res.write(`
                                </tbody>
                            </table>
                            <a href="/">Back to form</a>
                        </body>
                        </html>
                    `);
                    res.end();
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                }
            } else if (req.method === 'GET' && req.url.startsWith('/update')) {
                const urlParams = new URLSearchParams(req.url.split('?')[1]);
                const empId = urlParams.get('empId');
                
                try {
                    const employee = await collection.findOne({ empId });

                    if (!employee) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Employee Not Found');
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Update Employee</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    background-color: #f4f4f4;
                                    margin: 0;
                                    padding: 0;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                }
                                h1 {
                                    color: #333;
                                    margin-bottom: 20px;
                                }
                                form {
                                    background: #fff;
                                    padding: 20px;
                                    border-radius: 8px;
                                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                    width: 300px;
                                }
                                label {
                                    display: block;
                                    margin-bottom: 5px;
                                    color: #555;
                                }
                                input[type="text"],
                                input[type="number"],
                                input[type="date"] {
                                    width: 100%;
                                    padding: 8px;
                                    margin-bottom: 10px;
                                    border-radius: 4px;
                                    border: 1px solid #ccc;
                                }
                                button {
                                    width: 100%;
                                    padding: 10px;
                                    background-color: #007bff;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 16px;
                                }
                                button:hover {
                                    background-color: #0056b3;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>Update Employee</h1>
                            <form action="/submitUpdate" method="POST">
                                <input type="hidden" name="originalEmpId" value="${employee.empId}">
                                <label for="empId">Employee ID</label>
                                <input type="text" id="empId" name="empId" value="${employee.empId}" required>

                                <label for="empName">Employee Name</label>
                                <input type="text" id="empName" name="empName" value="${employee.empName}" required>

                                <label for="department">Department</label>
                                <input type="text" id="department" name="department" value="${employee.department}" required>

                                <label for="monthlySalary">Monthly Salary</label>
                                <input type="number" id="monthlySalary" name="monthlySalary" value="${employee.monthlySalary}" required>

                                <label for="dutyLeave">Duty Leave</label>
                                <input type="number" id="dutyLeave" name="dutyLeave" value="${employee.dutyLeave}" required>

                                <label for="doj">Date of Joining</label>
                                <input type="date" id="doj" name="doj" value="${employee.doj}" required>

                                <button type="submit">Update</button>
                            </form>
                            <a href="/employees">Back to Employee List</a>
                        </body>
                        </html>
                    `);
                    res.end();
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                }
            } else if (req.method === 'POST' && req.url === '/submitUpdate') {
                let body = '';

                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const parsedData = qs.parse(body);
                    const { originalEmpId, empId, empName, department, monthlySalary, dutyLeave, doj } = parsedData;
                    const monthlySalaryFloat = parseFloat(monthlySalary);
                    const dutyLeaveInt = parseInt(dutyLeave);
                    const adjustedMonthlySalary = calculateAdjustedSalary(monthlySalaryFloat, dutyLeaveInt);
                    const annualSalary = adjustedMonthlySalary * 12;

                    try {
                        await collection.updateOne(
                            { empId: originalEmpId },
                            {
                                $set: {
                                    empId,
                                    empName,
                                    department,
                                    monthlySalary: monthlySalaryFloat,
                                    dutyLeave: dutyLeaveInt,
                                    annualSalary,
                                    doj
                                }
                            }
                        );
                        res.writeHead(302, { 'Location': '/employees' });
                        res.end();
                    } catch (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error connecting to MongoDB', err);
        process.exit(1);
    }
}

main().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await client.close();
    process.exit(0);
});
