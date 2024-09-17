const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const welcomeForm = document.querySelector("#welcome form");
const chatForm = document.querySelector("#chatForm");
const chatDiv = chatForm.querySelector("#chatDiv");
const leaveBtn = document.querySelector("#leave");
const streamDiv = document.querySelector("#myStream");

call.hidden = true;
let myStream;
let mute = false;
let cameraOff = false;
let roomName;
let nickName;
let myPeerConnection;
let pendingICECandidates = {};
const peerMap = new Map();

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        if (myStream) {
            const currentCamera = myStream.getVideoTracks()[0];
            cameras.forEach((camera) => {
                const option = document.createElement("option");
                option.value = camera.deviceId;
                option.innerText = camera.label;
                if (currentCamera && currentCamera.label === camera.label) {
                    option.selected = true;
                }
                camerasSelect.appendChild(option);
            });
        }
    } catch (e) {
        console.error(e);
    }
}
async function getMedia(deviceId) {
    const constraints = {
        audio: true,
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
        myFace.srcObject = myStream;
        if (!deviceId) {
            myStream.getAudioTracks().forEach(track => track.enabled = false);
            await getCameras();
        }
    } catch (e) {
        console.error(e);
    }
}
function handleMute() {
    if (myStream) {
        myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        mute = !mute;
        muteBtn.innerText = mute ? "Unmute" : "Mute";
    }
}
function handleCamera() {
    if (myStream) {
        myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        cameraOff = !cameraOff;
        cameraBtn.innerText = cameraOff ? "Turn Camera On" : "Turn Camera Off";
    }
}
async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");
        if (videoSender) {
            videoSender.replaceTrack(videoTrack);
        }
    }
}
async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const inputRoomName = welcomeForm.querySelector("#roomName");
    const inputNickName = welcomeForm.querySelector("#nickName");

    await initCall();
    console.log("start initCall");
    socket.emit("join_room", inputRoomName.value, inputNickName.value);
    console.log(inputRoomName.value);

    roomName = inputRoomName.value;
    nickName = inputNickName.value;
    inputRoomName.value = "";
    inputNickName.value = "";

    const showRoomName = document.getElementById("showRoomName");
    showRoomName.innerHTML = `<h1>room : ${roomName}</h1>`;

    showNickName();
}
function showNickName() {
    const h3 = document.querySelector("#myStream h3");
    h3.innerText = nickName;
}
function leaveRoom() {
    socket.disconnect();
    welcome.hidden = false;
    call.hidden = true;
    myStream.getTracks().forEach(track => track.stop());
    myFace.srcObject = null;
    document.querySelector("#showRoomName h1").remove();
    document.querySelector("#nickName").innerText = "";
    document.querySelector("#roomName").innerText = "";
    nickName = "";
    roomName = "";
}
function chathandler(e) {
    e.preventDefault();
    const input = chatDiv.querySelector("input");
    const message = `${nickName} : ${input.value}`;
    socket.emit("message", message, roomName);
    input.value = "";
    writeChat(message);
}
function writeChat(message) {
    const ul = chatDiv.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}
socket.on("message", writeChat);

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    try{
        await getMedia();
        console.log("1");
    }catch(e){
        console.log(e);
    }
}

socket.on("welcome", async (fromId) => {
    console.log(`${fromId} joined`);
    makeConnection(fromId);
    console.log(`made connection with ${fromId}`);

    const offer = await peerMap.get(fromId).createOffer();
    peerMap.get(fromId).setLocalDescription(offer);

    console.log(`sent to the offer to ${fromId}`);
    socket.emit("offer", offer, roomName);
});
socket.on("offer", async(offer, fromId) => {
    console.log(`got offer from ${fromId}`);
    console.log(myStream);

    // 새로 들어온 Client와 Connection을 생성한다. (offer를 받는 쪽)
    makeConnection(fromId);
    console.log(`made connection with ${fromId}`);

    console.log(peerMap.get(fromId));
    peerMap.get(fromId).setRemoteDescription(offer);
    const answer = await peerMap.get(fromId).createAnswer();
    peerMap.get(fromId).setLocalDescription(answer);
    console.log(peerMap.get(fromId));

    
    console.log(`sent the answer to ${fromId}`);
    socket.emit("answer", answer, fromId);
    
});
socket.on("answer", (answer, fromId) => {
    console.log(`received the answer from ${fromId}`);
    try{
        peerMap.get(fromId).setRemoteDescription(answer);
        console.log(peerMap.get(fromId));
        
    }catch(e){
        console.log(e);
    }
    
});
socket.on("ice", (ice, fromId) => {
    console.log(`received ice from ${fromId}`);
    peerMap.get(fromId).addIceCandidate(ice);
});
socket.on("bye", (fromId) => {
    // 나간 유저의 정보를 없앤다.
    console.log("bye " + fromId);
    peerMap.get(fromId).close();
    peerMap.delete(fromId);

    let video = document.querySelector(`#${fromId}`);
    streamDiv.removeChild(video);
});

function makeConnection(fromId) {
    const rtcConnection = new RTCPeerConnection({
        iceServers : [
            {
            urls : [
                "stun:stun.l.google.com:19302",
                "stun:stun.l.google.com:5349",
                "stun:stun1.l.google.com:3478",
                "stun:stun1.l.google.com:5349",
                "stun:stun2.l.google.com:19302",
            ]
        }]
    });


    peerMap.set(fromId, rtcConnection);
    peerMap.get(fromId).addEventListener("icecandidate", async(data) => {
        console.log(`sent candidate to ${fromId}`);
        socket.emit("ice", data.candidate, fromId);
    });
    peerMap.get(fromId).addEventListener("track", (data) => {
        handleTrack(data, fromId);
    });
    if(myStream){
        myStream.getTracks().forEach((track) => peerMap.get(fromId).addTrack(track, myStream));

    }else{
        console.log("myStream doesn't exist");
    }
}

function handleTrack(data, fromId) {
    let video = document.getElementById(`${fromId}`);
    if (!video) {
        video = document.createElement("video");
        video.id = fromId;
        video.width = 100;
        video.height = 100;
        video.autoplay = true;
        video.playsInline = true;

        streamDiv.appendChild(video);
    }

    console.log(`handleTrack from ${fromId}`);
    video.srcObject = data.streams[0];
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
leaveBtn.addEventListener("click", leaveRoom);
chatForm.addEventListener("submit", chathandler);
camerasSelect.addEventListener("input", handleCameraChange);
muteBtn.addEventListener("click", handleMute);
cameraBtn.addEventListener("click", handleCamera);
