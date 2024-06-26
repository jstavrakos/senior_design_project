chrome.runtime.onInstalled.addListener(() => {
    console.log("installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log("Message received", request);
    if (request.message === "apiActions" && request.action !== undefined) {
        perform_action(request.action, request.link);
    }
});

function perform_action(action: number, link: string) {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (currentTab) => {
        
        const currentIndex = tabs.findIndex((tab) => tab.id === currentTab[0].id);
        // const currentIndex = getCurrentTab();
  
        console.log('action:', action);
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
          case 8: { // open gmail
            chrome.tabs.create({ active : true, url: "https://mail.google.com/mail/u/0/#inbox" });
            break; 
          }
          case 9: { // open link
            console.log(link); 
            chrome.tabs.create({ active : true, url: link });
            break;
          }
        }
      });
    });
  }