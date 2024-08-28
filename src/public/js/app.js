//webSocket -> 서버로의 연결
const webSocket = new WebSocket(`ws://${window.location.host}`)
const messageList = document.querySelector("ul")
const messageForm = document.querySelector("form")

webSocket.addEventListener("open", ()=>{
    console.log("connected to server")
})

webSocket.addEventListener("message", (message)=>{
    console.log("new message", message.data)
})

webSocket.addEventListener("close", ()=>{
    console.log("disconnected to server")
})

function handleSubmit(event){
    event.preventDefault()
    const input = messageForm.querySelector("input")
    console.log(input.value)
    webSocket.send(input.value)
    input.value = ""
}

messageForm.addEventListener("submit", handleSubmit)