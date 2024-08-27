//webSocket -> 서버로의 연결
const webSocket = new WebSocket(`ws://${window.location.host}`)

webSocket.addEventListener("open", ()=>{
    console.log("connected to server")
})

webSocket.addEventListener("message", (message)=>{
    console.log("server message", message.timeStamp)
})

webSocket.addEventListener("close", ()=>{
    console.log("disconnected to server")
})