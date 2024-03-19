const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('./jwtMiddleware'); // Import the JWT middleware
const stripe = require("stripe")("sk_test_51OuQpE09vF0kWl46y8sHkO7ZQcOFJ6wOCiDCtJMfrxJlR9Oai3ad5PsXckmAikpGmFJe1tIFqIl7jDmd4lstejyP002qFFcO7q");
const { v4: uuidv4 } = require("uuid");
const app = express();
// const port = 3001;

app.use(cors());
// app.use(express.json());


const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  // host: process.env.DB_HOST || '10.4.85.33',
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
app.get('/api/products', express.json(), async (req, res) => {
  // add filter
  const { sortBy } = req.query;

  let query = 'SELECT * FROM Product WHERE StockQuantity > 0';

  if (sortBy === 'price_low_high') {
    query += ' ORDER BY Price ASC';
  } else if (sortBy === 'price_high_low') {
    query += ' ORDER BY Price DESC';
  } else if (sortBy === 'a-z') {
    query += ' ORDER BY ProductName ASC';
  } else if (sortBy === 'z-a') {
    query += ' ORDER BY ProductName DESC';
  }

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
app.get('/api/products/:id', express.json(), (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM Product WHERE ProductId = ?';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        res.status(200).json(results[0]);
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    }
  });
});

// Get MALE collection with Quantity > 0
app.get('/api/pd/male', express.json(), (req, res) => {
  const query = 'SELECT * FROM Product WHERE gender = ? AND StockQuantity > 0';

  connection.query(query, ['Male'], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found for male gender with Quantity > 0' });
    }
    res.status(200).json(results);
  });
});

// Get FEMALE collection with Quantity > 0
app.get('/api/pd/female', express.json(), (req, res) => {
  const query = 'SELECT * FROM Product WHERE gender = ? AND StockQuantity > 0';

  connection.query(query, ['Female'], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found for female gender with Quantity > 0' });
    }
    res.status(200).json(results);
  });
});

// Get ACCESSORIES collection with Quantity > 0
app.get('/api/pd/accessories', express.json(), (req, res) => {
  const query = 'SELECT * FROM Product WHERE categoryId = ? AND StockQuantity > 0';

  connection.query(query, [2], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found for the Accessories category with Quantity > 0' });
    }
    res.status(200).json(results);
  });
});

// Count
app.get('/api/productCount', express.json(), (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM Product WHERE StockQuantity > 0';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results); 

      const count = results[0]?.count || 0;
      if (count === null || count === undefined) {
        res.status(404).json({ error: 'Count not found' });
      } else {
        res.status(200).json({ count });
      }
    }
  });
});

