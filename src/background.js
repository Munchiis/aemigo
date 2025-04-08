let sitesMap = null;
let serverTabGroups = {};

chrome.runtime.onInstalled.addListener(async () => {
    await loadSitesData();
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    await cleanupEmptyGroups();
});

async function cleanupEmptyGroups() {
    try {
        const tabGroups = await chrome.tabGroups.query({});
        
        for (const serverTitle in serverTabGroups) {
            const groupId = serverTabGroups[serverTitle];
            if (!tabGroups.some(group => group.id === groupId)) {
                delete serverTabGroups[serverTitle];
            }
        }
    } catch (error) {
        console.error('Error cleaning up empty groups:', error);
    }
}

async function loadSitesData() {
    const data = await chrome.storage.local.get('sitesMap');
    if (data.sitesMap) {
        sitesMap = data.sitesMap;
    } else {
        try {
            const response = await fetch(chrome.runtime.getURL('src/sites.json'));
            sitesMap = await response.json();
            await chrome.storage.local.set({ sitesMap });
        } catch (error) {
            console.error('Error loading default sites.json:', error);
        }
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reloadShortcuts') {
        loadSitesData();
    } else if (message.action === 'openShortcut') {
        handleOpenShortcut(message);
    } else if (message.action === 'openQuickAction') {
        handleOpenQuickAction(message);
    } else if (message.action === 'openServerUrls') {
        handleOpenServerUrls(message);
    } else if (message.action === 'checkServerStatus') {
        checkServerStatus(message.url, message.credentials)
            .then(sendResponse)
            .catch(error => sendResponse({ isUp: false, statusCode: null, error: error.message }));
        return true;
    }
});

function handleOpenShortcut(message) {
    const { shortcutUrl, serverUrl, serverTitle, multiServer, serverSelections } = message;

    if (multiServer && serverSelections) {
        for (const serverTitle in serverSelections) {
            const envTypes = serverSelections[serverTitle];
            if (envTypes.length === 0) continue;

            const server = sitesMap.servers.find(s => s.title === serverTitle);
            if (!server) continue;

            const urls = [];
            envTypes.forEach(envType => {
                if (!server.env[envType] || server.env[envType].length === 0) return;

                server.env[envType].forEach(url => {
                    const finalUrl = `${url}${shortcutUrl}`;
                    urls.push(finalUrl);
                });
            });

            if (urls.length > 0) {
                addTabsToServerGroup(urls, serverTitle);
            }
        }
    } else {
        const finalUrl = `${serverUrl}${shortcutUrl}`;
        addTabsToServerGroup([finalUrl], serverTitle);
    }
}

function handleOpenQuickAction(message) {
    const { quickActionUrl, serverUrl, serverTitle, originalPath, multiServer, serverSelections } = message;

    if (multiServer && serverSelections) {
        for (const serverTitle in serverSelections) {
            const envTypes = serverSelections[serverTitle];
            if (envTypes.length === 0) continue;

            const server = sitesMap.servers.find(s => s.title === serverTitle);
            if (!server) continue;

            const urls = [];
            envTypes.forEach(envType => {
                if (!server.env[envType] || server.env[envType].length === 0) return;

                server.env[envType].forEach(url => {
                    const effectiveContentPath = determineContentPath(originalPath || "/");
                    const finalUrl = `${url}${quickActionUrl.replace('{path}', effectiveContentPath)}`;
                    urls.push(finalUrl);
                });
            });

            if (urls.length > 0) {
                addTabsToServerGroup(urls, serverTitle);
            }
        }
    } else {
        const effectiveContentPath = determineContentPath(originalPath || "/");
        const finalUrl = `${serverUrl}${quickActionUrl.replace('{path}', effectiveContentPath)}`;
        addTabsToServerGroup([finalUrl], serverTitle);
    }
}

function determineContentPath(originalPath) {
    console.log("Original Path:", originalPath);
    if (!originalPath || originalPath === "/" || originalPath === "") {
        return sitesMap.defaults.contentPathMapping.rootPath;
    } else {
        const pathWithoutLeadingSlash = originalPath.startsWith('/') ? originalPath.substring(1) : originalPath;
        return `${sitesMap.defaults.contentPathMapping.contentPrefix}/${pathWithoutLeadingSlash}`;
    }
}

function handleOpenServerUrls(message) {
    const { serverSelections } = message;

    for (const serverTitle in serverSelections) {
        const envTypes = serverSelections[serverTitle];
        if (envTypes.length === 0) continue;

        const server = sitesMap.servers.find(s => s.title === serverTitle);
        if (!server) continue;

        const urls = [];
        envTypes.forEach(envType => {
            if (!server.env[envType] || server.env[envType].length === 0) return;

            server.env[envType].forEach(url => {
                urls.push(url);
            });
        });

        if (urls.length > 0) {
            addTabsToServerGroup(urls, serverTitle);
        }
    }
}

async function addTabsToServerGroup(urls, serverTitle) {
    const tabIds = [];

    for (const url of urls) {
        const tab = await chrome.tabs.create({ url, active: false });
        tabIds.push(tab.id);
    }

    if (tabIds.length === 0) return;

    if (serverTabGroups[serverTitle]) {
        try {
            await chrome.tabs.group({
                tabIds: tabIds,
                groupId: serverTabGroups[serverTitle]
            });
            return;
        } catch (error) {
            console.log(`Group for ${serverTitle} no longer exists, creating new group`);
            delete serverTabGroups[serverTitle];
        }
    }

    const groupId = await chrome.tabs.group({ tabIds: tabIds });
    await chrome.tabGroups.update(groupId, { 
        title: serverTitle, 
        color: getColorForServer(serverTitle) 
    });
    
    serverTabGroups[serverTitle] = groupId;
}

function getContentPath(url) {
    try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        if (pathname && pathname !== "/" && pathname !== "/content") {
            return pathname;
        }

        if (pathname === "/") {
            return sitesMap.defaults.contentPathMapping.rootPath;
        }

        return sitesMap.defaults.contentPathMapping.contentPrefix;
    } catch (error) {
        console.error("Error parsing URL:", error);
        if (sitesMap && sitesMap.defaults && sitesMap.defaults.contentPathMapping) {
            return sitesMap.defaults.contentPathMapping.rootPath;
        }
        return "/content";
    }
}

function getColorForServer(serverName) {
    const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'];

    let hash = 0;
    for (let i = 0; i < serverName.length; i++) {
        hash = serverName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
}

async function checkServerStatus(url, credentials) {
    try {
        const cacheBuster = `?cacheBuster=${Date.now()}`;
        const urlWithCacheBuster = url.includes('?') ? `${url}&cacheBuster=${Date.now()}` : `${url}${cacheBuster}`;

        const response = await fetch(urlWithCacheBuster, {
            method: 'GET',
            headers: credentials ? {
                'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
            } : {},
            signal: AbortSignal.timeout(5000)
        });

        return {
            isUp: response.ok,
            statusCode: response.status
        };
    } catch (error) {
        console.error(`Error checking ${url}:`, error);
        return {
            isUp: false,
            statusCode: null,
            error: error.message
        };
    }
}

loadSitesData();
