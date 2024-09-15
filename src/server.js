import express from "express"
import { Route } from "express";
import http from "http"
import SocketIO from "socket.io"

const app = express();
function handleListen(){
    console.log(`the server is listening on 3000`);
}
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res)=>{res.render("home")});
app.get("/*", (_, res)=>{res.redirect("/")});

const httpServer = http.createServer(app);
const ws = SocketIO(httpServer);

ws.on("connection", socket => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");  
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    })
    socket.on("answer", (ans, roomName) => {
        socket.to(roomName).emit("answer", ans);
    })
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    })

    //chat
    socket.on("message", (message, roomName) => {
        socket.to(roomName).emit("message",message);
        console.log(message);
    })
});

httpServer.listen(3000, handleListen);



