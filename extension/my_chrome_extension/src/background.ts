// SERVICE WORKER - DOESN'T DO MUCH RIGHT NOW
const videoConstraints = {
    width: 150,
    height: 150,
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("installed");
});

// setInterval(() => {
//     console.log("ping from background");
// }, 5000);
