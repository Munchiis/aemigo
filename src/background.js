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

        chrome.storage.local.set({ 'sitesMap': data });
        data.shortcuts.forEach(category => {
            const categoryGroup = []
            for (const path of category.paths) {
                const pathObj = { ...path };
                categoryGroup.push(pathObj);
            }
            shortcutsMap[category.category] = categoryGroup
        });

        for (const [shortcut, value] of Object.entries(shortcutsMap)) {
            console.log(shortcut, value)
            const html = `
            <div class="category-section">
                <h2 class="category-title">${shortcut}</h2>
                <div class="paths-container">
                    ${value.map(path => `
                        <div class="path-item">
                            <a data-href="${path.url}" class="path-link">
                                <div class="path-title">${path.title}</div>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>`;

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
