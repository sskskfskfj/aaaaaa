const socket = io()
const welcome = document.getElementById('welcome')
const roomForm = document.getElementById("enter")
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
    console.log(roomName);
    welcome.hidden = true;
    room.hidden = false;
    const h3 = document.querySelector('h3');
    h3.innerText = `Room ${roomName}`; 
    const msgForm = document.getElementById('message');
    msgForm.addEventListener('submit', handleMessageSubmit);

}
const nameForm = document.getElementById('name');
nameForm.addEventListener('submit', handleNameSubmit);

function handleNameSubmit(event){
    event.preventDefault();
    const input = document.querySelector("#welcome #name input");
    console.log(input.value);
    socket.emit('nickname', input.value);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#room #message input");
    const value = input.value;
    socket.emit('new_message', value, roomName ,() => {
        addMessage(`you : ${value}`)
        input.value = "";
    });
    
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = document.querySelector("#welcome #enter input");
    console.log(`roomname : ${input.value}`)
    roomName = input.value
    socket.emit('enter_room', {payload : input.value}, showRoom);
    input.value = "";
}

roomForm.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user) => {addMessage(`${user} joined`);});
socket.on("bye", (user) => {addMessage(`${user} left`);});
socket.on("new_message", (msg) => {addMessage(msg);});
