"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const axios_1 = __importDefault(require("axios"));
// access env variables
(0, dotenv_1.config)();
let TOKEN = process.env.TELEGRAM_API_TOKEN || 'undefined';
// create bot
const bot = new node_telegram_bot_api_1.default(TOKEN, { polling: true });
if (bot) {
    console.log('Bot is created');
}
;
bot.setWebHook('https://atk-group-test-task.herokuapp.com/');
bot.onText(/\/wannaread/gm, (msg) => {
    const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
    const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
    // const file = '/files/karmaniy_spravochnik_po_piton.zip';
    bot.sendPhoto(msg.chat.id, photo, {
        caption,
    }).catch(e => console.log(e));
    // bot.sendDocument(msg.chat.id, file);
});
bot.onText(/\/weather/gm, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const currentTime = new Date().toISOString().slice(0, -10).concat('00');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';
    let weatherData = yield (0, axios_1.default)({
        method: 'GET',
        url: url,
    }).then(response => response.data);
    const { time, temperature_2m } = weatherData.hourly;
    const weatherIndex = time.findIndex(el => el === currentTime);
    console.log(currentTime, temperature_2m[weatherIndex]);
    bot.sendMessage(msg.chat.id, `Сейчас в Оттаве (Канада) ${temperature_2m[weatherIndex]}°C`);
}));
bot.on('polling_error', console.log);
