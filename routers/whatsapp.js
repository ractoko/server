const express = require("express");
const WhatsAppController = require("../controllers/whatsapp");

const api = express.Router();

api.get("/session", WhatsAppController.withSession);
api.get("/with-out-session",WhatsAppController.withOutSession);
api.get("/whats", WhatsAppController.qrLogin);
api.post("/send", WhatsAppController.sendApi);
api.get("/getChats", WhatsAppController.getChatsApi);
api.post("/getChatId", WhatsAppController.getChatByIdApi);

module.exports = api;
