const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'meals.json');

// Initialize database file
const connectDB = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
  console.log("Local JSON Database connected");
};

const getMeals = () => {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const saveMeals = (meals) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(meals, null, 2));
};

const logMeal = (userId, description) => {
  const meals = getMeals();
  const meal = {
    _id: crypto.randomUUID().slice(0, 8), // short local ID
    userId,
    description,
    timestamp: new Date().toISOString()
  };
  meals.push(meal);
  saveMeals(meals);
  return meal;
};

const deleteMeal = (userId, mealId) => {
  const meals = getMeals();
  const index = meals.findIndex(m => m._id === mealId && m.userId.toString() === userId.toString());
  if (index !== -1) {
    meals.splice(index, 1);
    saveMeals(meals);
    return true;
  }
  return false;
};

const editMeal = (userId, mealId, newDescription) => {
  const meals = getMeals();
  const meal = meals.find(m => m._id === mealId && m.userId.toString() === userId.toString());
  if (meal) {
    meal.description = newDescription;
    saveMeals(meals);
    return true;
  }
  return false;
};

module.exports = { connectDB, getMeals, logMeal, deleteMeal, editMeal };
