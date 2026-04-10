const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB, getMeals, logMeal, deleteMeal, editMeal } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

app.use(cors());
app.use(bodyParser.json());

// Initialize DB
connectDB();

// API Endpoints
app.get('/meals', (req, res) => {
  const userId = req.query.userId || 'common'; // Simple userId handling
  const meals = getMeals().filter(m => m.userId.toString() === userId.toString());
  res.json(meals);
});

app.post('/meals', (req, res) => {
  const { userId, description } = req.body;
  const meal = logMeal(userId, description);
  io.emit('mealUpdated', { action: 'added', meal });
  res.json(meal);
});

app.put('/meals/:id', (req, res) => {
  const { id } = req.params;
  const { userId, description } = req.body;
  const success = editMeal(userId, id, description);
  if (success) {
    const meal = getMeals().find(m => m._id === id);
    io.emit('mealUpdated', { action: 'edited', meal });
    res.json({ success: true, meal });
  } else {
    res.status(404).json({ success: false });
  }
});

app.delete('/meals/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const success = deleteMeal(userId, id);
  if (success) {
    io.emit('mealUpdated', { action: 'deleted', mealId: id });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };
