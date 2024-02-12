// script to change tabs backwards on click of icon
chrome.action.onClicked.addListener((tab) => {
  chrome.windows.getLastFocused(
    {populate: true}, 
    function(window) {
      var n = window.tabs.length; 

      for (var i = 0; i < n; i++) {
        if (window.tabs[i].active) {
          if (i == 0) {
            chrome.tabs.update(window.tabs[n - 1].id, { active: true }); 
          } else {
            chrome.tabs.update(window.tabs[i - 1].id, { active: true }); 
          }

          return; 
        }
      }
    }
  );
});