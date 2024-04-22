import * as ort from 'onnxruntime-web';

// Global variable and function for the model which will only be loaded once
let MODEL: ort.InferenceSession;

// Listen for messages from the Chrome runtime
var webCamState = false;
// let [webCamState, setWebCamState] = useState(false);

// Webcam Time Interval
const WEBCAM_INTERVAL = 300;

// Constants for model input
const IMG_HEIGHT = 480;
const IMG_WIDTH = 480;

// Constants for the model
const NUM_CLASSES = 5;
const OUTPUT_TENSOR_SIZE = 4725;
const CONFIDENCE_BOUND = 0.1;

// Class Labels
const yolo_classes = [
  '1', '2', '3', '4', '5'
];

ort.env.wasm.numThreads = 1;

var frameCaptureInterval: any = null;
var popupWindow: boolean = false;

// Mapping for the inferece events
var mapping: any = {1 : '', 2: '', 3: '', 4: '', 5: ''};

// Load the model when the off-screen script is loaded
loadModel();
// Define variables to keep track of the last result and its repeat count
let lastResult: any = null;
let repeatCount = 0;
const repeatThreshold = 5;  // Set this to the number of consecutive matches required

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('off_screen.ts message: ', message);
  if (message.message !== undefined) {
    if (message.message === 'useEffect') {
      const response = { webCamState: webCamState, mappings: mapping };
      sendResponse(response);
    }
    
    if (message.message === 'webCamState') {
      webCamState = message.webCamState;
      if (webCamState) {
        startWebcam();
        console.log('webcam started');
        frameCaptureInterval = setInterval(() => {
          if (videoElement && MODEL) {
            handleOnCapture().then((results) => {
              let response = { message: 'frameCaptureState', results: null };
              if (results && results.length !== 0) {
                response.results = results;
                // Check if the current result matches the last result
                if (results[0][0] === lastResult) {
                  repeatCount++;
                } else {
                  repeatCount = 1;
                  lastResult = results[0][0];
                }
                
                // Only send the message if the result is stable
                if (repeatCount >= repeatThreshold) {
                  chrome.runtime.sendMessage({ message: 'apiActions', action: parseMap(mapping[results[0][0]]) });
                  repeatCount = 0;
                }
                
                if (popupWindow) {
                  chrome.runtime.sendMessage(response).catch((error) => {
                    console.error(error);
                    popupWindow = false;
                  });
                }
              }
            }).catch((error) => {
              console.error(error);
            });
          }
        }, WEBCAM_INTERVAL);
      } else {
        stopWebcam();
        clearInterval(frameCaptureInterval);
      }
    }

    if (message.message === 'updateMapping') {
      mapping[message.action] = message.api;
    }
  }
});


let videoElement: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
  
function startWebcam() {
  if(stream == null){
    
    console.log('Starting webcam');
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
        
        // Adjust the size as needed
        videoElement.style.width = '150';
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
       ort.InferenceSession.create('./custom.onnx', {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        }).then((model) => {
            MODEL = model;
        });
}

async function handleOnCapture (): Promise<any> {
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
      let highest_probabilities: { [key: string]: number } = {};
      for ( let i = 0; i < OUTPUT_TENSOR_SIZE; i++ ) {
        const [class_id, prob] = [...Array(NUM_CLASSES).keys()]
              .map(col => [col, output[OUTPUT_TENSOR_SIZE*(col+4)+i]])
              .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
        
        if ( Number(prob) < CONFIDENCE_BOUND ) {
          continue;
        }
        const label = yolo_classes[ Number(class_id) ];
        // only return the highest confidence detection for each class
        if( !(label in highest_probabilities) || Number(prob) > highest_probabilities[label] ) {
          highest_probabilities[label] = Number(prob);
        }
      }

      let results: any[] = Object.entries(highest_probabilities);
      results = results.sort((res1, res2) => res2[1]-res1[1]) // sort by probability
      //console.timeEnd('pass through model')
      console.log(results) // if no objects are detected, result.length == 0
      return results;
      // END POST PROCESS
    }
  }
  
};

function parseMap(action: string) : Number{
  switch(action){
    case 'switchTabLeft':
      return 0;
    case 'switchTabRight':
      return 1;
    case 'goBack':
      return 2;
    case 'goForward':
      return 3;
    case 'refreshTab':
      return 4;
    case 'toggleMute':
      return 5;
    case 'createNewTab':
      return 6;
    case 'removeCurrentTab':
      return 7;
    default:
      return -1;
  }
}