var Privoxy = {
	status: {
		fetch: function(callback) {
			Privoxy.log("Fetching Privoxy Status...");
			var XHR = new XMLHttpRequest();
			XHR.onreadystatechange = function() {
				if (XHR.readyState == 4) {
					// Proxy isn't enabled
					if (XHR.status === 0) {
						callback(-3);
						return;
					}
					// Proxy failed
					if (XHR.status != 200) {
						callback(-2);
						return;
					}
					callback(Privoxy.status.parse(XHR.responseText));
				}
			};
			XHR.open("GET", "http://config.privoxy.org/toggle?mini=y&t=" + Date.now(), true);
			XHR.send();
		},
		parse: function(page) {
			if (/is not being used/.test(page)) {
				return -3;
			}
			if (/Privoxy Configuration access denied/.test(page)) {
				return -1;				
			}
			if (/enabled/.test(page)) {
				return true;
			}
			return false;
		},
		update: function() {
			Privoxy.log("Updating Privoxy Status...");
			Privoxy.status.fetch(function(status) {
				if (status === -3) {
					chrome.runtime.sendMessage("Privoxy Not Enabled");
					return false;
				}
				if (status === -2) {
					chrome.runtime.sendMessage("Privoxy Network Error");
					return false;
				}
				if (status === -1) {
					chrome.runtime.sendMessage("Privoxy Access Error");
					return false;
				}
				if (status === true) {
					chrome.runtime.sendMessage("Privoxy Enabled");
					return true;
				}
				chrome.runtime.sendMessage("Privoxy Disabled");
				return false;
			});
		}
	},
	/**
	 * Toggling via script does not work yet.  Privoxy refuses to accept the command
	 * and I can't figure out why or how to fix it.
	 */
	toggle: function() {
		var toggle = 'enable';
		Privoxy.status.fetch(function(status) {
			Privoxy.log("[TOGGLE] " + (status ? "Privoxy is enabled." : "Privoxy is diabled."));
			if (status) {
				toggle = "disable";
			}
			Privoxy.log("[TOGGLE] Setting Privoxy: " + toggle);
			var XHR = new XMLHttpRequest();
			XHR.onreadystatechange = function() {
				if (XHR.readyState == 4) {
					Privoxy.status.update();
				}
			};
			XHR.open("GET", "http://config.privoxy.org/toggle?mini=y&set=" + toggle, true);
			XHR.send();
		});
	},
	icon: {
		enabled: function() {
			Privoxy.log("Privoxy Enabled");
			chrome.browserAction.setIcon({ path: 'icons/48/privoxy-enabled.png' });
			chrome.browserAction.setTitle({ title: "Disable Privoxy" });
		},
		disabled: function() {
			Privoxy.log("Privoxy DISABLED");
			chrome.browserAction.setIcon({ path: 'icons/48/privoxy-disabled.png' });
			chrome.browserAction.setTitle({ title: "Enable Privoxy" });
		},
		error: function() {
			Privoxy.log("Privoxy ERROR");
			chrome.browserAction.setIcon({ path: 'icons/48/privoxy-error.png' });
			chrome.browserAction.setTitle({ title: "Error!" });
		}
	},
	log: function() {
		var bgp = chrome.extension.getBackgroundPage();
		bgp.console.log.apply(bgp.console, arguments);
	}
};


/**
 * Handle internal messages
 */
chrome.runtime.onMessage.addListener(function(message, sender, responseCallback) {
	switch(message) {
		case "Privoxy Not Enabled":
			Privoxy.icon.error();
			chrome.browserAction.setPopup({ popup: "error-notfound.html" });
			break;
		case "Privoxy Network Error":
			Privoxy.icon.error();
			chrome.browserAction.setPopup({ popup: "error-network.html" });
			break;
		case "Privoxy Access Error":
			Privoxy.icon.error();
			chrome.browserAction.setPopup({ popup: "error-access.html" });
			break;
		case "Privoxy Enabled":
			Privoxy.icon.enabled();
			break;
		case "Privoxy Disabled":
			Privoxy.icon.disabled();
			break;
		case "Update Privoxy Status":
			Privoxy.status.update();
			break;
	}
});

// Update status on a timer
chrome.alarms.create("Update Privoxy Status", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(Privoxy.status.update);

// Handle clicks on browser icon
//chrome.browserAction.onClicked.addListener(Privoxy.toggle);
chrome.browserAction.setPopup({popup: "popup.html"});

// Update status at launch
Privoxy.status.update();

