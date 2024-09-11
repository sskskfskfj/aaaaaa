import express from "express"
import http from "http"
import SocketIO from "socket.io"


const app = express()

app.set("view engine", "pug")
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (_, res)=>{res.render("home")})
app.get("/*", (_, res)=>{res.redirect("/")})

const handleListen = ()=>console.log(`listening on https://localhost:3000`)
const httpServer = http.createServer(app)
const ws = SocketIO(httpServer)

ws.on("connection", (socket) =>{
    socket.onAny((event) => {
        console.log(`socket event : ${event}`)
    })

    socket.on('enter_room', (roomName, showRoom) => {
        socket.join(roomName)
        showRoom()
        socket.to(roomName).emit("welcome")
        console.log("asdf")
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            socket.to(room).emit('bye')
        });
    })
})


function socketDisconnected(){console.log("client 연결 끊김")}

//접속한 socket 저장
// const webSockets = []

// //webSocket은 브라우저와의 연결
// wss.on("connection",(webSocket)=>{
//     webSockets.push(webSocket)
//     webSocket["nickname"] ="Anon"

//     webSocket.on("close", socketDisconnected)
//     console.log("connected to browser")
//     webSocket.on("message", (msg)=>{
//         const message = JSON.parse(msg)
        
//         switch(message.type){
//             case "new_message":
//                 console.log(message.payload)
//                 webSockets.forEach((aSocket) => 
//                     aSocket.send(`${webSocket.nickname} : ${message.payload}`
//                 ))
//             case "nickname":
//                 console.log(message.payload)
//                 webSocket["nickname"] = message.payload
//         }
        
//     })
// }) 

httpServer.listen(3000, handleListen)



