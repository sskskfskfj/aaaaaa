import http from "http";
import { Server as SocketIO } from "socket.io"; // 'socket.io' 대신 'socket.io-client'에서 가져옵니다.
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use("/public", express.static(`${__dirname}/public`));

app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new SocketIO(httpServer);


wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome", socket.id);
    console.log(`roomName : ${roomName} socket_id : ${socket.id}`);
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer, socket.id);
  });

  socket.on("answer", (answer, toId) => {
    socket.to(toId).emit("answer", answer, socket.id);
  });

  socket.on("ice", (ice, toId) => {
    socket.to(toId).emit("ice", ice, socket.id);
  });

  socket.on("message", (message, roomName) => {
    socket.to(roomName).emit("message", message);
    console.log(`Message sent to room ${roomName}: ${message}`);
  });

  socket.on("disconnecting", () => {
    let rooms = socket.rooms;
    rooms.delete(socket.id);

    let id = socket.id;
    console.log(`${id} left room`);
    console.log(rooms);

    rooms.forEach((room) => {
      socket.to(room).emit("bye", id);
    });
  });

});

export const fetchResult = async (textValue) => {
  try {
      const response = await axios({
          method: 'POST',
          url: "http://127.0.0.1:5000/app/tran",
          data: {
              text: textValue
          }
      });
      return { result: response.data };
  } catch (error) {
      throw new Error(`Error fetching result: ${error.message}`);
  }
};


const handleListen = () => console.log(`server listening`);
httpServer.listen(80, handleListen);