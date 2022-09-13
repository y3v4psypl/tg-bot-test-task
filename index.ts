import {config} from 'dotenv';
import TelegramBot, {Message, SendMessageOptions} from 'node-telegram-bot-api';
import axios from 'axios';
import express from 'express';
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

const options: SendMessageOptions = {
    //@ts-ignore
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Погода в Канаде', callback_data: 'weather'}],
            [{text: 'Хочу почитать!', callback_data: 'wantToRead'}],
            [{text: 'Сделать рассылку', callback_data: 'mailing'}]
        ]
    })
}

bot.onText(/\/start/gm, async (msg: Message) => {
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

    bot.on('callback_query', async (callback_query) => {
        const action = callback_query.data;

        if (action === 'weather') {
            const currentTime = new Date().toISOString().slice(0, -10).concat('00');
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';

            let weatherData: IWeatherData = await axios({
                method: 'GET',
                url: url,
            }).then(response => response.data);

            const { time, temperature_2m } = weatherData.hourly;

            const weatherIndex = time.findIndex(el => el === currentTime);
            console.log(currentTime, temperature_2m[weatherIndex]);

            bot.sendMessage(msg.chat.id, `Сейчас в Оттаве (Канада) ${temperature_2m[weatherIndex]}°C`);
        }


    })
});

bot.onText(/\/wannaread/gm, (msg: Message) => {
    const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
    const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
    const file = fs.createReadStream('files/python-book.zip')

    bot.sendPhoto(msg.chat.id, photo, {
        caption,
    }).catch(e => console.log(e));

    bot.sendDocument(msg.chat.id, file).catch(e => console.log(e));

    console.log('File has been sent')
});

// bot.onText(/\/weather/gm, async (msg: Message) => {
//
// });

bot.on

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

