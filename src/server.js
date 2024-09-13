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

function publicRooms(){

    const {
        sockets: {
            adapter : {sids, rooms}
        }
    } = ws;
    
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) == undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}


ws.on("connection", (socket) =>{
    socket["nickname"] = "Anon"
    socket.onAny((event) => {
        console.log(`socket event : ${event}`);
    });

    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName.payload);
        done();
        socket.to(roomName.payload).emit("welcome", socket.nickname);
        ws.sockets.emit('room_change', publicRooms());
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit('bye', socket.nickname);
        });
    });

    socket.on("disconnect", () => {
        ws.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname} : ${msg}`);
        done();
    });

    socket.on("nickname", nickname => socket["nickname"] = nickname);
});


function socketDisconnected(){console.log("client 연결 끊김");}

httpServer.listen(3000, handleListen);