// Create
app.post('/api/products', express.json(), (req, res) => {
  const { ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath , gender , Size } = req.body;
  const query = 'INSERT INTO Product (ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath, gender, Size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath, gender , Size];

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
app.put('/api/products/:id', express.json(), (req, res) => {
  const productId = req.params.id;
  const { ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath , gender , Size } = req.body;
  const query = 'UPDATE Product SET ProductName=?, Description=?, Price=?, StockQuantity=?, Color=?, IsTrend=?, IsNew=?, CategoryId=?, ImagePath=?, gender=?, Size=? WHERE ProductId=?';
  const values = [ProductName, Description, Price, StockQuantity, Color, IsTrend, IsNew, CategoryId, ImagePath, gender , Size, productId];

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
app.delete('/api/products/:id', express.json(), (req, res) => {
  const productId = req.params.id;

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
app.post('/api/signup', express.json(),(req, res) => {
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
app.post('/api/login', express.json(), (req, res) => {
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
              const token = jwt.sign({      userId: user.UserId,
                username: user.Username,
                role: user.Role,
                Address: user.Address,
                Email: user.Email,
                phone: user.Phone, }, 'sj3', { expiresIn: '2h' });
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
app.put('/api/users/:userId', express.json(), (req, res) => {
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
app.post('/api/forgot-password', express.json(), (req, res) => {
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
      res.status(200).json({ message: 'Password reset initiated', resetToken });
    }
  });
});

// Check if email exists in the database
app.post('/api/resetpassword/checkemail', (req, res) => {
  const { email } = req.body;

  // Query to check if the email exists in the database
  const query = 'SELECT * FROM SYS_User WHERE Email = ?';
  connection.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error checking email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        // Email exists, proceed to the next step
        res.status(200).json({ message: 'Email found in the system' });
      } else {
        // Email doesn't exist, return an error response
        res.status(404).json({ error: "Email not found in the system" });
      }
    }
  });
});

// Reset password for the user
app.post('/api/resetpassword', (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  // Verify that newPassword matches confirmPassword
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  // Update the password in the database
  const updateQuery = 'UPDATE SYS_User SET Password = ? WHERE Email = ?';
  connection.query(updateQuery, [newPassword, email], (error, results) => {
    if (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Password updated successfully
      res.status(200).json({ message: 'Password reset successful' });
    }
  });
});
// Helper function to generate a random reset token
function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// UserProfile get data for Edit
app.get('/api/user/profile',  express.json(),jwtMiddleware, (req, res) => {
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
app.put('/api/user/profile',  express.json(),jwtMiddleware, (req, res) => {
  const userId = req.user.userId; 
  const { Name, Username, Email, Phone, Address } = req.body; 
  console.log(req.body)
  const updateUserQuery = 'UPDATE SYS_User SET Name = ?, Username = ?, Email = ?, Phone = ?, Address = ? WHERE UserId = ?';
  connection.query(updateUserQuery, [Name, Username, Email, Phone, Address, userId], (err, results) => {
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

//UserProfile History
app.get('/api/order/history', express.json(), jwtMiddleware, (req, res) => {
  const userId = req.query.userId; 
  const getOrderHistoryQuery = `
  SELECT Orders.OrderID, Orders.OrderDate, Orders.TotalAmount, 
          Product.ProductId, Product.ProductName, Product.Description, Product.Price, Product.Color, Product.ImagePath,
          OrderItems.Quantity , OrderItems.Size
      FROM Orders
      INNER JOIN PaymentMethods on PaymentMethods.PaymentMethodID = Orders.PaymentMethods_PaymentMethodID
      INNER JOIN OrderItems ON Orders.OrderID = OrderItems.Order_OrderID
      INNER JOIN Product ON OrderItems.Product_ProductId = Product.ProductId
      WHERE Orders.SYS_User_UserID = ?`;

  connection.query(getOrderHistoryQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found History' });
    }
    res.status(200).json(results);
  });
});

// Add Product to Wishlist 
app.post('/api/wishlist/add', express.json(), jwtMiddleware, (req, res) => {
  const userId = req.body.userId;
  const productId = req.body.productId; 
  const size = req.body.size;
  const quantity = req.body.quantity;

  // Check if the product already exists in the wishlist
  const checkQuery = 'SELECT * FROM Wishlist WHERE SYS_User_UserID = ? AND Product_productId = ? AND Size = ?';
  connection.query(checkQuery, [userId, productId, size], (checkErr, checkResults) => {
      if (checkErr) {
          console.error('Error checking product in wishlist:', checkErr);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          if (checkResults.length > 0) {
              // Product already exists, update the quantity
              const existingQuantity = checkResults[0].Quantity;
              const newQuantity = existingQuantity + quantity;

              const updateQuery = 'UPDATE Wishlist SET Quantity = ? WHERE SYS_User_UserID = ? AND Product_productId = ? AND Size = ?';
              connection.query(updateQuery, [newQuantity, userId, productId, size], (updateErr, updateResults) => {
                  if (updateErr) {
                      console.error('Error updating product quantity in wishlist:', updateErr);
                      res.status(500).json({ error: 'Internal Server Error' });
                  } else {
                      res.status(200).json({ message: 'Product quantity updated in wishlist successfully' });
                  }
              });
          } else {
              // Product does not exist, add it to the wishlist
              const insertQuery = 'INSERT INTO Wishlist (SYS_User_UserID, Product_productId, Size, Quantity) VALUES (?, ?, ?, ?)';
              connection.query(insertQuery, [userId, productId, size, quantity], (insertErr, insertResults) => {
                  if (insertErr) {
                      console.error('Error adding product to wishlist:', insertErr);
                      res.status(500).json({ error: 'Internal Server Error' });
                  } else {
                      res.status(200).json({ message: 'Product added to wishlist successfully' });
                  }
              });
          }
      }
  });
});


// Delete wishlist
app.delete('/api/wishlist/:id', express.json(), (req, res) => {
  const wishlistId = req.params.id;

  const query = 'DELETE FROM Wishlist WHERE wishlist_id=?';

  connection.query(query, [wishlistId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'Wishlist deleted successfully' });
    }
  });
});

// Retrieve Wishlist 
app.get('/api/wishlist', jwtMiddleware, express.json(), (req, res) => {
  const userId = req.query.userId; 
  const query = `
      SELECT w.wishlist_id,p.ProductId, p.ProductName, p.Description, p.Price, p.StockQuantity, p.Color, p.IsTrend, p.IsNew, p.CategoryId, p.ImagePath, p.gender , w.Size, w.Quantity
      FROM Wishlist w
      INNER JOIN Product p ON w.Product_productId = p.ProductId
      WHERE w.SYS_User_UserID = ?
  `;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found in the Wishlist' });
    }
    res.status(200).json(results);
  });
});

// Add Product to Cart Endpoint
app.post('/api/cart/add',  jwtMiddleware, express.json(), (req, res) => {
  const userId = req.body.userId;
  const productId = req.body.productId;
  const size = req.body.size;
  const quantity = req.body.quantity;

  // Check if the product already exists in the cart for the user
  const checkQuery = 'SELECT * FROM Cart WHERE SYS_User_UserID = ? AND Product_productId = ? AND Size = ?';
  connection.query(checkQuery, [userId, productId, size], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking cart for existing product:', checkErr);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (checkResults.length > 0) {
        // Product already exists in cart, update the quantity
        const existingCartId = checkResults[0].CartID;
        const updateQuery = 'UPDATE Cart SET Quantity = Quantity + ? WHERE CartID = ?';
        connection.query(updateQuery, [quantity, existingCartId], (updateErr, updateResults) => {
          if (updateErr) {
            console.error('Error updating quantity in cart:', updateErr);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.status(200).json({ message: 'Quantity updated in cart successfully' });
          }
        });
      } else {
        // Product does not exist in cart, add it
        const insertQuery = 'INSERT INTO Cart (SYS_User_UserID, Product_productId, Size, Quantity) VALUES (?, ?, ?, ?)';
        connection.query(insertQuery, [userId, productId, size, quantity], (insertErr, insertResults) => {
          if (insertErr) {
            console.error('Error adding product to cart:', insertErr);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.status(200).json({ message: 'Product added to cart successfully' });
          }
        });
      }
    }
  });
});

