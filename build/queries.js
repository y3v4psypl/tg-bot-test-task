"use strict";
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
exports.postNewUser = exports.getAllUserIds = exports.getWeather = void 0;
const axios_1 = __importDefault(require("axios"));
const getWeather = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentTime = new Date().toISOString().slice(0, -10).concat('00');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.4235&longitude=-75.6979&hourly=temperature_2m';
    let weatherData = yield (0, axios_1.default)({
        method: 'GET',
        url: url,
    }).then(response => response.data);
    const { time, temperature_2m } = weatherData.hourly;
    const weatherIndex = time.findIndex(el => el === currentTime);
    return temperature_2m[weatherIndex];
});
exports.getWeather = getWeather;
const getAllUserIds = (pool) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield pool.connect();
    let res;
    try {
        res = yield client.query({ text: `SELECT "chat_id" FROM "users"`, rowMode: 'array' });
    }
    finally {
        client.release();
    }
    return res;
});
exports.getAllUserIds = getAllUserIds;
const postNewUser = (pool, msg) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield pool.connect();
    let res;
    const checkExistingUser = (client, msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const res = yield client.query({ text: `SELECT "chat_id" FROM "users" WHERE "chat_id" = ${msg.chat.id}`, rowMode: 'array' });
            return res.rows.length > 0;
        }
        finally {
            client.release();
        }
    });
    if (yield checkExistingUser(client, msg)) {
        return;
    }
    else {
        try {
            res = yield client.query(`INSERT INTO "users" ("username", "chat_id")
                                VALUES ($1, $2)`, [msg.chat.username, msg.chat.id]);
            return res;
        }
        finally {
            client.release();
        }
    }
    return res;
});
exports.postNewUser = postNewUser;
