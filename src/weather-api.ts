import axios from 'axios';


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