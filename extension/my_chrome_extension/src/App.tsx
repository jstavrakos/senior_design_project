import React, { useState, useRef, useEffect, RefObject, createRef } from 'react';
import Webcam from "react-webcam";
import * as Jimp from 'jimp'
// use ES6 style import syntax (recommended)
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
  const webcamRef = createRef<Webcam>();
  const session = ort.InferenceSession.create('./mvp_model.onnx');

  // TODO - Permissions for the webcam don't work on initial load of the package
  // useEffect(() => {
  //   // Request permission to use the webcam
  //   chrome.permissions.request({ permissions: ['videoCapture'] }, (granted) => {
  //     if (granted) {
  //       // Permission granted, access the webcam
  //       navigator.mediaDevices
  //         .getUserMedia({ video: true, audio: false })
  //         .catch((error) => {
  //           console.error('Error accessing webcam:', error);
  //           // Add appropriate error handling or user feedback here
  //         });
  //     } else {
  //       // Permission denied, handle accordingly
  //       console.error('Permission denied to access webcam');
  //       // Add appropriate error handling or user feedback here
  //     }
  //   });
  // }, []); // Empty dependency array to run effect only once

  const handleOnCapture = () => {
    if (webcamRef.current) {
      const capturedImageSrc = webcamRef.current.getScreenshot({width: 150, height: 150});

      // Convert base64 image to grayscale
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const image = new Image();
      if (capturedImageSrc != null){
        image.src = capturedImageSrc;
        console.log(canvas.toDataURL());
        
        image.onload = () => {
          if (context) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.filter = 'grayscale(100%)';
            context.drawImage(image, 0, 0);
            
            setImageSrc(canvas.toDataURL());
          }
        };

        // Convert base64 image to tensor
        Jimp.read(capturedImageSrc, (err, image) => {
          if (err) {
            console.error('Error reading image:', err);
            // Add appropriate error handling or user feedback here
          } else {
            const inputTensor = imageDataToTensor(image, [1, 3, 150, 150]);
            session.then((session) => {
              const inputName = session.inputNames[0]; // assuming the model has at least one input
              const outputTensor = session.run({ [inputName]: inputTensor });
              console.log(outputTensor);
            });
          }
        });
      }
    } else {
      console.error('Webcam reference not available');
      // Add appropriate error handling or user feedback here
    }
  };

  return (
    <div>
      <h1>Welcome to the gesture app</h1>
      <button className='text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800'
      onClick={() => setWebCamState(!webCamState)} >
        {webCamState ? 'Stop' : 'Start'} Webcam
      </button>
      <br />
      <button 
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={() => {
        if (webCamState) {
          setFrameCapture(!frameCapture);
          handleOnCapture();
        } else {
          setFrameCapture(false);
        }
      }} >
        {frameCapture ? 'Stop' : 'Start'} Frame Capture
      </button>
      {webCamState && <RenderWebcam webcamRef={webcamRef} />}
      <br />
      {frameCapture && <p>Frame </p>}
      <br />
      {frameCapture && imageSrc && <img src={imageSrc} alt="Captured" />}
      <br />
      <div className="fixed left-0 right-0 flex justify-between">
        <button className='text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800'
         onClick={changeTabLeft}>Left</button>
        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
        onClick={changeTabRight}>Right</button>
      </div>
    </div>
  );
};

function imageDataToTensor(image: Jimp, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
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
