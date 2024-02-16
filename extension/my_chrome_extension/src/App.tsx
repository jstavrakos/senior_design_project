import React, { useState, useRef, useEffect, RefObject, createRef } from 'react';
import Webcam from "react-webcam";

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
  width: 600,
  height: 600,
  facingMode: FacingMode.USER,
}

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [frameCapture, setFrameCapture] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const webcamRef = createRef<Webcam>();

  useEffect(() => {
    // Request permission to use the webcam
    chrome.permissions.request({ permissions: ['videoCapture'] }, (granted) => {
      if (granted) {
        // Permission granted, access the webcam
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .catch((error) => {
            console.error('Error accessing webcam:', error);
            // Add appropriate error handling or user feedback here
          });
      } else {
        // Permission denied, handle accordingly
        console.error('Permission denied to access webcam');
        // Add appropriate error handling or user feedback here
      }
    });
  }, []); // Empty dependency array to run effect only once

  const handleOnCapture = () => {
    if (webcamRef.current) {
      const capturedImageSrc = webcamRef.current.getScreenshot();
      setImageSrc(capturedImageSrc);
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
      className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        ref={props.webcamRef}
      />
    </div>
  );
}
