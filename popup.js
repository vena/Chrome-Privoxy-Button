var iframe = document.createElement('iframe');
iframe.frameborder = 0;
iframe.width = 250;
iframe.height = 64;
iframe.scrolling = "no";
iframe.src = "http://config.privoxy.org/toggle?mini=y&t=" + Date.now();
iframe.addEventListener('load', function() {
	chrome.runtime.sendMessage("Update Privoxy Status");
});

document.body.appendChild(iframe);
