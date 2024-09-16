"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const db_1 = __importDefault(require("./utils/db"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const socketServer_1 = require("./socketServer");
const server = http_1.default.createServer(app_1.app);
//cloudinary config
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
});
(0, socketServer_1.initSocketServer)(server);
//create our server
server.listen(process.env.PORT, () => {
    console.log(`Server is running on ${process.env.PORT}`);
    (0, db_1.default)();
});
