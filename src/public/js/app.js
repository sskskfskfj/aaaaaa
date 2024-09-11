const socket = io()
const welcome = document.getElementById('welcome')
const form = document.querySelector('form')
const room =  document.getElementById('room')

room.hidden = true;
let roomName = "";

function addMessage(message){
    const ul = document.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom(){
    console.log("asddddddd");
    welcome.hidden = true;
    room.hidden = false;
    const h3 = document.querySelector('h3');
    h3.innerText = `Room ${roomName}`;
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = document.querySelector("input");
    socket.emit('enter_room', {payload : input.value}, showRoom);
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", () => {
    console.log("A");
    addMessage("someone joined");
})

socket.on("bye", () => {
    console.log("B");
    addMessage("someone  left");
})

