// Listen for messages from the Chrome runtime
var webCamState = false;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is from app.js
  console.log('off_screen.ts message: ', message);
  // console.log('sender.id: ', sender.id);
  if (sender.id === 'hljhapmlbiiediilmbgekaeobfplpjpc') {
    console.log(message);
    // Check if the message contains the webcamState property
    if (message.hasOwnProperty('webCamState')) {
      webCamState = message.webCamState;
      console.log('Toggling webcam from off_screen.ts state: ', webCamState);
      if (webCamState === true) {
        // Start the webcam
        startWebcam();
      } else {
        // Stop the webcam
        stopWebcam();
      }
    }
    if(message.hasOwnProperty('useEffect') && message.useEffect === true){
      let response = {webCamState: webCamState};
      console.log('useEffect response from off_screen: ', response);
      sendResponse(response);
    }
  }
});

let videoElement: HTMLVideoElement | null;
let stream: MediaStream | null;
  
function startWebcam() {
  if(stream !== null){
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
        videoElement.style.width = '200px'; // Adjust the size as needed
        videoElement.style.height = 'auto';

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
  console.log('stream: ', stream);
  if (stream !== null) {
    // Stop the webcam stream
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  // Remove the video element from the page
  if (videoElement) {
    videoElement.remove();
    videoElement = null;
  }
}
console.log('Hello from off_screen.tsx');

// let testElement = document.createElement('h1');
// testElement.className = 'test-element';
// testElement.innerHTML = 'Hello, world!';

// const body = document.querySelector('body');
// body?.appendChild(testElement);
