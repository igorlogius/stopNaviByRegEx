
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

async function onBeforeRequest(details) {
	//if(details.frameId !== 0) { return;} // not required because main_frame used in filter

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

						if((new RegExp(selector.url_regex)).test(details.url) ){
							browser.notifications.create(extId, {
								"type": "basic",
								"iconUrl": browser.runtime.getURL("icon.png"),
								"title": 'Stopped Navigation', 
								"message":  'RegularExpression: ' + selector.url_regex + '\n matched with target url: ' + details.url
							});
							return {cancel: true};
						}
					}
				}
			}
		}
	}
}

browser.webRequest.onBeforeRequest.addListener(
  onBeforeRequest,
  {urls: ['<all_urls>'], types: ['main_frame'] },
  ["blocking"]
);

