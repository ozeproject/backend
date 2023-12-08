const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());


const connection = mysql.createConnection({
  host: '10.4.85.33',
  user: 'root',
  password: 'mysql', 
  database: 'oze',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Get route
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM Product';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

// Create
app.post('/api/products', (req, res) => {
  // Extract product data from the request body
  const { ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath } = req.body;

  // Perform SQL INSERT query to add a new product
  const query = `INSERT INTO Product (ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, Category_category_id, ImagePath) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'Product created successfully' });
    }
  });
});

// Update
app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  // Extract updated product data from the request body
  const { ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath } = req.body;

  // Perform SQL UPDATE query to modify the details of a product
  const query = `UPDATE Product 
                 SET ProductName=?, Description=?, Price=?, StockQuantity=?, Color=?, IsTrend=?, IsNew=?, Category_category_id=?, ImagePath=?
                 WHERE ProductId=?`;
  const values = [ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath, productId];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'Product updated successfully' });
    }
  });
});

// Delete
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  // Perform SQL DELETE query to remove a product
  const query = 'DELETE FROM Product WHERE ProductId=?';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'Product deleted successfully' });
    }
  });
});

// Add this route to your server.js
app.get('/api/products/count', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM Product';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      const count = results[0]?.count || 0;
      res.status(200).json({ count });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
