
// extId ???
const extId = "stopNaviByRegEx";	
const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?

function log(level, msg) {
	level = level.trim().toLowerCase();
	if (['error','warn'].includes(level)
		|| ( temporary && ['debug','info','log'].includes(level))
	) {
		console[level](extId + '::' + level.toUpperCase() + '::' + msg);
	}
};

async function matches(tabUrl) {
	const selectors = await ((async () => {
		try {
			const tmp = await browser.storage.local.get('selectors');
			if(typeof tmp['selectors'] !== 'undefined') {
				return tmp['selectors'];
			}
		}catch(e){
		}
		return [];
	})());

	for(const selector of selectors) {

		// check activ
		if(typeof selector.activ === 'boolean') { 
			if(selector.activ === true) { 

				// check url regex 
				if(typeof selector.url_regex === 'string') { 
					selector.url_regex = selector.url_regex.trim();
					if(selector.url_regex !== ''){ 

						if((new RegExp(selector.url_regex)).test(tabUrl) ){
							//return {cancel: true};
							return selector.url_regex;
						}
					}
				}
			}
		}
	}
	return null;
}

let taburls = {};

async function onBeforeRequest(details) {
	//if(details.frameId !== 0) { return;} // not required because main_frame used in filter

	//if(typeof details.url !== 'string') {return;}
	const match = await matches(details.url);
	if(match !== null) {
		browser.notifications.create(extId, {
			"type": "basic",
			"iconUrl": browser.runtime.getURL("icon.png"),
			"title": 'Stopped Navigation', 
			"message":  'RegularExpression: ' + match + '\n matched with target url: ' + details.url
		});
		return {cancel: true};
	}
	taburls[details.tabId] = details.url;
}

browser.webRequest.onBeforeRequest.addListener(
  onBeforeRequest,
  {urls: ['<all_urls>'], types: ['main_frame'] },
  ["blocking"]
);

async function onHistoryStateUpdated(details) {

	if(taburls[details.tabId] !== details.url){
		const match = await matches(details.url);
		if( match !== null) {

			// mmmh, ... surely not the best idea ... but it kind of works  
			await browser.tabs.executeScript(details.tabId, {code: `window.history.go(-1);`});

			browser.notifications.create(extId, {
				"type": "basic",
				"iconUrl": browser.runtime.getURL("icon.png"),
				"title": 'Stopped Navigation', 
				"message":  'RegularExpression: ' + match + '\n matched with target url: ' + details.url
			});
		}
	}
}

function onRemoved(tabId, removeInfo) {
	if(typeof taburls[tabId] !== 'undefined'){
		//log('debug', 'cleanup ' + tabId);
		delete taburls[tabId];
	}
}

browser.webNavigation.onHistoryStateUpdated.addListener(onHistoryStateUpdated);
browser.tabs.onRemoved.addListener(onRemoved);

