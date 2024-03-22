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

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [outputArray, setOutputArray] = useState< number[]| null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const webcamRef = createRef<Webcam>();

  ort.env.wasm.numThreads = 1;
  
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0].id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { useEffect: true }, function(response) {
          console.log('Response from content.js:', response);
          if (response && response.webCamState !== undefined) {
            setWebCamState(response.webCamState);
          }
        });
      }
    });
  }, []);
  const handleOnCapture = () => {
    if (webcamRef.current) {
      const capturedImageSrc = webcamRef.current.getScreenshot({width: 150, height: 150});

      // Convert base64 image to grayscale
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const image = new Image();
      if (capturedImageSrc != null){
        image.src = capturedImageSrc;
        image.onload = async () => {
          const session = await ort.InferenceSession.create('./mvp_model.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all'});
          if (context) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.filter = 'grayscale(100%)';
            context.drawImage(image, 0, 0);
            // console.log(canvas.toDataURL());
            setImageSrc(canvas.toDataURL());
            
            // Convert base64 image to tensor
            const imageData = context.getImageData(0, 0, 150, 150);
            const tensor = imageDataToTensor(imageData, [1, 3, 150, 150]);
            const input = { 'input.1': tensor };
            console.time('inference');
            const output = await session.run(input);
            console.timeEnd('inference');
            const outputNames = session.outputNames;
            const confidenceIntervals = output[outputNames[0]].data as any as number[];
            // console.log(confidenceIntervals[0]);
            // console.log(confidenceIntervals[1]);
            // console.log(confidenceIntervals[2]);
            const probabilities = softmax(confidenceIntervals);
            console.log(probabilities);

            setOutputArray(probabilities);
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
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0].id !== undefined) {
          chrome.tabs.sendMessage(tabs[0].id , { webCamState : !webCamState });
        }
        });
        // toggleCamera(setStream, webCamState, stream);
      }}>
      {webCamState ? 'Stop' : 'Start'} Webcam
    </button>
    <br />
    <button 
      className="block w-full py-2.5 px-5 mb-4 text-center text-white bg-blue-500 border border-blue-700 rounded-lg font-bold hover:bg-blue-700 focus:outline-none"
      onClick={() => {
        if (webCamState) {
          setFrameCapture(true);
          handleOnCapture();
        } else {
          setFrameCapture(false);
        }
      }}>
      {(frameCapture && !webCamState) ? 'Stop' : 'Start'} Frame Capture
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
        <p>Probability of A: {outputArray[0]}</p>
        <p>Probability of B: {outputArray[1]}</p>
        <p>Probability of C: {outputArray[2]}</p>
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

function imageDataToTensor(image: ImageData, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.data;
  const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    redArray.push(imageBufferData[i]);
    greenArray.push(imageBufferData[i + 1]);
    blueArray.push(imageBufferData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);

  // 4. convert to float32
  let i, l = transposedData.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (i = 0; i < l; i++) {
    float32Data[i] = transposedData[i] / 255.0; // convert to float
  }
  // 5. create the tensor object from onnxruntime-web.
  const inputTensor = new Tensor("float32", float32Data, dims);
  return inputTensor;
}

function softmax(resultArray: number[]) : number[] {
  // Get the largest value in the array.
  const largestNumber = Math.max(...resultArray);
  // Apply exponential function to each result item subtracted by the largest number, use reduce to get the previous result number and the current number to sum all the exponentials results.
  const sumOfExp = resultArray.map((resultItem) => Math.exp(resultItem - largestNumber)).reduce((prevNumber, currentNumber) => prevNumber + currentNumber);
  //Normalizes the resultArray by dividing by the sum of all exponentials; this normalization ensures that the sum of the components of the output vector is 1.
  return resultArray.map((resultValue, index) => {
      return Math.exp(resultValue - largestNumber) / sumOfExp;
  });
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
