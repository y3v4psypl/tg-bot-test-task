import {config} from 'dotenv';
import TelegramBot, {ChatId, Message, SendMessageOptions} from 'node-telegram-bot-api';
import axios from 'axios';
import express, {raw} from 'express';
import * as fs from 'fs';
import * as pg from 'pg';

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
    bot.sendMessage(Number(msg.from?.id), 'Здравствуйте. Нажмите на любую интересующую Вас кнопку', {
        "reply_markup": {
            "inline_keyboard": [
                [
                    {
                        text: 'Погода в Канаде',
                        callback_data: '1',
                    },
                ],
                [
                    {
                        text: 'Хочу почитать!',
                        callback_data: '2',
                    }
                ],
                [
                    {
                        text: 'Сделать рассылку',
                        callback_data: '3',
                    }
                ]
            ],
        }
    });

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
});

bot.on('callback_query', async (callback_query) => {
    const action = callback_query.data;
    console.log(callback_query.data, callback_query.id)

    if (action === '1') {
        const currentTime = new Date().toISOString().slice(0, -10).concat('00');
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';

        let weatherData: IWeatherData = await axios({
            method: 'GET',
            url: url,
        }).then(response => response.data);

        const { time, temperature_2m } = weatherData.hourly;

        const weatherIndex = time.findIndex(el => el === currentTime);
        console.log(currentTime, temperature_2m[weatherIndex]);

        if (message.from?.id != null) {
            await bot.answerCallbackQuery(callback_query.id)
            await bot.sendMessage(message.from?.id, `Сейчас в Оттаве (Канада) ${temperature_2m[weatherIndex]}°C`);
        }
    }

    if (action === '2') {
        const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
        const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
        const file = fs.createReadStream('files/python-book.zip');

        if (message.from?.id != null) {
            await bot.answerCallbackQuery(callback_query.id)
            await bot.sendPhoto(message.from.id, photo, {caption});
            await bot.sendDocument(message.from.id, file).catch(e => console.log(e));
            console.log('File has been sent');
        }
    }

    if (action === '3') {
        await bot.answerCallbackQuery(callback_query.id)
        await bot.sendMessage(Number(message.from?.id), 'Вы выбрали рассылку всем пользователям. Вы уверены что хотите это сделать?', {
            "reply_markup": {
                "inline_keyboard": [
                    [
                        {text: 'Уверен(а)', callback_data: '4'}
                    ],
                    [
                        {text: 'Нет', callback_data: '5'}
                    ]
                ]
            }
        })

        bot.on('callback_query', (callback_query) => {
            const action = callback_query.data;

            if (action === '4') {
                bot.answerCallbackQuery(callback_query.id)
                    .then(async () => {
                        const messageBroadcat = await bot.sendMessage(Number(message.from?.id), 'Введите сообщение, которое хотите отправить всем пользователям.', {
                            reply_markup: {
                                force_reply: true,
                            },
                        });
                        bot.onReplyToMessage(Number(message.from?.id), messageBroadcat.message_id, async (message) => {
                            pool.connect((err, client, done) => {
                                if (err) {
                                    return console.log('Connection error', err);
                                }

                                client.query({text: `SELECT "chat_id" FROM "users"`, rowMode: 'array'}, (e, res) => {
                                    done();
                                    console.log(res.rows);
                                    res.rows.forEach(chatID => {

                                        if (message.text != null) {
                                            bot.sendMessage(chatID[0], message.text)
                                        }
                                    })

                                    if (e) {
                                        return console.log('Error running query', e);
                                    }
                                });
                            });
                        })
                    })
            }
        })
    }
})



bot.on('polling_error', console.log);

app.listen(process.env.PORT, () => console.log(`Server is listening on ${process.env.PORT}`))

interface IWeatherData {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    hourly_units: {
        time: string;
        temperature_2m: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
    };
}
