# Health Tracking App & Bot 🍏

A comprehensive health tracking ecosystem comprising a React Native (Expo) mobile application and a Telegram Chatbot. This system allows users to seamlessly log meals, track their nutrition, and maintain a healthier lifestyle.

## Architecture Overview
The project is structured as a monorepo containing two distinct components:
- **Telegram Bot (`automation/healthbot`)**: A Node.js backend using `node-telegram-bot-api`. It provides users with a conversational interface directly within Telegram to log meals and track daily intake securely via a localized configuration.
- **Mobile App (`automation/app`)**: A cross-platform mobile application built with Expo and React Native. It uses `expo-router` for navigation, providing a rich user interface for comprehensive dietary tracking and visualization.

## Tools and Services Used
- **Node.js**: The runtime environment for the backend bot, chosen for its efficiency and rich ecosystem.
- **Expo & React Native**: Used for building the mobile application, allowing a single codebase to deploy smoothly on both iOS and Android.
- **Telegram Bot API**: Facilitates quick user interactions without the need for installing a separate app immediately.
- **Local JSON Storage**: Used for lightweight, easy-to-manage data persistence for the bot during local development.
- **Socket.io & Axios**: Integrated into the app to support real-time features and standardized API requests.

## Setup Instructions

### 1. Running the Telegram Bot
1. Navigate to the bot directory:
   ```bash
   cd automation/healthbot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Ensure you open the `.env` file and replace `YOUR_TELEGRAM_BOT_TOKEN` with your actual token)*
4. Start the bot:
   ```bash
   npm start
   ```

### 2. Running the Mobile App
1. Navigate to the app directory:
   ```bash
   cd automation/app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm start
   ```
4. Use the Expo Go app on your phone or pressing 'a' / 'i' to run on an Android/iOS emulator.

## Environment Variables Needed
You need to define the following in `automation/healthbot/.env`:
- `BOT_TOKEN`: Your custom Telegram Bot Token obtained from [@BotFather](https://t.me/botfather).

## Assumptions and Trade-offs
- **Local JSON over Full Database initially**: For the bot's current state, local JSON storage was prioritized for rapid prototyping and simplified local setup without requiring a dedicated database server like MongoDB.
- **Monorepo Structure**: Grouping both projects in the same repository assumes they will be tightly coupled and share a development lifecycle.

## Approximate Time Breakdown
* Mobile App Setup & UI (Expo/React Native) - ~40%
* Telegram Bot Logic (Commands, API) - ~30%
* Data Persistence / Local DB Integration - ~20%
* Documentation & Project Configuration - ~10%
