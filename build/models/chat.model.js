"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Create the Chat schema
const chatSchema = new mongoose_1.default.Schema({
    messages: [{
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }]
}, { timestamps: true });
// Export the Chat model with the static method
exports.ChatModel = mongoose_1.default.model("Chat", chatSchema);
