import { startRecognition, stopRecognition } from "./speech.js";

const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const call = document.querySelector("#call");
const welcomeForm = document.querySelector("#welcome form");
const chatForm = document.querySelector("#chatForm");
const chatDiv = chatForm.querySelector("#chatDiv");
const leaveBtn = document.querySelector("#leave");
const streamDiv = document.querySelector("#myStream");

call.hidden = true;
welcome.hidden = false;
let myStream;
let mute = false;
let cameraOff = false;
let roomName;
let nickName;
let myPeerConnection;
let pendingICECandidates = {};
let lang;
let voiceMessage = '';
let isRecognizing = false;

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
        muteBtn.innerText = mute ? "Mute" : "UnMute";
        if(mute){
            console.log("mute");
            handleVoiceRecognition()
            
            isRecognizing = !isRecognizing;
            
            
            
        }else{ 
            console.log("unmute");
            stopRecognition();
        }
    }
}
export function setVoiceMessage(newMessage) {
    voiceMessage = newMessage;
    handleVoiceMessage();  // 새로운 음성 메시지가 설정되면 호출
}
export async function handleVoiceRecognition() {
    if (mute && !isRecognizing) {  // mute 상태가 아니고 인식이 시작되지 않은 경우
        isRecognizing = true;  // 인식 상태 설정
        try {
            await startRecognition();
            isRecognizing = false;  // 음성 인식 시작 (다른 파일의 함수)
        } catch (error) {
            console.error(error);
        }
    }
}
function handleVoiceMessage() {
    if (voiceMessage) {
        const message = `${nickName} : ${voiceMessage}`;
        writeChat(message);  
        socket.emit("message", message, roomName);  
        voiceMessage = "";  
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
    lang = welcomeForm.querySelector("select[name=lang]").value;
    
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

// 새로 들어온 피어를 환영하고 offer 생성 및 전송
socket.on("welcome", async (fromId) => {
    console.log(`${fromId} joined`);
    
    // 새로운 피어와 연결 설정
    makeConnection(fromId);
    console.log(`made connection with ${fromId}`);

    // Offer 생성 및 전송
    try {
        const offer = await peerMap.get(fromId).createOffer();
        await peerMap.get(fromId).setLocalDescription(offer);
        console.log(`sent offer to ${fromId}`);
        
        // offer를 특정 피어에게 전송
        socket.emit("offer", offer, fromId);
    } catch (error) {
        console.error("Error creating offer:", error);
    }
});

socket.on("offer", async (offer, fromId) => {
    console.log(`got offer from ${fromId}`);

    makeConnection(fromId);
    console.log(`made connection with ${fromId}`);

    try {
        // Offer를 remote description으로 설정
        await peerMap.get(fromId).setRemoteDescription(new RTCSessionDescription(offer));
        
        // Answer 생성 및 전송
        const answer = await peerMap.get(fromId).createAnswer();
        await peerMap.get(fromId).setLocalDescription(answer);
        console.log(`sent the answer to ${fromId}`);
        
        // Answer를 원래 오퍼를 보낸 피어에게 전송
        socket.emit("answer", answer, fromId);
    } catch (error) {
        console.error("Error handling offer:", error);
    }
});

socket.on("answer", async (answer, fromId) => {
    console.log(`received answer from ${fromId}`);
    try {
        // 원격 SDP를 설정하여 연결 완료
        await peerMap.get(fromId).setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Connection established with", fromId);
    } catch (error) {
        console.error("Error setting remote description:", error);
    }
});
socket.on("ice", async (ice, fromId) => {
    console.log(`received ICE candidate from ${fromId}`);
    try {
        await peerMap.get(fromId).addIceCandidate(new RTCIceCandidate(ice));
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
    }
});
socket.on("bye", (fromId) => {
    console.log(`bye ${fromId}`);
    
    if (peerMap.has(fromId)) {
        peerMap.get(fromId).close();
        peerMap.delete(fromId);
        
        let videoElement = document.querySelector(`#${fromId}`);
        if (videoElement) {
            videoElement.remove();
        }
    }
});

function makeConnection(fromId) {
    const rtcConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun.l.google.com:5349",
                    "stun:stun1.l.google.com:3478",
                    "stun:stun1.l.google.com:5349",
                    "stun:stun2.l.google.com:19302",
                ]
            }
        ]
    });

    peerMap.set(fromId, rtcConnection);

    rtcConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            console.log(`sent ICE candidate to ${fromId}`);
            socket.emit("ice", event.candidate, fromId);
        }
    });

    rtcConnection.addEventListener("track", (event) => {
        handleTrack(event, fromId);
    });

    if (myStream) {
        myStream.getTracks().forEach((track) => rtcConnection.addTrack(track, myStream));
    } else {
        console.log("No local stream available.");
    }

    rtcConnection.addEventListener("signalingstatechange", () => {
        console.log(`Connection with ${fromId} signaling state: ${rtcConnection.signalingState}`);
    });

    rtcConnection.addEventListener("iceconnectionstatechange", () => {
        console.log(`ICE connection state with ${fromId}: ${rtcConnection.iceConnectionState}`);
    });
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
