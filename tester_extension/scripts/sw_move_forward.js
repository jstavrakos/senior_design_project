// script to change tabs forward on click of icon
chrome.action.onClicked.addListener((tab) => {
  chrome.windows.getLastFocused(
    {populate: true}, 
    function(window) {
      var n = window.tabs.length; 

      for (var i = 0; i < n; i++) {
        if (window.tabs[i].active) {
          if (i == n - 1) {
            chrome.tabs.update(window.tabs[0].id, { active: true }); 
          } else {
            chrome.tabs.update(window.tabs[i + 1].id, { active: true }); 
          }

          return; 
        } 
      }
    }
  );
});