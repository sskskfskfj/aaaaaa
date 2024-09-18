const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.continuous = true; // 계속해서 음성을 인식

recognition.onstart = () => {
    console.log("음성 인식 시작");
};

recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

    console.log(`인식된 텍스트: ${transcript}`);
};

recognition.onerror = (event) => {
    console.error("인식 중 오류 발생: ", event.error);
};

function startRecognition() {
    recognition.start();
    console.log("음성 인식이 시작되었습니다.");
}

function stopRecognition() {
    recognition.stop();
    console.log("음성 인식이 중지되었습니다.");
}

export{startRecognition, stopRecognition}