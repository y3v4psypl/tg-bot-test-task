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
const queries_1 = require("./queries");
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
bot.onText(/\/start/gm, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, queries_1.postNewUser)(pool, msg);
    yield bot.sendMessage(msg.chat.id, 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', {
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
}));
bot.on('callback_query', (callback_query) => __awaiter(void 0, void 0, void 0, function* () {
    const action = callback_query.data;
    console.log(callback_query.data, callback_query.id);
    const chatId = callback_query.from.id;
    switch (action) {
        case StartActionType.GetWeather:
            yield bot.answerCallbackQuery(callback_query.id);
            yield bot.sendMessage(chatId, `Сейчас в Оттаве (Канада) ${yield (0, queries_1.getWeather)()}°C`);
            break;
        case StartActionType.PythonHandbook:
            const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
            const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
            const file = fs.createReadStream('files/python-book.zip');
            yield bot.answerCallbackQuery(callback_query.id);
            yield bot.sendPhoto(chatId, photo, { caption });
            yield bot.sendDocument(chatId, file).catch(e => console.log(e));
            console.log('File has been sent');
            break;
        case StartActionType.Broadcasting:
            yield bot.answerCallbackQuery(callback_query.id);
            yield bot.sendMessage(chatId, 'Вы выбрали рассылку всем пользователям. Вы уверены что хотите это сделать?', {
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
            break;
    }
}));
bot.on('callback_query', (callback_query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = callback_query.data;
        const chatId = callback_query.from.id;
        switch (action) {
            case BroadcastingActionType.Yes:
                yield bot.answerCallbackQuery(callback_query.id);
                const messageBroadcat = yield bot.sendMessage(chatId, 'Введите сообщение, которое хотите отправить всем пользователям.', {
                    reply_markup: {
                        force_reply: true,
                    },
                });
                bot.onReplyToMessage(chatId, messageBroadcat.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
                    const res = yield (0, queries_1.getAllUserIds)(pool);
                    res.rows.forEach(id => {
                        var _a, _b, _c;
                        if (message.text != null && id[0] != Number((_a = message.from) === null || _a === void 0 ? void 0 : _a.id)) {
                            bot.sendMessage(id[0], ((_b = message.from) === null || _b === void 0 ? void 0 : _b.username) == undefined
                                ? `Анонимное сообщение: ${message.text}`
                                : `Сообщение от ${(_c = message.from) === null || _c === void 0 ? void 0 : _c.username} ${message.text}`);
                        }
                    });
                    yield bot.sendMessage(chatId, `Вы отправили сообщение: ${message.text}`);
                }));
                break;
            case BroadcastingActionType.No:
                yield bot.sendMessage(chatId, 'Вы отказались от рассылки');
        }
    }
    catch (err) {
        console.log(err);
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
