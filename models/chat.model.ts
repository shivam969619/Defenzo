import mongoose, { Document, Schema, Types, Model } from "mongoose";


interface Message {
    sender: Types.ObjectId;
    content: string;
    timestamp: Date;
}


export interface Chat extends Document {
    isGroupChat: boolean;
    participants: Types.ObjectId[];
    messages: Message[];
}


// Create the Chat schema
const chatSchema: Schema<Chat> = new mongoose.Schema({
    messages: [{
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Export the Chat model with the static method
export const ChatModel = mongoose.model<Chat>("Chat", chatSchema);
