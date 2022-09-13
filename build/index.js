"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const pg = __importStar(require("pg"));
// create Express app
const app = (0, express_1.default)();
// access env variables
(0, dotenv_1.config)();
let TOKEN = process.env.TELEGRAM_API_TOKEN || 'undefined';
// postgres
const pool = new pg.Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});
// create bot
const bot = new node_telegram_bot_api_1.default(TOKEN, { polling: true });
if (bot) {
    console.log('Bot is running');
}
const options = {
    //@ts-ignore
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Погода в Канаде', callback_data: 'weather' }],
            [{ text: 'Хочу почитать!', callback_data: 'wantToRead' }],
            [{ text: 'Сделать рассылку', callback_data: 'mailing' }]
        ]
    })
};
bot.onText(/\/start/gm, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    bot.sendMessage(msg.chat.id, 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', options);
    console.log(msg.chat.id);
    pool.connect((err, client, done) => {
        if (err) {
            return console.log('Connection error', err);
        }
        client.query(`INSERT INTO "users" ("username", "chat_id")
                                VALUES ($1, $2)`, [msg.chat.username, msg.chat.id], (e) => {
            done();
            if (e) {
                return console.log('Error running query', e);
            }
        });
    });
    bot.on('callback_query', (callback_query) => __awaiter(void 0, void 0, void 0, function* () {
        const action = callback_query.data;
        console.log(callback_query.data, callback_query.id);
        if (action === 'weather') {
            const currentTime = new Date().toISOString().slice(0, -10).concat('00');
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';
            let weatherData = yield (0, axios_1.default)({
                method: 'GET',
                url: url,
            }).then(response => response.data);
            const { time, temperature_2m } = weatherData.hourly;
            const weatherIndex = time.findIndex(el => el === currentTime);
            console.log(currentTime, temperature_2m[weatherIndex]);
            yield bot.answerCallbackQuery(callback_query.id)
                .then(() => bot.sendMessage(msg.chat.id, `Сейчас в Оттаве (Канада) ${temperature_2m[weatherIndex]}°C`));
        }
    }));
}));
bot.onText(/\/wannaread/gm, (msg) => {
    const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
    const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
    const file = fs.createReadStream('files/python-book.zip');
    bot.sendPhoto(msg.chat.id, photo, {
        caption,
    }).catch(e => console.log(e));
    bot.sendDocument(msg.chat.id, file).catch(e => console.log(e));
    console.log('File has been sent');
});
// bot.onText(/\/weather/gm, async (msg: Message) => {
//
// });
bot.on;
bot.on('polling_error', console.log);
app.listen(process.env.PORT, () => console.log(`Server is listening on ${process.env.PORT}`));
