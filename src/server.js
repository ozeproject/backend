const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productRoutes = require('./src/presentation_layer/routes/productRoutes');
const userRoutes = require('./src/presentation_layer/routes/userRoutes');
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Server start
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
