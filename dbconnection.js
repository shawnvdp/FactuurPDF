const mysql = require("mysql");

let connection = mysql.createConnection({
  host: "localhost",
  "user": "root",
  "password": "password",
  database: "invoices"
});

module.exports = connection;