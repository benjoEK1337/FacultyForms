const express = require('express');
const connectDB = require('./config/db');
const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/register', require('./backend/routes/api/register'));
app.use('/api/auth', require('./backend/routes/api/auth'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
