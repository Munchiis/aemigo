async function initShortcuts() {
    try {
        const response = await fetch(chrome.runtime.getURL('src/sites.json'));
        const data = await response.json();
        const shortcutsMap = {};

        chrome.storage.local.set({ sitesMap: data });
        data.shortcuts.forEach((category) => {
            const categoryGroup = [];
            for (const path of category.paths) {
                const pathObj = { ...path };
                categoryGroup.push(pathObj);
            }
            shortcutsMap[category.category] = categoryGroup;
        });

        for (const [shortcut, value] of Object.entries(shortcutsMap)) {
            console.log(shortcut, value);
            const html = `
            <div class="Shortcut__section">
                <div class="Shortcut__category">
                    <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="12px" viewBox="0 0 554.472 554.472" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M342.097,59.144c-5.389-5.389-9.758-3.58-9.758,4.042v57.164c0,7.623-5.695,7.023-12.87,9.596 c-47.522,17.023-215.327,65.108-311.756-63.18c-4.581-6.092-8.002-5.08-7.693,2.537c7.02,174.224,142.743,346.714,315.465,355.26 c7.613,0.377,16.854-2.659,16.854,4.964v61.76c0,7.622,4.369,9.431,9.758,4.042l208.334-208.334 c5.389-5.389,5.389-14.128,0-19.517L342.097,59.144z"></path> </g> </g> </g></svg>
                    <h3 class="Shortcut__title">${shortcut}</h3>
                </div>
                <div class="Shortcut__pathContainer">
                    ${value
                        .map(
                            (path) => `
                        <div class="Shortcut__pathItem">
                            <a data-href="${path.url}" class="path-link">
                                <div class="path-title"> - ${path.title}</div>
                            </a>
                        </div>
                    `
                        )
                        .join('')}
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
});
chrome.runtime.onStartup.addListener(() => {
    initShortcuts();
});
