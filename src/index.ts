import {config} from 'dotenv';
import TelegramBot, {Message} from 'node-telegram-bot-api';
import fetch from 'node-fetch';

// access env variables
config();

let TOKEN = process.env.TELEGRAM_API_TOKEN || 'undefined';

// create bot
const bot = new TelegramBot(TOKEN, { polling: true });
if (bot) { console.log('Bot is created')};

bot.setWebHook('https://atk-group-test-task.herokuapp.com/');

bot.onText(/\/wannaread/gm, (msg: Message) => {
    const photo = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg';
    const caption = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.';
    // const file = '..files/karmaniy_spravochnik_po_piton.zip';
    bot.sendPhoto(msg.chat.id, photo, {
        caption,
    }).catch(e => console.log(e))
    // bot.sendDocument(msg.chat.id, file);
});

bot.onText(/\/weather/gm, (msg: Message) => {
    const currentTime = new Date().toISOString().slice(0, -10).concat('00');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';

    const response = fetch(url, { method: 'GET'});
    response.then(async response => {
        //@ts-ignore
        const weatherData: IWeatherData = await response.json();

        const { time, temperature_2m } = weatherData.hourly;

        const weatherIndex = time.findIndex(el => el === currentTime);
        console.log(currentTime, temperature_2m[weatherIndex]);

        await bot.sendMessage(msg.chat.id, `Сейчас в Оттаве (Канада) ${temperature_2m[weatherIndex]}°C`);
    });
});

bot.on('polling_error', console.log);

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