// Cart
app.get('/api/cart', jwtMiddleware, express.json(), (req, res) => {
  const userId = req.query.userId;
  const query = `
    SELECT 
      c.cart_id,
      c.SYS_User_UserID,
      c.Product_ProductId,
      p.ProductId,
      p.ProductName,
      p.Description,
      p.Price,
      p.StockQuantity,
      p.Color,
      p.IsTrend,
      p.IsNew,
      p.CategoryId,
      p.ImagePath,
      p.gender,
      c.Size, 
      c.Quantity
    FROM Cart c
    INNER JOIN Product p ON c.Product_ProductId = p.ProductId
    WHERE c.SYS_User_UserID = ?`;
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No products found Cart' });
    }
    res.status(200).json(results);
  });

});

// Update Cart Item
app.put('/api/cart/:cartItemId', jwtMiddleware, express.json(), (req, res) => {
  const cartItemId = req.params.cartItemId;
  const { size, quantity } = req.body;

  // Update the cart item in the database using cartItemId with the new quantity and size
  const updateQuery = 'UPDATE Cart SET Size = ?, Quantity = ? WHERE cart_id = ?';
  connection.query(updateQuery, [size, quantity, cartItemId], (updateErr, updateResults) => {
    if (updateErr) {
      console.error('Error updating cart item:', updateErr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json({ message: 'Cart item updated successfully' });
  });
});

// Delete cart
app.delete('/api/cart/:id', express.json(), (req, res) => {
  const cartId = req.params.id;

  const query = 'DELETE FROM Cart WHERE cart_id=?';

  connection.query(query, [cartId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'Cart deleted successfully' });
    }
  });
});

