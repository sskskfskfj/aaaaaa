//webSocket -> 서버로의 연결
const webSocket = new WebSocket(`ws://${window.location.host}`)
const messageList = document.querySelector("ul")
const messageForm = document.querySelector("#message")
const nickForm = document.querySelector("#nick")

function makeMessage(type, payload){
    const msg = {type, payload}
    return JSON.stringify(msg)
}

//ws 서버가 열렸을 때 나오는 메세지
webSocket.addEventListener("open", ()=>{
    console.log("connected to server")
})

//websocket에 message가 들어왔을 때 처리
webSocket.addEventListener("message", (message)=>{
    console.log("new message", message.data)
    const li = document.createElement("li")
    li.innerText = message.data
    messageList.append(li)
})

webSocket.addEventListener("close", ()=>{
    console.log("disconnected to server")
})

function handleSubmit(event){
    event.preventDefault()
    const input = messageForm.querySelector("input")
    webSocket.send(makeMessage("new_message", input.value))
    console.log(input.value)
    input.value = ""
}
function handleNickSubmit(event){
    event.preventDefault()
    const input = nickForm.querySelector("input")
    webSocket.send(makeMessage("nickname", input.value))
    input.value = ""
}

messageForm.addEventListener("submit", handleSubmit)
nickForm.addEventListener("submit", handleNickSubmit);