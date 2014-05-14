var Privoxy = {
	status: {
		fetch: function(callback) {
			Privoxy.log("Fetching Privoxy Status...");
			var XHR = new XMLHttpRequest();
			XHR.onreadystatechange = function() {
				if (XHR.readyState == 4) {
					callback(Privoxy.status.parse(XHR.responseText));
				}
			};
			XHR.open("GET", "http://config.privoxy.org/toggle?mini=y", true);
			XHR.send();
		},
		parse: function(page) {
			if (/enabled/.test(page)) {
				return true;
			}
			return false;
		},
		update: function() {
			Privoxy.log("Updating Privoxy Status...");
			Privoxy.status.fetch(function(status) {
				if (status) {
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
			chrome.browserAction.setIcon({ path: 'icons/privoxy-enabled.png' });
			chrome.browserAction.setTitle({ title: "Disable Privoxy" });
		},
		disabled: function() {
			Privoxy.log("Privoxy DISABLED");
			chrome.browserAction.setIcon({ path: 'icons/privoxy-disabled.png' });
			chrome.browserAction.setTitle({ title: "Enable Privoxy" });
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
	if (message == 'Privoxy Enabled') {
		Privoxy.icon.enabled();
	}
	if (message == 'Privoxy Disabled') {
		Privoxy.icon.disabled();
	}
	if (message == "Update Privoxy Status") {
		Privoxy.status.update();
	}
});

// Update status on a timer
chrome.alarms.create("Update Privoxy Status", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(Privoxy.status.update);

// Update status at launch
Privoxy.status.update();

// Handle clicks on browser icon
//chrome.browserAction.onClicked.addListener(Privoxy.toggle);
chrome.browserAction.setPopup({popup: "popup.html"});
