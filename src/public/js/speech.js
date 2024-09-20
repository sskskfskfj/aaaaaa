import { handleVoiceRecognition, setVoiceMessage} from "./app.js";

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false; 
recognition.lang = 'ko-KR';
let isRecognitionActive = false;

recognition.onstart = () => {
    console.log("음성 인식 시작");
};

recognition.onerror = (event) => {
    console.error("인식 중 오류 발생: ", event.error);
};

export async function startRecognition() {
    return new Promise((resolve, reject) => {
        if (isRecognitionActive) {
            console.warn("음성 인식이 이미 시작되었습니다.");
            resolve();  // 이미 시작된 경우에는 아무 것도 하지 않음
            return;
        }

        isRecognitionActive = true;
        recognition.start();
        console.log("음성 인식이 시작되었습니다.");

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            console.log(`인식된 텍스트: ${transcript}`);
            setVoiceMessage(transcript);  // 음성 메시지 설정
            resolve(transcript);  // 인식된 텍스트 반환
        };

        recognition.onerror = (event) => {
            console.error(`에러 발생: ${event.error}`);
            isRecognitionActive = false;  // 에러 발생 시 인식 상태 초기화
            reject(event.error);  // 에러 발생 시 거부
        };

        recognition.onend = () => {
            console.log("음성 인식이 완료되었습니다.");
            isRecognitionActive = false;  // 인식 상태 초기화
            if (mute) {
                console.log("음성인식 재시작");
                handleVoiceRecognition();  // mute가 해제된 경우 다시 시작
            }
        };
    });
}

export function stopRecognition() {
    recognition.stop();
    setTimeout(() => {
        console.log("음성 인식이 중지되었습니다.");
        isRecognitionActive = false;
    },100)
    
}
