import express from "express"
import http from "http"
import SocketIO from "socket.io"


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res)=>{res.render("home")});
app.get("/*", (_, res)=>{res.redirect("/")});

const handleListen = ()=>console.log(`listening on https://localhost:3000`);
const httpServer = http.createServer(app);
const ws = SocketIO(httpServer);

ws.on("connection", (socket) =>{
    socket.onAny((event) => {
        console.log(`socket event : ${event}`);
    })

    socket.on('enter_room', (roomName, showRoom) => {
        console.log(typeof(roomName.payload))
        socket.join(roomName.payload);
        showRoom();
        socket.to(roomName.payload).emit("welcome");
        
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit('bye');
        });
    })
})


function socketDisconnected(){console.log("client 연결 끊김");}

httpServer.listen(3000, handleListen);