/// payment
app.post("/api/checkout", express.json(), async (req, res) => {
  const { userDetail, total_amount, total_quantity, product, isQuickBuy  } =
    req.body;
  ///isQuickBuy คือซื้อจากหน้าแรก ไม่ใช่กระเป๋า
  try {
    const orderShowId = uuidv4();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: { name: "เสื้อผ้า" },
            unit_amount: total_amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      /////ถ้าสำเร็จแล้วจะเด้งไป frontend หน้าไหน
      success_url: `http://cp23sj3.sit.kmutt.ac.th/payment/success/${orderShowId}`,
      cancel_url: `http://cp23sj3.sit.kmutt.ac.th/payment/fail/${orderShowId}`,
      // http://cp23sj3.sit.kmutt.ac.th/sj3
    });

    const shipmentId = await createShipment(userDetail);
    const paymentMethodId = await createPaymentMethod(session.url, isQuickBuy);
    const ordersId = await createOrder(
      session.id,
      paymentMethodId,
      shipmentId,
      userDetail,
      total_amount,
      orderShowId
    );

    await Promise.all(product.map((item) => addOrderItem(item, ordersId)));

    res.json({
      message: "Checkout success.",
      orders: {
        session_id: session.id,
        PaymentMethods_PaymentMethodID: paymentMethodId,
        SYS_User_UserID: userDetail.user_id,
        TotalAmount: total_amount,
        OrderDate: new Date(),
        address: userDetail.address,
      },
      url_link_payment: session.url,
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(400).json({ error: "Error payment" });
  }
});

function createShipment(userDetail) {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO Shipment (shipment_date, address, SYS_User_UserID) VALUES (?, ?, ?)";
    connection.query(
      query,
      [new Date(), userDetail.address, userDetail.user_id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
}

function createPaymentMethod(url, isQuickBuy) {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO PaymentMethods (status, payment_link , is_quick_buy) VALUES (?, ? , ?)";
    connection.query(query, ["open", url, isQuickBuy], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
}

function createOrder(
  sessionId,
  paymentMethodId,
  shipmentId,
  userDetail,
  totalAmount,
  orderShowId,
  size
) {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO Orders (session_id, PaymentMethods_PaymentMethodID, Shipment_shipment_id, SYS_User_UserID, TotalAmount, OrderDate ,orderShowId, Size) VALUES (? ,?, ?, ?, ?, ?, ?, ?)";
    connection.query(
      query,
      [
        sessionId,
        paymentMethodId,
        shipmentId,
        userDetail.user_id,
        totalAmount,
        new Date(),
        orderShowId,
        size
      ],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      }
    );
  });
}

