const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

muteBtn.addEventListener("click", handleMute);
cameraBtn.addEventListener("click", handleCamera);
camerasSelect.addEventListener("input", handleCameraChange);

call.hidden = true;
welcome.hidden = false;

let myStream;
let mute = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    }catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstrains = {
        audio : true,
        video : {facingMode : "user"},
    };
    const cameraConstraints = {
        audio : true,
        video : {deviceId : {exact : deviceId}}
    };
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        } 
    }catch(e){
        console.log(e);
    }
}


function handleMute(){
    myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
    });

    if(!mute){
        muteBtn.innerText = "Unmute";
        mute = true;
    }else{
        muteBtn.innerText = "Mute";
        mute = false;
    }
}
function handleCamera(){
    myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
    });
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange(){
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}


async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();

}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";

}

welcomeForm = welcome.querySelector("form");
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//peer A
socket.on("welcome", async() => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("send the offer");
    socket.emit("offer", offer, roomName);
})

//peer B
socket.on("offer", async(offer) => {
    myPeerConnection.setRemoteDescription(offer);
    console.log("recieved the offer");
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);
})

//peer A
socket.on("answer", (ans) => {
    console.log("recieved the answer");
    myPeerConnection.setRemoteDescription(ans);
})

function makeConnection(){
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    // console.log(myPeerConnection);
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));

}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;

}

//peer A
function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
} 
//peer B
socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})