require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { connectDB, getMeals, logMeal, deleteMeal, editMeal } = require('./db');
const { startOfDay, endOfDay } = require('date-fns');
const { io } = require('./server'); // Start server and get io instance

const token = process.env.BOT_TOKEN;
if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error("BOT_TOKEN is missing or invalid in the environment file (.env). Please add a real token.");
  process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

console.log("HealthBot is starting with Local JSON Storage and API Server...");

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = `
Welcome to HealthBot! 🍏

I can help you track your meals.

Commands:
/log [meal description] - Log a meal
/today - View all meals logged today
/edit [id] [new description] - Edit a logged meal
/delete [id] - Delete a logged meal
  `;
  bot.sendMessage(chatId, helpText);
});

// /log
bot.onText(/\/log (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const description = match[1];

  try {
    const meal = logMeal(userId, description);
    // Real-time sync to Mobile App
    io.emit('mealUpdated', { action: 'added', meal });
    bot.sendMessage(chatId, `✅ Meal logged! (ID: \`${meal._id}\`)`, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Failed to log meal. Please try again.");
  }
});

// /today
bot.onText(/\/today/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const allMeals = getMeals();
    const meals = allMeals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return meal.userId.toString() === userId.toString() && mealDate >= start && mealDate <= end;
    });

    if (meals.length === 0) {
      return bot.sendMessage(chatId, "No meals logged today yet. Use /log to add one!");
    }

    let responseText = "🍽️ *Today's Meals:*\n\n";
    meals.forEach((meal, index) => {
      const time = new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      responseText += `${index + 1}. [${time}] ${meal.description}\n   ID: \`${meal._id}\`\n\n`;
    });

    bot.sendMessage(chatId, responseText, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Failed to fetch today's meals.");
  }
});

// /edit [id] [new desc]
bot.onText(/\/edit ([^\s]+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const mealId = match[1];
  const newDescription = match[2];

  try {
    const success = editMeal(userId, mealId, newDescription);
    if (!success) {
      return bot.sendMessage(chatId, "❌ Meal not found or you don't have permission to edit it.");
    }
    
    // Real-time sync to Mobile App
    const meal = getMeals().find(m => m._id === mealId);
    io.emit('mealUpdated', { action: 'edited', meal });
    
    bot.sendMessage(chatId, `✅ Meal updated successfully!`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Failed to edit meal.");
  }
});

// /delete [id]
bot.onText(/\/delete ([^\s]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const mealId = match[1];

  try {
    const success = deleteMeal(userId, mealId);
    if (!success) {
      return bot.sendMessage(chatId, "❌ Meal not found or you don't have permission to delete it.");
    }
    
    // Real-time sync to Mobile App
    io.emit('mealUpdated', { action: 'deleted', mealId });
    
    bot.sendMessage(chatId, `✅ Meal deleted successfully!`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Failed to delete meal.");
  }
});

// Handle missing arguments
bot.onText(/\/edit$/, (msg) => {
    bot.sendMessage(msg.chat.id, "Usage: /edit [id] [new description]\nYou can get the ID from the /today command.");
});

bot.onText(/\/delete$/, (msg) => {
    bot.sendMessage(msg.chat.id, "Usage: /delete [id]\nYou can get the ID from the /today command.");
});

bot.on("polling_error", console.log);

