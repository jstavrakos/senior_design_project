import { useState, useEffect, RefObject, createRef } from 'react';
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
  width: 150,
  height: 150,
  facingMode: FacingMode.USER,
}

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
  const [frameCaptureState, setFrameCaptureState] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null); // Image source not displayed anymore as data is sent to off_screen.tsx
  const [outputArray, setOutputArray] = useState< number[]| null>(null);
  const webcamRef = createRef<Webcam>();

  // Update the webcam state and frame capture state from the background script
  useEffect(() => {
    setupOffscreenDocument('off_screen.html');
    chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
      console.log('Response from off_screen.js:', response);
      if (response && response.webCamState !== undefined) {
        setWebCamState(response.webCamState);
      }
      if (response && response.frameCaptureState !== undefined) {
        setFrameCaptureState(response.frameCaptureState);
      }
    });
  }, []);

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id === 'hljhapmlbiiediilmbgekaeobfplpjpc' && message.message !== undefined) {
      if (message.message === 'frameCaptureState') {
        setOutputArray(message.results);
      }
    }
  });

  return (
    <div className="mx-auto max-w-lg p-6 bg-gray-100 rounded-lg shadow-md">
    <h1 className="text-3xl font-semibold text-center mb-6">Welcome to the Gesture App</h1>
    <button 
      className="block w-full py-2.5 px-5 mb-4 text-center text-gray-900 bg-gray-200 border border-gray-800 rounded-lg hover:bg-gray-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium"
      onClick={() => {
        if(webCamState){
          setWebCamState(false);
          setFrameCaptureState(false);
          chrome.runtime.sendMessage({ message: 'frameCaptureState', frameCaptureState: false });
        }
        else {
          setWebCamState(true);
        }
        chrome.runtime.sendMessage({ message: 'webCamState', webCamState: !webCamState });
      }}>
      {webCamState ? 'Stop' : 'Start'} Webcam
    </button>
    <br />
    <button 
      className="block w-full py-2.5 px-5 mb-4 text-center text-white bg-blue-500 border border-blue-700 rounded-lg font-bold hover:bg-blue-700 focus:outline-none"
      onClick={() => {
        if (webCamState && !frameCaptureState) {
          setFrameCaptureState(true); 
          chrome.runtime.sendMessage({ message: 'frameCaptureState', frameCaptureState: true });
        } else {
          setFrameCaptureState(false);
          chrome.runtime.sendMessage({ message: 'frameCaptureState', frameCaptureState: false });
        }
      }}>
      {(frameCaptureState) ? 'Stop' : 'Start'} Frame Capture
    </button>
    <div className="flex items-center justify-center">
      {webCamState && <div className="mx-auto"><RenderWebcam webcamRef={webcamRef} /></div>}
      {frameCaptureState && imageSrc && <img className="mx-auto" src={imageSrc} alt="Captured" />}
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