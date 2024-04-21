import { useState, useEffect, RefObject, createRef, JSXElementConstructor, Key, ReactElement, ReactNode } from 'react';
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
  const [mappings, setMappings] = useState({A1 : '', A2: '', A3: '', A4: '', A5: ''});
  const [outputArray, setOutputArray] = useState< number[]| null>(null);
  const webcamRef = createRef<Webcam>();
  const APIactions = ['1', '2', '3', '4', '5'];

  // Update the webcam state and frame capture state from the background script
  useEffect(() => {
    setupOffscreenDocument('off_screen.html');
    chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
      console.log('Response from off_screen.js:', response);
      if (response && response.webCamState !== undefined) {
        setWebCamState(response.webCamState);
      }
      if (response && response.mappings !== undefined) {
        console.log('Mappings:', response.mappings);
        setMappings(response.mappings);
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
      <ActionAPIMapper
        initMapping={mappings}
        APIactions={APIactions}
      />
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
        
        // chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        //   if (tabs[0].id !== undefined) {
        //   chrome.tabs.sendMessage(tabs[0].id , { webCamState : !webCamState });
        // }
        // });
        // toggleCamera(setStream, webCamState, stream);
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
        onClick={() => perform_action(0)}>
        Left
      </button>
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => perform_action(1)}>
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

function perform_action(action: number) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTab) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === currentTab[0].id);

      switch (action) {
        case 0: { // switch tab left
          const newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          if (tabs[newIndex].id !== undefined) {
            chrome.tabs.update(tabs[newIndex].id!, { active: true });
          }
          break; 
        }
        case 1: { // switch tab right
          const newIndex = (currentIndex + 1) % tabs.length;
          if (tabs[newIndex].id !== undefined) {
            chrome.tabs.update(tabs[newIndex].id!, { active: true });
          } 
          break; 
        }
        case 2: { // go backwards in tab history
          if (tabs[currentIndex].id !== undefined) {
            chrome.tabs.goBack(tabs[currentIndex].id!);
          }
          break; 
        }
        case 3: { // go forwards in tab history
          if (tabs[currentIndex].id !== undefined) {
            chrome.tabs.goForward(tabs[currentIndex].id!);
          }
          break; 
        }
        case 4: { // refresh tab
          if (tabs[currentIndex].id !== undefined) {
            chrome.tabs.reload(tabs[currentIndex].id!);
          }
          break
        }
        case 5: { // toggle tab mute status
          if (tabs[currentIndex].id !== undefined) {
            if (tabs[currentIndex].mutedInfo!.muted) {
              chrome.tabs.update(tabs[currentIndex].id!, { muted: false });
            } else {
              chrome.tabs.update(tabs[currentIndex].id!, { muted: true });
            }
          }
          break; 
        }
        case 6: { // create new tab
          chrome.tabs.create({ active : true });
          break; 
        }
        case 7: { // remove current tab
          const newIndex = (currentIndex + 1) % tabs.length;
          if (tabs[newIndex].id !== undefined) {
            chrome.tabs.update(tabs[newIndex].id!, { active: true });
            chrome.tabs.remove(tabs[currentIndex].id!); 
          }
          break; 
        }
      }
    });
  });
}

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

const ActionAPIMapper = ({ initMapping, APIactions }: any) => {
  const [mapping, setMapping] = useState(initMapping);

  useEffect(() => {
    chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
      if (response && response.mappings !== undefined) {
        console.log('Mappings:', response.mappings);
        setMapping(response.mappings);
      }
    });
  }, []);

  const handleMappingChange = (action: any, api: any) => {
    chrome.runtime.sendMessage({ message: 'updateMapping', action, api });
    setMapping((prevMapping: any) => ({
      ...prevMapping,
      [action]: api,
    }));
  };

  return (
    <div>
      <h2>Actions to APIs Mapper</h2>
      <div>
        {Object.entries(mapping).map(([action, api]) => (
          <div key={action}>
            <label htmlFor={action}>{action}</label>
            <select
              id={action}
              value={String(api)}
              onChange={(e) => handleMappingChange(action, e.target.value)}
            >
              <option value="">Select API</option>
              {APIactions.map((apiAction: any) => (
                <option key={apiAction} value={apiAction}>{apiAction}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div>
        <h3>Current Mapping</h3>
        <pre>{JSON.stringify(mapping, null, 2)}</pre>
      </div>
    </div>
  );
};

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
