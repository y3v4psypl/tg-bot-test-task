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
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const pg = __importStar(require("pg"));
const weather_api_1 = require("./weather-api");
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
let message;
bot.onText(/\/start/gm, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    message = msg;
    yield bot.sendMessage(Number((_a = msg.from) === null || _a === void 0 ? void 0 : _a.id), 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', {
        "reply_markup": {
            "inline_keyboard": [
                [
                    {
                        text: 'Погода в Канаде',
                        callback_data: StartActionType.GetWeather,
                    },
                ],
                [
                    {
                        text: 'Хочу почитать!',
                        callback_data: StartActionType.PythonHandbook,
                    }
                ],
                [
                    {
                        text: 'Сделать рассылку',
                        callback_data: StartActionType.Broadcasting,
                    }
                ]
            ],
        }
    });
    const client = yield pool.connect();
    try {
        yield client.query(`INSERT INTO "users" ("username", "chat_id")
                                VALUES ($1, $2)`, [msg.chat.username, msg.chat.id]);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        client.release();
    }
}));
bot.on('callback_query', (callback_query) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e;
    const action = callback_query.data;
    console.log(callback_query.data, callback_query.id);
    switch (action) {
        case StartActionType.GetWeather:
            if (((_b = message.from) === null || _b === void 0 ? void 0 : _b.id) != null) {
                yield bot.answerCallbackQuery(callback_query.id);
                yield bot.sendMessage((_c = message.from) === null || _c === void 0 ? void 0 : _c.id, `Сейчас в Оттаве (Канада) ${yield (0, weather_api_1.getWeather)()}°C`);
            }
            break;
        case StartActionType.PythonHandbook:
            const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
            const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
            const file = fs.createReadStream('files/python-book.zip');
            if (((_d = message.from) === null || _d === void 0 ? void 0 : _d.id) != null) {
                yield bot.answerCallbackQuery(callback_query.id);
                yield bot.sendPhoto(message.from.id, photo, { caption });
                yield bot.sendDocument(message.from.id, file).catch(e => console.log(e));
                console.log('File has been sent');
            }
            break;
        case StartActionType.Broadcasting:
            yield bot.answerCallbackQuery(callback_query.id);
            yield bot.sendMessage(Number((_e = message.from) === null || _e === void 0 ? void 0 : _e.id), 'Вы выбрали рассылку всем пользователям. Вы уверены что хотите это сделать?', {
                "reply_markup": {
                    "inline_keyboard": [
                        [
                            { text: 'Уверен(а)', callback_data: BroadcastingActionType.Yes }
                        ],
                        [
                            { text: 'Нет', callback_data: BroadcastingActionType.No }
                        ]
                    ]
                }
            });
            bot.on('callback_query', (callback_query) => __awaiter(void 0, void 0, void 0, function* () {
                var _f, _g, _h;
                const action = callback_query.data;
                switch (action) {
                    case BroadcastingActionType.Yes:
                        yield bot.answerCallbackQuery(callback_query.id);
                        const messageBroadcat = yield bot.sendMessage(Number((_f = message.from) === null || _f === void 0 ? void 0 : _f.id), 'Введите сообщение, которое хотите отправить всем пользователям.', {
                            reply_markup: {
                                force_reply: true,
                            },
                        });
                        bot.onReplyToMessage(Number((_g = message.from) === null || _g === void 0 ? void 0 : _g.id), messageBroadcat.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
                            var _j;
                            const client = yield pool.connect();
                            try {
                                const res = yield client.query({ text: `SELECT "chat_id" FROM "users"`, rowMode: 'array' });
                                res.rows.forEach(chatID => {
                                    var _a, _b;
                                    if (message.text != null && chatID[0] != Number((_a = message.from) === null || _a === void 0 ? void 0 : _a.id)) {
                                        bot.sendMessage(chatID[0], `Сообщение от ${(_b = message.from) === null || _b === void 0 ? void 0 : _b.username} ${message.text}`);
                                    }
                                });
                                yield bot.sendMessage(Number((_j = message.from) === null || _j === void 0 ? void 0 : _j.id), '');
                            }
                            catch (e) {
                                console.log(e);
                            }
                            finally {
                                client.release();
                            }
                        }));
                        break;
                    case BroadcastingActionType.No:
                        yield bot.sendMessage(Number((_h = message.from) === null || _h === void 0 ? void 0 : _h.id), 'Вы отказались от рассылки');
                }
            }));
            break;
    }
}));
bot.on('polling_error', console.log);
app.listen(process.env.PORT, () => console.log(`Server is listening on ${process.env.PORT}`));
var StartActionType;
(function (StartActionType) {
    StartActionType["GetWeather"] = "1";
    StartActionType["PythonHandbook"] = "2";
    StartActionType["Broadcasting"] = "3";
})(StartActionType || (StartActionType = {}));
var BroadcastingActionType;
(function (BroadcastingActionType) {
    BroadcastingActionType["Yes"] = "4";
    BroadcastingActionType["No"] = "5";
})(BroadcastingActionType || (BroadcastingActionType = {}));
