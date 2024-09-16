
import { Server as SocketIOServer } from "socket.io"
import http from "http"
import { Redis } from "ioredis";
import dotenv from "dotenv";
import { ChatModel } from "./models/chat.model";
dotenv.config();
// Create the Redis subscriber
const subscriber = new Redis(process.env.REDIS_URL || "", {
  tls: {
    rejectUnauthorized: false // Required for Upstash Redis
  }
});

// Subscribe to a Redis channel
subscriber.subscribe("chat_channel", (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(`Subscribed to ${count} channel(s).`);
  }
});



// Listen for messages on the channel
subscriber.on("message", (channel, message) => {
  console.log(`Received message on ${channel}: ${message}`);
  // Handle the message here, e.g., emit it to clients via Socket.IO
});

const publisher = new Redis(process.env.REDIS_URL || "", {
  tls: {
    rejectUnauthorized: false // Required for Upstash Redis
  }
});

// Function to publish a message to a Redis channel
const publishMessage = (message: string) => {
  publisher.publish("chat_channel", message, (err, reply) => {
    if (err) {
      console.error("Failed to publish message: %s", err.message);
    } else {
      console.log(`Message published to ${reply} subscribers.`);
    }
  });
};

const pub = new Redis(process.env.REDIS_URL || "", {
  tls: {
    rejectUnauthorized: false
  }
});

const sub = new Redis(process.env.REDIS_URL || "", {
  tls: {
    rejectUnauthorized: false
  }
});


export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server);

  sub.subscribe("chat_channel", (err, count) => {
    if (err) {
      console.error("Failed to subscribe: %s", err.message);
    } else {
      console.log(`Subscribed to ${count} channel(s).`);
    }
  });

  // Listen for messages from Redis and broadcast them to all clients
  sub.on("message", (channel, message) => {
    const parsedMessage = JSON.parse(message); // Parse the message back to its original format
    io.emit("newMessage", parsedMessage);  // Broadcast the message
  });

  io.on("connection", (socket) => {
    console.log('A user connected');

    // Listen for incoming messages from the frontend
    socket.on("message", async (data) => {
      console.log("Received message:", data);

      // 1. Emit the message to all clients
      io.emit("newMessage", data);

      // 2. Save the message to Redis
      const messageString = JSON.stringify(data); // Convert the message to a string for Redis
      await publisher.publish("chat_channel", messageString);

      // 3. Save the message to MongoDB
      const { text } = data;

      const newMessage = {

        content: text,
        timestamp: new Date(),
      };

      // Find the chat and update with the new message
      await ChatModel.create({
        newMessage
      })
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};
