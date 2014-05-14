var iframe = document.getElementById('ijbstatus');
iframe.addEventListener('load', function() {
	chrome.runtime.sendMessage("Update Privoxy Status");
});
