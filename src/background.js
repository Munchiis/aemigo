//

//look for chrome.storage.local whatever local sites.json is
//we need to parse sites.json
//create all the potential elements based on this sites.json
//

async function initialInstall() {
    try {
        const response = await fetch(chrome.runtime.getURL('src/sites.json'));
        const data = await response.json();
        const shortcutsMap = {};
        chrome.storage.local.set({ 'sitesData': data }, () => {
            console.log('sitesData', data);
            //stores within its own extension local storage
        });
        data.shortcuts.forEach(element => {
            //generate the html for each shortcut button
        });
        chrome.storage.local.set(shortcutsMap, () => {
            //shortcuts html stored
        });
    } catch (error) {
        console.error(error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    initialInstall();
})