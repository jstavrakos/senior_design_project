import React, { useState, useRef, useEffect, RefObject, createRef } from 'react';
import Webcam from "react-webcam";
import * as Jimp from 'jimp'
import * as ort from 'onnxruntime-web';
import { Tensor } from 'onnxruntime-web';

// Interface for video constraints with type safety
interface VideoConstraints {
  width: number;
  height: number;
  facingMode: FacingMode;
}

// Enum for facingMode property, ensuring correct values
enum FacingMode {
  USER = 'user',
  ENVIRONMENT = 'environment',
}

const videoConstraints: VideoConstraints = {
  width: 150,
  height: 150,
  facingMode: FacingMode.USER,
}

// Webcam Time Interval
const WEBCAM_INTERVAL = 1000;

// Constants for model input
const IMG_HEIGHT = 480;
const IMG_WIDTH = 480;

// Constants for the model
const NUM_CLASSES = 80;
const OUTPUT_TENSOR_SIZE = 4725;

// Class Labels
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

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [outputArray, setOutputArray] = useState< number[]| null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const webcamRef = createRef<Webcam>();
  const frameCaptureInterval = useRef<NodeJS.Timeout | null>(null);

  ort.env.wasm.numThreads = 1;


  useEffect(() => {
    setupOffscreenDocument('off_screen.html');
    chrome.runtime.sendMessage({ useEffect: true }, function(response) {
      console.log('Response from off_screen.js:', response);
      if (response && response.webCamState !== undefined) {
        setWebCamState(response.webCamState);
      }
    });
  }, []);

  // Start/stop the interval when frameCapture or webcamRef.current changes
  useEffect(() => {
    console.log('frameCapture: ', frameCapture);
    console.log('webcamref: ', webcamRef.current);
    if (webCamState && frameCapture && webcamRef.current) {
      frameCaptureInterval.current = setInterval(() => {
        if (webcamRef.current){
          console.log('webcamref: in interval', webcamRef);
          handleOnCapture(webcamRef.current);
        }
      }, WEBCAM_INTERVAL);
    }
    return () => {
      if (frameCaptureInterval.current) {
        clearInterval(frameCaptureInterval.current);
      }
    };
  }, [webCamState, frameCapture, webcamRef]);

  const handleOnCapture = (currWebCam: Webcam) => {
    if (currWebCam) {
      const capturedImageSrc = currWebCam.getScreenshot({width: 150, height: 150});

      const image = new Image();
      if (capturedImageSrc != null){
        image.src = capturedImageSrc;

        image.onload = async () => {
          // Load the webcam image from our canvas to process
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = IMG_WIDTH;
            canvas.height = IMG_HEIGHT;
            context.drawImage(image, 0, 0, IMG_WIDTH, IMG_HEIGHT);
            setImageSrc(canvas.toDataURL());
            
            // PRE PROCESS
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

            // CREATE AND RUN MODEL
            const model = await ort.InferenceSession.create('./yolov8n.onnx', { 
              executionProviders: ['wasm'], 
              graphOptimizationLevel: 'all'
            });

            const model_input = new ort.Tensor(Float32Array.from(input), [1, 3, IMG_WIDTH, IMG_HEIGHT]);
            const model_output = await model.run({images: model_input});
            const output = model_output["output0"].data;
            // END CREATE AND RUN MODEL
            
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
            console.log(results) // if no objects are detected, result.length == 0
            setOutputArray(results)
            // END POST PROCESS
          }
        };
      }
    } else {
      console.error('Webcam reference not available');
      // Add appropriate error handling or user feedback here
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6 bg-gray-100 rounded-lg shadow-md">
    <h1 className="text-3xl font-semibold text-center mb-6">Welcome to the Gesture App</h1>
    <button 
      className="block w-full py-2.5 px-5 mb-4 text-center text-gray-900 bg-gray-200 border border-gray-800 rounded-lg hover:bg-gray-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium"
      onClick={() => {
        console.log('webcamState: ', webCamState);
        setWebCamState(!webCamState)

        setupOffscreenDocument('off_screen.html');
        chrome.runtime.sendMessage({
          type: 'webCamState',
          target: 'off_screen.html',
          webCamState: !webCamState
        })
      }}>
      {webCamState ? 'Stop' : 'Start'} Webcam
    </button>
    <br />
    <button 
      className="block w-full py-2.5 px-5 mb-4 text-center text-white bg-blue-500 border border-blue-700 rounded-lg font-bold hover:bg-blue-700 focus:outline-none"
      onClick={() => {
        if (webCamState && !frameCapture) {
          console.log('webcamref: not in interval', webcamRef.current);
          setFrameCapture(true); // HOOK here to start the frame capturing interval
          // handleOnCapture(webcamRef.current!);
          // chrome.runtime.sendMessage({ message: 'frameCapture', frameCapture: true });
        } else {
          setFrameCapture(false);
          // chrome.runtime.sendMessage({ message: 'frameCapture', frameCapture: false });
        }
      }}>
      {(webCamState && !frameCapture) ? 'Start' : 'Stop'} Frame Capture
    </button>
    <div className="flex items-center justify-center">
      {webCamState && <div className="mx-auto"><RenderWebcam webcamRef={webcamRef} /></div>}
      {frameCapture && imageSrc && <img className="mx-auto" src={imageSrc} alt="Captured" />}
    </div>
    <div className="flex justify-between">
      <button 
        className="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
        onClick={changeTabLeft}>
        Left
      </button>
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={changeTabRight}>
        Right
      </button>
    </div>
    {outputArray && (
      <div className="mt-4">
        <p>Highest Confidence Object Detected Class: {outputArray[0]}</p>
      </div>
    )}
  </div>  
  );
};

async function toggleCamera(setStream: (stream: MediaStream | null) => void, webCamState: boolean, stream: MediaStream | null) : Promise<void>{
  if(webCamState){
    stream?.getTracks().forEach((track: { stop: () => void; }) => {
      track.stop();
    });
    setStream(null);
  }
  else {
   setStream(await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints }));
  }
}

function changeTabLeft() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTab) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === currentTab[0].id);
      const newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (tabs[newIndex].id !== undefined) {
        chrome.tabs.update(tabs[newIndex].id!, { active: true });
      }
    });
  });
}

function changeTabRight() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTab) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === currentTab[0].id);
      const newIndex = (currentIndex + 1) % tabs.length;
      if (tabs[newIndex].id !== undefined) {
        chrome.tabs.update(tabs[newIndex].id!, { active: true });
      }
    });
  });
}

function RenderWebcam(props: { webcamRef: RefObject<Webcam> }) {
  return (
    <div>
      <Webcam
        audio={false}
        minScreenshotHeight={150}
        minScreenshotWidth={150}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        ref={props.webcamRef}
      />
    </div>
  );
}

let creating: (Promise<void>) | null; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'get user media for gesture recognition',
    });
    await creating;
    creating = null;
  }
}