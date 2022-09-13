import {config} from 'dotenv';
import TelegramBot, {Message} from 'node-telegram-bot-api';
import express from 'express';
import * as fs from 'fs';
import * as pg from 'pg';
import {getWeather} from './weather-api';

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

let message: Message;

bot.onText(/\/start/gm, async (msg: Message) => {
    message = msg;
    await bot.sendMessage(Number(msg.from?.id), 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', {
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

    const client = await pool.connect();

        try {
            await client.query(`INSERT INTO "users" ("username", "chat_id")
                                VALUES ($1, $2)`, [msg.chat.username, msg.chat.id]);
        } catch (e) {
            console.log(e);
        } finally {
            client.release();
        }
    }
);

bot.on('callback_query', async (callback_query) => {
    const action = callback_query.data;
    console.log(callback_query.data, callback_query.id)

    switch (action) {
        case StartActionType.GetWeather:
            if (message.from?.id != null) {
                await bot.answerCallbackQuery(callback_query.id)
                await bot.sendMessage(message.from?.id, `Сейчас в Оттаве (Канада) ${await getWeather()}°C`);
            }
        break;
        case StartActionType.PythonHandbook:
            const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
            const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
            const file = fs.createReadStream('files/python-book.zip');

            if (message.from?.id != null) {
                await bot.answerCallbackQuery(callback_query.id)
                await bot.sendPhoto(message.from.id, photo, {caption});
                await bot.sendDocument(message.from.id, file).catch(e => console.log(e));
                console.log('File has been sent');
            }
        break;
        case StartActionType.Broadcasting:
            await bot.answerCallbackQuery(callback_query.id)
            await bot.sendMessage(Number(message.from?.id), 'Вы выбрали рассылку всем пользователям. Вы уверены что хотите это сделать?', {
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

            bot.on('callback_query', async (callback_query) => {
                const action = callback_query.data;
                switch (action) {
                    case BroadcastingActionType.Yes:
                        await bot.answerCallbackQuery(callback_query.id)

                        const messageBroadcat = await bot.sendMessage(Number(message.from?.id), 'Введите сообщение, которое хотите отправить всем пользователям.', {
                            reply_markup: {
                                force_reply: true,
                            },
                        });
                        bot.onReplyToMessage(Number(message.from?.id), messageBroadcat.message_id, async (message) => {
                            const client = await pool.connect();

                            try {
                                const res = await client.query({text: `SELECT "chat_id" FROM "users"`, rowMode: 'array'});

                                res.rows.forEach(chatID => {
                                    if (message.text != null && chatID[0] != Number(message.from?.id)) {
                                        bot.sendMessage(chatID[0], `Сообщение от ${message.from?.username} ${message.text}`);
                                    }
                                });
                                await bot.sendMessage(Number(message.from?.id), `Вы отправили сообщение: ${message.text}`)
                            } catch (e) {
                                console.log(e);
                            } finally {
                                client.release();
                            }
                        });
                    break;
                    case BroadcastingActionType.No:
                        await bot.sendMessage(Number(message.from?.id), 'Вы отказались от рассылки')
                }

            });
        break;
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