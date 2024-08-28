import express from "express"
import http from "http"
import WebSocket from "ws"

const app = express()

app.set("view engine", "pug")
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (_, res)=>{res.render("home")})
app.get("/*", (_, res)=>{res.redirect("/")})

const handleListen = ()=>console.log(`listening on https://localhost:3000`)
const server = http.createServer(app)
const wss = new WebSocket.Server({server})


function socketDisconnected(){console.log("client 연결 끊김")}

//가짜 데이터베이스
const webSockets = []

//webSocket은 브라우저와의 연결
wss.on("connection",(webSocket)=>{
    webSockets.push(webSocket)
    webSocket.on("close", socketDisconnected)
    console.log("connected to browser")
    webSocket.on("message", (message)=>{
        webSockets.forEach(aSocket => aSocket.send(message.toString("utf-8")))
        console.log(message.toString("utf-8"))
    })
}) 

server.listen(3000, handleListen)


