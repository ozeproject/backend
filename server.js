const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
const port = 3001;

app.use(cors()); // Add this line to enable CORS

const connection = mysql.createConnection({
  host: '10.4.85.33',
  user: 'root',
  password: 'mysql', //mamp ใส้root sampt ไม่ใส่pw
  database: 'oze',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});

app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
