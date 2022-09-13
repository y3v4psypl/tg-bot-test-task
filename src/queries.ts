import axios from 'axios';
import {Client, Pool, PoolClient} from 'pg';
import {Message} from 'node-telegram-bot-api';


export const getWeather = async () => {
    const currentTime = new Date().toISOString().slice(0, -10).concat('00');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';

    let weatherData: IWeatherData = await axios({
        method: 'GET',
        url: url,
    }).then(response => response.data);

    const { time, temperature_2m } = weatherData.hourly;

    const weatherIndex = time.findIndex(el => el === currentTime);

    return temperature_2m[weatherIndex];
}

export const getAllUserIds = async (pool: Pool) => {
    const client = await pool.connect();
    let res;
    try {
        res = await client.query({text: `SELECT "chat_id" FROM "users"`, rowMode: 'array'});
    } finally {
        client.release()
    }
    return res;
}

export const postNewUser = async (pool: Pool, msg: Message) => {
    const client = await pool.connect();
    let res;

    const checkExistingUser = async (client: PoolClient, msg: Message) => {
        // try {
            const res = await client.query({text: `SELECT "chat_id" FROM "users" WHERE "chat_id" = ${msg.chat.id}`, rowMode: 'array'});
            return res.rows.length > 0;
        // } finally {
        //     client.release();
        // }
    }
    if (await checkExistingUser(client, msg)) {
        return;
    } else {
        // try {
            res = await client.query(`INSERT INTO "users" ("username", "chat_id")
                                VALUES ($1, $2)`, [msg.chat.username, msg.chat.id]);
            return res;
        // } finally {
        //     client.release();
        // }
    }
}

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