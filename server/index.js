const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "https://chat-app4-frontend.vercel.app",
    credentials: true,
  },
});
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    'mongodb+srv://jayaprasadb718:xZGx4lUaHFeYE4fR@cluster0.shd9di5.mongodb.net/jayaprasadb718?retryWrites=true&w=majority',
    { writeConcern: { w: 'majority' } },
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log('Error connecting to the database', err.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("add-user", (userId) => {
    console.log(`User added: ${userId}`);
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });

  socket.on("disconnect", () => {
    // Remove the user from onlineUsers map on disconnect
    [...onlineUsers.entries()]
      .filter(([_, socketId]) => socketId === socket.id)
      .forEach(([userId]) => {
        console.log(`User disconnected: ${userId}`);
        onlineUsers.delete(userId);
      });
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
