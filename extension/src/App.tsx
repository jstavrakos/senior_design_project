import { useState, useEffect, RefObject, createRef, useRef } from 'react';
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
  const [mappings, setMappings] = useState({1 : '', 2: '', 3: '', 4: '', 5: ''});
  const webcamRef = createRef<Webcam>();
  const APIactions = ['switchTabLeft', 'switchTabRight', 'goBack', 'goForward', 'refreshTab', 'toggleMute', 'createNewTab', 'removeCurrentTab'];

  // Update the webcam state and frame capture state from the background script
  const retryCountRef = useRef(0); // Use a ref to keep track of retry count
  const maxRetries = 3; // Maximum number of retries
  const retryDelay = 2000; // Delay between retries in milliseconds

  useEffect(() => {
    function sendMessage() {
      setupOffscreenDocument('off_screen.html');
      chrome.runtime.sendMessage({ message: 'useEffect'}, function(response) {
        if (chrome.runtime.lastError) {
          if (retryCountRef.current < maxRetries) {
            console.log(`Retrying message... Attempt ${retryCountRef.current + 1}`);
            setTimeout(sendMessage, retryDelay);
            retryCountRef.current += 1;
          } else {
            console.error("Failed to send message after retries:", chrome.runtime.lastError);
          }
          return;
        }

        retryCountRef.current = 0; // Reset retry count on successful communication
        if (response) {
          console.log('Response from off_screen.js:', response);
          if (response.webCamState !== undefined) {
            setWebCamState(response.webCamState);
          }
          if (response.mappings !== undefined) {
            setMappings(response.mappings);
          }
        }
      });
    }

    sendMessage(); // Initial call to the function

    return () => {
      retryCountRef.current = 0; // Reset on component unmount
    };
  }, []);
  const toggleWebCam = () => {
    const newWebCamState = !webCamState;
    setWebCamState(newWebCamState);
    chrome.runtime.sendMessage({ message: 'webCamState', webCamState: newWebCamState });
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">Gesture Recognition</h1>
      <button 
        className={`w-full p-2.5 text-lg font-medium text-center rounded-md transition-colors ${
          webCamState ? 'bg-red-500 hover:bg-red-700 text-white' : 'bg-blue-500 hover:bg-blue-700 text-white'
        } focus:outline-none focus:ring-4 focus:ring-blue-300`}
        onClick={toggleWebCam}>
        {webCamState ? 'Stop' : 'Start'} Webcam
      </button>
      <div className="my-4">
        {webCamState && 
        <div className="flex justify-center">
          <Webcam ref={webcamRef} audio={false} videoConstraints={videoConstraints} className="rounded-lg" />
        </div>}
      </div>
      <ActionAPIMapper
        initMapping={mappings}
        APIactions={APIactions}
      />
  </div>  
  );
};

const ActionAPIMapper = ({ initMapping, APIactions }: any) => {
  const [mapping, setMapping] = useState(initMapping);

  const fetchRetryCountRef = useRef(0); // Ref to track retry counts for fetching
  const maxFetchRetries = 3; // Maximum number of retries for fetching mappings
  const fetchRetryDelay = 2000; // Delay between retries in milliseconds for fetching

  // Function to fetch mappings with retry
  const fetchMappings = () => {
    chrome.runtime.sendMessage({ message: 'useEffect' }, function (response) {
      if (chrome.runtime.lastError) {
        if (fetchRetryCountRef.current < maxFetchRetries) {
          console.log(`Retrying fetch... Attempt ${fetchRetryCountRef.current + 1}`);
          setTimeout(fetchMappings, fetchRetryDelay);
          fetchRetryCountRef.current += 1;
        } else {
          console.error("Failed to fetch mappings after retries:", chrome.runtime.lastError);
        }
        return;
      }

      fetchRetryCountRef.current = 0; // Reset retry count on success
      if (response && response.mappings !== undefined) {
        console.log('Mappings:', response.mappings);
        setMapping(response.mappings);
      }
    });
  };

  useEffect(() => {
    fetchMappings(); // Initial call to fetch mappings
    return () => {
      fetchRetryCountRef.current = 0; // Clean up on unmount
    };
  }, []);
  const handleMappingChange = (action: any, api: any) => {
    chrome.runtime.sendMessage({ message: 'updateMapping', action, api });
    setMapping((prevMapping: any) => ({
      ...prevMapping,
      [action]: api,
    }));
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-inner mt-4">
      <h2 className="text-xl font-semibold mb-3">Actions to APIs Mapper</h2>
      <div>
        {Object.entries(mapping).map(([action, api]) => (
          <div key={action} className="mb-2">
          <label htmlFor={action} className="block text-sm font-medium text-gray-700">{action}</label>
            <select
              id={action}
              value={String(api)}
              onChange={(e) => handleMappingChange(action, e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select action</option>
              {APIactions.map((apiAction: any) => (
                <option key={apiAction} value={apiAction}>{apiAction}</option>
              ))}
            </select>
          </div>
        ))}
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

