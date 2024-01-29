const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '10.4.85.33',
  user: 'root',
  password: 'mysql',
  database: 'ozedb',
  port: '3306',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});

module.exports = connection;
