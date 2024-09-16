// import mongoose from 'mongoose';
// import { ChatModel } from '../models/chat.model'; // Import the Chat model

// async function addNewMessage(chatId: string, userId: string, content: string) {
//     const message = {
//         sender: new mongoose.Types.ObjectId(userId),  // Convert userId string to ObjectId
//         content: content,
//         timestamp: new Date()  // Optional: defaults to the current time
//     };

//     try {
//         const result = await ChatModel.addMessage(chatId, message);
//         console.log('Message added successfully:', result);
//     } catch (error) {
//         console.error('Error adding message:', error);
//     }
// }
