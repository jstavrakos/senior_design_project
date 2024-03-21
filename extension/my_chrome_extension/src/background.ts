import * as ort from 'onnxruntime-web';
import { Tensor } from 'onnxruntime-web';

const videoConstraints = {
    width: 150,
    height: 150,
}
let stream = <MediaStream>{};

chrome.runtime.onInstalled.addListener(() => {
    console.log("installed");
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('webcamState: ', request.webcamState);
    if (request.webcamState === true){
        startWebcam();
    }
    else {
        stopWebcam();
    }
});
setInterval(() => {
    console.log("ping from background");
}, 5000);

async function startWebcam(){
    try {
        // stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints })
        console.log('success with stream');
    } catch (err: any) {
        console.error(`The following error`);
    }
}
async function stopWebcam(){
    // if(stream){
    //     stream.getTracks().forEach((track: { stop: () => void; }) => {
    //         track.stop();
    //     });
    //     stream = <MediaStream>{};
    // }
    console.log('stopped webcam');
}