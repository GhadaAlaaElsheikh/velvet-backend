import axios from "axios";
import dotenv from "dotenv";
import path from "node:path";

// Load config/.env explicitly
dotenv.config({
  path: path.join(process.cwd(), "config/.env"),
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log("🔥 TELEGRAM FILE LOADED");
console.log("TOKEN EXISTS:", !!BOT_TOKEN);
console.log("CHAT ID:", CHAT_ID);

export async function sendTelegramMessage(message: string) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("❌ Telegram credentials are missing");
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
      },
    );

    console.log("✅ Telegram message sent successfully");
  } catch (error: any) {
    console.error(
      "❌ Telegram failed:",
      error.response?.data || error.message,
    );
  }
}