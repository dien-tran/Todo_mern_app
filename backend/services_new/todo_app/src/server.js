const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/task.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => res.json({ status: 'Todo Service running', ts: new Date() }));

mongoose.connect(process.env.MONGODB_URI, { dbName: 'todo' })
  .then(() => console.log('Todo Service: MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Todo Service listening on ${PORT}`));