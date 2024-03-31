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

let webCamState = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('from background.ts webcamState: ', request.webcamState);
    if(request.message === 'opened'){
        sendResponse({webcamState: webCamState});
    }
    else {
        webCamState = request.webcamState;
    }
});
setInterval(() => {
    console.log("ping from background");
}, 5000);
