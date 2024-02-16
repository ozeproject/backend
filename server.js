const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('./jwtMiddleware'); // Import the JWT middleware

const app = express();
//const port = 3001;

app.use(cors());
app.use(express.json());


const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
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

// Get products for MALE collection
app.get('/api/products/male', (req, res) => {
  const query = 'SELECT * FROM Product WHERE gender = ?';

  connection.query(query, ['male'], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

// Get products for FEMALE collection
app.get('/api/products/female', (req, res) => {
  const query = 'SELECT * FROM Product WHERE gender = ?';

  connection.query(query, ['female'], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
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


// User Signup
app.post('/api/signup', (req, res) => {
  const { Username, Password, Email, Name, Address, Phone } = req.body;

  const usernameQuery = 'SELECT * FROM SYS_User WHERE Username = ?';
  connection.query(usernameQuery, [Username], (usernameErr, usernameResults) => {
    if (usernameErr) {
      console.error('Error checking username:', usernameErr);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (usernameResults.length > 0) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const emailQuery = 'SELECT * FROM SYS_User WHERE Email = ?';
    connection.query(emailQuery, [Email], (emailErr, emailResults) => {
      if (emailErr) {
        console.error('Error checking email:', emailErr);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if (emailResults.length > 0) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(Email);

      if (!isValidEmail) {
        // Invalid email format
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      if (Password !== req.body.ConfirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
      }

      const insertQuery = 'INSERT INTO SYS_User (Username, Password, Email, Name, Address, Phone) VALUES (?, ?, ?, ?, ?, ?)';
      const insertValues = [Username, Password, Email, Name, Address, Phone];

      connection.query(insertQuery, insertValues, (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error executing MySQL query: ', insertErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.status(201).json({ message: 'User created successfully' });
        }
      });
    });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { Username, Password } = req.body;
  const checkUsernameQuery = 'SELECT * FROM SYS_User WHERE Username=?';
  const checkUsernameValues = [Username];

  connection.query(checkUsernameQuery, checkUsernameValues, (err, usernameResults) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (usernameResults.length > 0) {
        const user = usernameResults[0];
        const checkPasswordQuery = 'SELECT * FROM SYS_User WHERE UserId=? AND Password=?';
        const checkPasswordValues = [user.UserId, Password];

        connection.query(checkPasswordQuery, checkPasswordValues, (passwordErr, passwordResults) => {
          if (passwordErr) {
            console.error('Error executing MySQL query: ', passwordErr);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            if (passwordResults.length > 0) {
              const token = jwt.sign({ userId: user.UserId, username: user.Username }, 'your_secret_key', { expiresIn: '2h' });
              res.status(200).json({ token });
            } else {
              res.status(401).json({ error: 'Invalid password' });
            }
          }
        });
      } else {
        res.status(401).json({ error: 'User not found' });
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

  const resetToken = generateResetToken();

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
  const checkTokenQuery = 'SELECT * FROM SYS_User WHERE UserId = ? AND ResetToken = ?';
  connection.query(checkTokenQuery, [userId, resetToken], (tokenErr, tokenResults) => {
    if (tokenErr) {
      console.error('Error checking reset token: ', tokenErr);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (tokenResults.length === 0) {
      res.status(401).json({ error: 'Invalid reset token' });
    } else {
      const updatePasswordQuery = 'UPDATE SYS_User SET Password = ? WHERE UserId = ?';
      connection.query(updatePasswordQuery, [newPassword, userId], (updateErr, updateResults) => {
        if (updateErr) {
          console.error('Error updating password: ', updateErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const clearTokenQuery = 'UPDATE SYS_User SET ResetToken = NULL WHERE UserId = ?';
          connection.query(clearTokenQuery, [userId], (clearTokenErr, clearTokenResults) => {
            if (clearTokenErr) {
              console.error('Error clearing reset token: ', clearTokenErr);
            }
            res.status(200).json({ message: 'Password reset successfully' });
          });
        }
      });
    }
  });
});

// Helper function to generate a random reset token
function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// UserProfile get data for Edit
app.get('/api/user/profile', jwtMiddleware, (req, res) => {
  const userId = req.user.userId; 
  const getUserQuery = 'SELECT * FROM SYS_User WHERE UserId = ?';
  connection.query(getUserQuery, [userId], (err, results) => {
      if (err) {
          console.error('Error fetching user profile:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      const userProfile = results[0];
      res.status(200).json(userProfile);
  });
});

// UserProfile edit 
app.put('/api/user/profile', jwtMiddleware, (req, res) => {
  const userId = req.user.userId; 
  const { name, username, email, phone, address } = req.body; 
  const updateUserQuery = 'UPDATE SYS_User SET Name = ?, Username = ?, Email = ?, Phone = ?, Address = ? WHERE UserId = ?';
  connection.query(updateUserQuery, [name, username, email, phone, address, userId], (err, results) => {
      if (err) {
          console.error('Error updating user profile:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'User profile updated successfully' });
  });
});

app.get('/api/order/history', jwtMiddleware, (req, res) => {
  const userId = req.user.userId; // Extract user ID from the JWT payload

  // SQL query to fetch order history data for the logged-in user
  const getOrderHistoryQuery = `
      SELECT Orders.OrderID, Orders.OrderDate, Orders.TotalAmount, 
             Products.ProductId, Products.ProductName, Products.Description, Products.Price
      FROM Orders
      INNER JOIN OrderItems ON Orders.OrderID = OrderItems.Order_OrderID
      INNER JOIN Products ON OrderItems.Product_ProductId = Products.ProductId
      WHERE Orders.SYS_User_UserID = ?`;

  // Execute the SQL query
  connection.query(getOrderHistoryQuery, [userId], (error, results) => {
      if (error) {
          console.error('Error fetching order history:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      // Send the fetched order history data as a response
      res.status(200).json(results);
  });
});

//Wishlist
app.get('/api/wishlist', jwtMiddleware, (req, res) => {
  const userId = req.user.id; 
  const query = 'SELECT * FROM Wishlist WHERE SYS_User_UserID = ?';
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

//Cart
app.get('/api/cart', jwtMiddleware, (req, res) => {
  const userId = req.user.id; 
  const query = 'SELECT * FROM Cart WHERE SYS_User_UserID = ?';
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
