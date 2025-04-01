//

//look for chrome.storage.local whatever local sites.json is
//we need to parse sites.json
//create all the potential elements based on this sites.json
//

async function initShortcuts() {
    try {
        const response = await fetch(chrome.runtime.getURL('src/sites.json'));
        const data = await response.json();
        const shortcutsMap = {};

        chrome.storage.local.set({ 'sitesMap': data }, () => {
            //stores within its own extension local storage
        });
        data.shortcuts.forEach(category => {
            const categoryGroup = []
            for (const path of category.paths) {
                const pathObj = { ...path };
                categoryGroup.push(pathObj);
            }
            shortcutsMap[category.category] = categoryGroup
        });

        //iterate through values of shortcuts map
        for (const [shortcut, value] of Object.entries(shortcutsMap)) {
            //shortcut is an object so just grab
            const html = `
            <div class="title">
            <ul>${value.map(path => `<li><a href="${path.url}">${path.title}</a></li>`).join('')}</ul>
            </div>
            `
            chrome.storage.local.set({ [`shortcut_${shortcut}`]: html });
        }

    } catch (error) {
        console.error(error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    initShortcuts();
})
chrome.runtime.onStartup.addListener(() => {
    initShortcuts();
})