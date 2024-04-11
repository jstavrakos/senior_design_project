import * as ort from 'onnxruntime-web';

// Global variable and function for the model which will only be loaded once
let MODEL: ort.InferenceSession;
// Listen for messages from the Chrome runtime
var webCamState = false;
var frameCaptureState = false;

// Constants for model input
const IMG_HEIGHT = 480;
const IMG_WIDTH = 480;

// Constants for the model
const NUM_CLASSES = 80;
const OUTPUT_TENSOR_SIZE = 4725;

const yolo_classes = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
  'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
  'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
  'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
  'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

ort.env.wasm.numThreads = 1;

var frameCaptureInterval: any = null;


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is from app.js
  console.log('off_screen.ts message: ', message);
  if (sender.id === 'hljhapmlbiiediilmbgekaeobfplpjpc' && message.message !== undefined) {
    // Check if the message contains the webcamState property
    if((message.message === ('useEffect'))){
      const response = {webCamState: webCamState, frameCaptureState: frameCaptureState};
      console.log('useEffect response: ', response);
      sendResponse(response);
    }
    if (message.message === ('webCamState')) {
      webCamState = message.webCamState;
      if (webCamState === true) {
        // Start the webcam
        startWebcam();
        loadModel();

      } else {
        // Stop the webcam
        stopWebcam();
      }
    }
    if (message.message === ('frameCaptureState')) {
      frameCaptureState = message.frameCaptureState;
      if(frameCaptureState === true) {
        let response = {message : 'frameCaptureState', results: null};

        // response.results = handleOnCapture();
        // console.log('model_input response from off_screen: ', response);
        // sendResponse(response);
        frameCaptureInterval = setInterval(() => {
          handleOnCapture().then((results) => {
            response.results = results;
            console.log('model_input response from off_screen: ', response);
            chrome.runtime.sendMessage(response);
            // sendResponse(response);
          });
        }, 1000);
      }
      else {
        clearInterval(frameCaptureInterval);
        console.log('Frame capture state is off');
      }
    }
  }
});

let videoElement: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
  
function startWebcam() {
  if(stream == null){
    
    console.log('Starting webcam');
    console.log('stream: ', stream);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((streamObj) => {
        stream = streamObj;

        // Create a video element and set its source
        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.style.position = 'fixed';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        videoElement.style.width = '150'; // Adjust the size as needed
        videoElement.style.height = '150';

        // Append the video element to the page
        document.body.appendChild(videoElement);
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
      });
    }
  }
  
function stopWebcam() {
  console.log('Stopping webcam');
  if (stream !== null) {
    // Stop the webcam stream
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    stream = null;
  }

  // Remove the video element from the page
  if (videoElement) {
    videoElement.remove();
    videoElement = null;
  }
}

function loadModel() {
    if (MODEL === undefined) {
       ort.InferenceSession.create('./yolov8n.onnx', {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        }).then((model) => {
            MODEL = model;
        });
    }
}

async function handleOnCapture (): Promise<any> {
  if (videoElement && MODEL) {
    // const capturedImageSrc = videoElement.src;
    // webcamRef.current.getScreenshot({width: 150, height: 150});

    const image = new Image();
    if (videoElement){
      // Load the webcam image from our canvas to process
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = IMG_WIDTH;
        canvas.height = IMG_HEIGHT;
        context.drawImage(videoElement, 0, 0, IMG_WIDTH, IMG_HEIGHT);
        
        // PRE PROCESS
        //console.time('pass through model')
        const imageData = context.getImageData(0, 0, IMG_WIDTH, IMG_HEIGHT);
        const pixels = imageData.data;
        
        // Convert base64 image to RGB tensor for the model
        const red: number[] = [];
        const green: number[] = [];
        const blue: number[] = [];
        for( let i = 0; i < pixels.length; i += 4 ) {
          red.push(pixels[i] / 255.0);
          green.push(pixels[i+1] / 255.0);
          blue.push(pixels[i+2] / 255.0);
        }

        const input = [...red, ...green, ...blue];
        // END PRE PROCESS

        // RUN MODEL - model was already created once when the webcam was started
        const model_input = new ort.Tensor(Float32Array.from(input), [1, 3, IMG_WIDTH, IMG_HEIGHT]);

        const model_output = await MODEL.run({images: model_input});

        const output = model_output["output0"].data;
        // END RUN MODEL
        
        // POST PROCESS
        let results: any[] = [];
        for ( let i = 0; i < OUTPUT_TENSOR_SIZE; i++ ) {
          const [class_id, prob] = [...Array(NUM_CLASSES).keys()]
                .map(col => [col, output[OUTPUT_TENSOR_SIZE*(col+4)+i]])
                .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
          
          if ( Number(prob) < 0.5 ) {
            continue;
          }
          const label = yolo_classes[ Number(class_id) ];
          results.push([label, prob])
        }

        results = results.sort((res1, res2) => res2[1]-res1[1]) // sort by probability
        //console.timeEnd('pass through model')
        console.log(results) // if no objects are detected, result.length == 0
        return results;
        // END POST PROCESS
      }
    }
  } else {
    console.error('Webcam reference not available');
    // Add appropriate error handling or user feedback here
  }
};