function addOrderItem(item, ordersId) {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO OrderItems (price, Quantity, Order_OrderID, Product_ProductId, Size) VALUES (?, ?, ?, ?, ?)";
    connection.query(
      query,
      [item.price, item.Quantity, ordersId, item.product_id, item.size],
      (err, results) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        "whsec_3t9bNMUDgYWyDVemi9Ck2eODzeTMvlz5"  
     
      );

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed":   //เมื่อจ่ายเงินสำเร็จ
          await handleCheckoutSessionCompleted(event, res);
          // do something
          //
          //

          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (err) {
      console.error(err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.send();
  }
);

async function handleCheckoutSessionCompleted(event, res) {
  const paymentSuccessData = event.data.object;
  const sessionId = paymentSuccessData.id;

  try {
    const PaymentMethodId = await findPaymentMethodIdFromSessionId(sessionId);
    const isQuickBuy = await checkIsQuickBuy(PaymentMethodId);
    console.log("Is Quick Buy:", isQuickBuy);

    if (!isQuickBuy) {
      await handleRegularCheckout(sessionId, res);
    } else {
      await handleQuickCheckout(sessionId, res);
    }
  } catch (err) {
    console.error("Error updating PaymentMethods:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleRegularCheckout(sessionId, res) {
  try {
    const orderId = await findOrderIdFromSessionId(sessionId);
    const orderItems = await findOrderItemsByOrderId(orderId);

    for (const orderItem of orderItems) {
      const productId = orderItem.Product_ProductId;
      const quantity = orderItem.Quantity;
      await updateProductStockQuantity(productId, quantity);
      console.log(
        `ลบ StockQuantity ของ Product ID ${productId} จำนวน ${quantity} สำเร็จ`
      );
    }

    const userId = await findUserIdFromSessionId(sessionId);
    await deleteCartItemsByUserId(userId);
    console.log("ลบรายการในตะกร้าสำเร็จ");

    const PaymentMethod = await findPaymentMethod(sessionId);
    await updatePaymentStatus(PaymentMethod);
    console.log("อัพเดทเข้า database สำเร็จ");

    res.send();
  } catch (err) {
    console.error("Error handling regular checkout:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleQuickCheckout(sessionId, res) {
  try {
    const orderId = await findOrderIdFromSessionId(sessionId);
    const orderItems = await findOrderItemsByOrderId(orderId);

    for (const orderItem of orderItems) {
      const productId = orderItem.Product_ProductId;
      const quantity = orderItem.Quantity;
      await updateProductStockQuantity(productId, quantity);
      console.log(
        `ลบ StockQuantity ของ Product ID ${productId} จำนวน ${quantity} สำเร็จ`
      );
    }

    const PaymentMethod = await findPaymentMethod(sessionId);
    await updatePaymentStatus(PaymentMethod);
    console.log("อัพเดทเข้า database สำเร็จ");

    res.send();
  } catch (err) {
    console.error("Error handling quick checkout:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function findOrderItemsByOrderId(orderId) {
  return new Promise((resolve, reject) => {
    const findOrderItemsQuery =
      "SELECT Product_ProductId, Quantity FROM OrderItems WHERE Order_OrderID = ?;";
    connection.query(findOrderItemsQuery, [orderId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}
function updateProductStockQuantity(productId, quantity) {
  return new Promise((resolve, reject) => {
    const updateStockQuery =
      "UPDATE Product SET StockQuantity = StockQuantity - ? WHERE ProductId = ?;";
    connection.query(
      updateStockQuery,
      [quantity, productId],
      (err, results) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function findPaymentMethodIdFromSessionId(sessionId) {
  return new Promise((resolve, reject) => {
    const findPaymentMethodIdQuery =
      "SELECT PaymentMethods_PaymentMethodID FROM Orders WHERE session_id = ?;";
    connection.query(findPaymentMethodIdQuery, [sessionId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0].PaymentMethods_PaymentMethodID);
    });
  });
}

function checkIsQuickBuy(paymentMethodId) {
  return new Promise((resolve, reject) => {
    const findIsQuickBuyQuery =
      "SELECT is_quick_buy FROM PaymentMethods WHERE PaymentMethodID = ?;";
    connection.query(findIsQuickBuyQuery, [paymentMethodId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0].is_quick_buy);
    });
  });
}

function findUserIdFromSessionId(sessionId) {
  return new Promise((resolve, reject) => {
    const findUserIdQuery =
      "SELECT SYS_User_UserID FROM Orders WHERE session_id = ?;";
    connection.query(findUserIdQuery, [sessionId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0].SYS_User_UserID);
    });
  });
}
function deleteCartItemsByUserId(userId) {
  return new Promise((resolve, reject) => {
    const deleteCartItemsQuery = "DELETE FROM Cart WHERE SYS_User_UserID = ?;";
    connection.query(deleteCartItemsQuery, [userId], (err, results) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
function findPaymentMethod(sessionId) {
  return new Promise((resolve, reject) => {
    const findId =
      "SELECT PaymentMethods_PaymentMethodID FROM Orders WHERE session_id = ?;";
    connection.query(findId, [sessionId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0].PaymentMethods_PaymentMethodID);
    });
  });
}

function updatePaymentStatus(paymentMethodId) {
  console.log(paymentMethodId);
  return new Promise((resolve, reject) => {
    const updateStatus =
      "UPDATE PaymentMethods SET status = ? WHERE PaymentMethodID = ?";
    connection.query(
      updateStatus,
      ["success", paymentMethodId],
      (err, results) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function findOrderIdFromSessionId(sessionId) {
  return new Promise((resolve, reject) => {
    const findOrderIdQuery = "SELECT OrderID FROM Orders WHERE session_id = ?;";
    connection.query(findOrderIdQuery, [sessionId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0].OrderID);
    });
  });
}
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
