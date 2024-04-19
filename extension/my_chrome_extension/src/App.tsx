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

// Constants for model input
const IMG_HEIGHT = 150;
const IMG_WIDTH = 150;

const videoConstraints: VideoConstraints = {
  height: IMG_HEIGHT,
  width: IMG_WIDTH,
  facingMode: FacingMode.USER,
}

export default function App() {
  const [webCamState, setWebCamState] = useState(false);
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
    });
  }, []);

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message !== undefined) {
      if (message.message === 'frameCaptureState') {
        setOutputArray(message.results);
      }
    }
  });


  return (
    <div className="mx-auto max-w-lg p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-semibold text-center mb-6">Gesture Recognition</h1>
      <button 
        className="block w-full py-2.5 px-5 mb-4 text-center text-gray-900 bg-gray-200 border border-gray-800 rounded-lg hover:bg-gray-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium"
        onClick={() => {
          if(webCamState){
            setWebCamState(false);
          }
          else {
            setWebCamState(true);
          }
          chrome.runtime.sendMessage({ message: 'webCamState', webCamState: !webCamState });
        }}>
        {webCamState ? 'Stop' : 'Start'} Webcam
      </button>
      <div className="flex items-center justify-center">
        {webCamState && <div className="mx-auto"><RenderWebcam webcamRef={webcamRef} /></div>}
      </div>
      {outputArray && (
        <div className="mt-4">
          <p>Highest Confidence Object Detected Class: {outputArray[0]}</p>
        </div>
      )}
  </div>  
  );
};

function RenderWebcam(props: { webcamRef: RefObject<Webcam> }) {
  return (
    <div>
      <Webcam
        audio={false}
        minScreenshotHeight={IMG_HEIGHT}
        minScreenshotWidth={IMG_WIDTH}
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