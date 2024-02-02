const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const app = express();
//const port = 3001;

app.use(cors());
app.use(express.json());


const connection = mysql.createConnection({
  host: process.env.DB_HOST || '172.19.0.2',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
  database: process.env.DB_NAME || 'ozedb',
  port: process.env.DB_PORT || '3306',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});

//Products
// Get route all product
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

// Get a single product 
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM Product WHERE ProductId = ?';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        // Product found
        res.status(200).json(results[0]);
      } else {
        // Product not found
        res.status(404).json({ error: 'Product not found' });
      }
    }
  });
});

// Count
app.get('/api/productCount', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM Product';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results);  // Log the results to see what's returned

      const count = results[0]?.count || 0;

      // Check if count is undefined or null
      if (count === null || count === undefined) {
        res.status(404).json({ error: 'Count not found' });
      } else {
        res.status(200).json({ count });
      }
    }
  });
});

// Create
app.post('/api/products', (req, res) => {
  // Extract product data from the request body
  const { ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath } = req.body;

  // Perform SQL INSERT query to add a new product
  const query = `INSERT INTO Product (ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath) 
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
                 SET ProductName=?, Description=?, Price=?, StockQuantity=?, Color=?, IsTrend=?, IsNew=?, CategoryId=?, ImagePath=?
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


//User
// Signup
app.post('/api/signup', (req, res) => {
  const { Username, Password, Email, Name, Address, Phone } = req.body;

  const query = 'INSERT INTO SYS_User (Username, Password, Email, Name, Address, Phone) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [Username, Password, Email, Name, Address, Phone];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'User created successfully' });
    }
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { Username, Password } = req.body;

  // Step 1: Check if the username exists in the database
  const checkUsernameQuery = 'SELECT * FROM SYS_User WHERE Username=?';
  const checkUsernameValues = [Username];

  connection.query(checkUsernameQuery, checkUsernameValues, (err, usernameResults) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (usernameResults.length > 0) {
        // Step 2: Check if the password is correct
        const user = usernameResults[0];
        const checkPasswordQuery = 'SELECT * FROM SYS_User WHERE UserId=? AND Password=?';
        const checkPasswordValues = [user.UserId, Password];

        connection.query(checkPasswordQuery, checkPasswordValues, (passwordErr, passwordResults) => {
          if (passwordErr) {
            console.error('Error executing MySQL query: ', passwordErr);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            if (passwordResults.length > 0) {
              // User authenticated, generate and return a token
              const token = jwt.sign({ userId: user.UserId, username: user.Username }, 'your_secret_key', { expiresIn: '2h' });
              res.status(200).json({ token });
            } else {
              // Password is incorrect
              res.status(401).json({ error: 'Invalid password' });
            }
          }
        });
      } else {
        // Username does not exist
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  });
});

// Update user by UserId
app.put('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const { Username, Password, Email, Name, Address, Phone } = req.body;

  const query = 'UPDATE SYS_User SET Username=?, Password=?, Email=?, Name=?, Address=?, Phone=? WHERE UserId=?';
  const values = [Username, Password, Email, Name, Address, Phone, userId];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.affectedRows > 0) {
        res.status(200).json({ message: 'User updated successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });
});


// Forgot Password
app.post('/api/forgot-password', (req, res) => {
  const { Email } = req.body;

  // Generate a reset token
  const resetToken = generateResetToken();

  // Store the reset token in the database
  const updateQuery = 'UPDATE SYS_User SET ResetToken = ? WHERE Email = ?';
  connection.query(updateQuery, [resetToken, Email], (updateErr, updateResults) => {
    if (updateErr) {
      console.error('Error updating reset token: ', updateErr);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Update Query:', updateQuery);
      console.log('Update Parameters:', [resetToken, Email]);
      console.log('Update Results:', updateResults)
      // Placeholder response
      res.status(200).json({ message: 'Password reset initiated', resetToken });
    }
  });
});

// Reset Password
app.post('/api/forgot-password/:userId', (req, res) => {
  const { userId } = req.params;
  const { newPassword, resetToken } = req.body;

  // Check if the reset token matches the one stored in the database
  const checkTokenQuery = 'SELECT * FROM SYS_User WHERE UserId = ? AND ResetToken = ?';
  connection.query(checkTokenQuery, [userId, resetToken], (tokenErr, tokenResults) => {
    if (tokenErr) {
      console.error('Error checking reset token: ', tokenErr);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (tokenResults.length === 0) {
      res.status(401).json({ error: 'Invalid reset token' });
    } else {
      // Reset the user's password
      const updatePasswordQuery = 'UPDATE SYS_User SET Password = ? WHERE UserId = ?';
      connection.query(updatePasswordQuery, [newPassword, userId], (updateErr, updateResults) => {
        if (updateErr) {
          console.error('Error updating password: ', updateErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          // Clear the reset token from the database after successful password reset
          const clearTokenQuery = 'UPDATE SYS_User SET ResetToken = NULL WHERE UserId = ?';
          connection.query(clearTokenQuery, [userId], (clearTokenErr, clearTokenResults) => {
            if (clearTokenErr) {
              console.error('Error clearing reset token: ', clearTokenErr);
            }
            // Placeholder response
            res.status(200).json({ message: 'Password reset successfully' });
          });
        }
      });
    }
  });
});

// Helper function to generate a random reset token
function generateResetToken() {
  // Implement your logic to generate a secure random token (e.g., using 'crypto' library)
  // For simplicity, using a basic example here
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
