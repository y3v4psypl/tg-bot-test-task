import {config} from 'dotenv';
import TelegramBot, {Message} from 'node-telegram-bot-api';
import express from 'express';
import * as fs from 'fs';
import * as pg from 'pg';
import {getAllUserIds, getWeather, postNewUser} from './queries';

// create Express app
const app = express();

// access env variables
config();

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
const bot = new TelegramBot(TOKEN, { polling: true });
if (bot) { console.log('Bot is running') }

bot.onText(/\/start/gm, async (msg: Message) => {
    await bot.sendMessage(msg.chat.id, 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', {
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

    await postNewUser(pool, msg);

    }
);

bot.on('callback_query', async (callback_query) => {
    const action = callback_query.data;
    const chatId = callback_query.from.id;

    switch (action) {
        case StartActionType.GetWeather:
            await bot.answerCallbackQuery(callback_query.id);
            await bot.sendMessage(chatId, `Сейчас в Оттаве (Канада) ${await getWeather()}°C`);
        break;
        case StartActionType.PythonHandbook:
            const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
            const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
            const file = fs.createReadStream('files/python-book.zip');

            await bot.answerCallbackQuery(callback_query.id)
            await bot.sendPhoto(chatId, photo, {caption});
            await bot.sendDocument(chatId, file);
        break;
        case StartActionType.Broadcasting:
            await bot.answerCallbackQuery(callback_query.id)
            await bot.sendMessage(chatId, 'Вы выбрали рассылку всем пользователям. Вы уверены что хотите это сделать?', {
                "reply_markup": {
                    "inline_keyboard": [
                        [
                            {text: 'Уверен(а)', callback_data: BroadcastingActionType.Yes}
                        ],
                        [
                            {text: 'Нет', callback_data: BroadcastingActionType.No}
                        ]
                    ]
                }
            })
        break;
    }
});

bot.on('callback_query', async (callback_query) => {
    const action = callback_query.data;
    const chatId = callback_query.from.id;
    switch (action) {
        case BroadcastingActionType.Yes:
            await bot.answerCallbackQuery(callback_query.id)

            const messageBroadcat = await bot.sendMessage(chatId, 'Введите сообщение, которое хотите отправить всем пользователям.', {
                reply_markup: {
                    force_reply: true,
                },
            });
            bot.onReplyToMessage(chatId, messageBroadcat.message_id, async (message) => {
                const res = await getAllUserIds(pool);

                res.rows.forEach(id => {
                    if (message.text != null && id[0] != chatId) {
                        bot.sendMessage(chatID[0], message.from?.username == undefined
                            ? `Анонимное сообщение: ${message.text}`
                            : `Сообщение от ${message.from?.username}: ${message.text}`);
                    }
                });
                await bot.sendMessage(chatId, `Вы отправили сообщение: ${message.text}`)
            });
            break;
        case BroadcastingActionType.No:
            await bot.sendMessage(chatId, 'Вы отказались от рассылки')
    }
});

bot.on('polling_error', console.log);

app.listen(process.env.PORT, () => console.log(`Server is listening on ${process.env.PORT}`))

enum StartActionType {
    GetWeather = '1',
    PythonHandbook = '2',
    Broadcasting = '3',
}

enum BroadcastingActionType {
    Yes = '4',
    No = '5',
}
