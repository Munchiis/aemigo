let serverGrid;
let shortcutsContainer;
let quickActionsContainer;
let openSelectedBtn;
let clearSelectionsBtn;
let multiServerCheckbox;

let selectedServers = {};
let activeServer = null;
let sitesMapData = null;
let useMultiServer = false;
let isCtrlPressed = false;

document.addEventListener('DOMContentLoaded', async () => {
    serverGrid = document.getElementById('serverGrid');
    shortcutsContainer = document.getElementById('shortcutsContainer');
    quickActionsContainer = document.getElementById('quickActionsContainer');
    openSelectedBtn = document.getElementById('openSelectedBtn');
    clearSelectionsBtn = document.getElementById('clearSelectionsBtn');
    multiServerCheckbox = document.getElementById('multiServerCheckbox');

    await loadData();

    openSelectedBtn.addEventListener('click', openSelectedEnvironments);
    clearSelectionsBtn.addEventListener('click', clearAllSelections);
    multiServerCheckbox.addEventListener('change', toggleMultiServer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Control' || e.key === 'Meta') {
            isCtrlPressed = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Control' || e.key === 'Meta') {
            isCtrlPressed = false;
        }
    });

    const { useMultiServer: savedMultiServer } = await chrome.storage.local.get('useMultiServer');
    if (savedMultiServer !== undefined) {
        useMultiServer = savedMultiServer;
        multiServerCheckbox.checked = useMultiServer;
    }

    const { lastServerSelections } = await chrome.storage.local.get('lastServerSelections');
    if (lastServerSelections) {
        selectedServers = lastServerSelections;
        updateServerSelectionUI();
    }

    const { lastActiveServer } = await chrome.storage.local.get('lastActiveServer');
    if (lastActiveServer && sitesMapData.servers.some(s => s.title === lastActiveServer)) {
        activeServer = lastActiveServer;
        updateActiveServerUI();
        updateToolsForActiveServer();
    }
});

function clearAllSelections() {
    for (const serverTitle in selectedServers) {
        selectedServers[serverTitle] = [];
    }

    updateServerSelectionUI();
    saveServerSelections();
}

function toggleMultiServer(event) {
    useMultiServer = event.target.checked;
    chrome.storage.local.set({ useMultiServer });
}

async function loadData() {
    const { sitesMap } = await chrome.storage.local.get('sitesMap');
    sitesMapData = sitesMap;

    if (!sitesMap || !sitesMap.servers || sitesMap.servers.length === 0) {
        document.body.innerHTML = '<p>No servers configured. Please configure servers in the options page.</p>';
        return;
    }

    selectedServers = {};
    sitesMap.servers.forEach(server => {
        selectedServers[server.title] = [];
    });

    createServerCards();

    if (sitesMap.servers.length > 0 && !activeServer) {
        activeServer = sitesMap.servers[0].title;
        updateActiveServerUI();
        updateToolsForActiveServer();
    }
}

function createServerCards() {
    let html = '';

    sitesMapData.servers.forEach(server => {
        html += `
      <div class="server-card" data-server="${server.title}">
        <h4>${server.title}</h4>
        <div class="env-buttons">
          ${createEnvironmentButtons(server)}
        </div>
      </div>
    `;
    });

    serverGrid.innerHTML = html;

    document.querySelectorAll('.server-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('env-button')) return;

            const serverTitle = card.dataset.server;

            if (isCtrlPressed) {
                toggleServerSelection(serverTitle);
            } else {
                setActiveServer(serverTitle);

                if (selectedServers[serverTitle].length === 0) {
                    selectAllEnvironmentsForServer(serverTitle);
                }
            }
        });

        card.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('env-button')) return;

            const serverTitle = card.dataset.server;

            selectedServers[serverTitle] = [];

            updateServerSelectionUI();

            saveServerSelections();

            e.stopPropagation();
        });
    });

    document.querySelectorAll('.env-button').forEach(button => {
        button.addEventListener('click', toggleEnvironmentSelection);
    });
}

function createEnvironmentButtons(server) {
    let buttonHtml = '';

    const envTypes = Object.keys(server.env);

    envTypes.forEach(envType => {
        buttonHtml += `
      <button class="env-button" 
              data-server="${server.title}" 
              data-env-type="${envType}">
        ${envType}
      </button>
    `;
    });

    return buttonHtml;
}

function toggleServerSelection(serverTitle) {
    const server = sitesMapData.servers.find(s => s.title === serverTitle);
    if (!server) return;

    const envTypes = Object.keys(server.env);

    const allSelected = envTypes.every(envType =>
        selectedServers[serverTitle].includes(envType)
    );

    if (allSelected) {
        selectedServers[serverTitle] = [];
    } else {
        selectedServers[serverTitle] = [...envTypes];
    }

    updateServerSelectionUI();

    saveServerSelections();
}

function selectAllEnvironmentsForServer(serverTitle) {
    const server = sitesMapData.servers.find(s => s.title === serverTitle);
    if (!server) return;

    const envTypes = Object.keys(server.env);
    selectedServers[serverTitle] = [...envTypes];

    updateServerSelectionUI();

    saveServerSelections();
}

function toggleEnvironmentSelection(event) {
    event.stopPropagation();

    const button = event.currentTarget;
    const serverTitle = button.dataset.server;
    const envType = button.dataset.envType;

    if (!selectedServers[serverTitle]) {
        selectedServers[serverTitle] = [];
    }

    const index = selectedServers[serverTitle].indexOf(envType);
    if (index === -1) {
        selectedServers[serverTitle].push(envType);
        button.classList.add('selected');
    } else {
        selectedServers[serverTitle].splice(index, 1);
        button.classList.remove('selected');
    }

    saveServerSelections();

    updateOpenButtonState();
}

function setActiveServer(serverTitle) {
    activeServer = serverTitle;
    updateActiveServerUI();
    updateToolsForActiveServer();

    chrome.storage.local.set({ lastActiveServer: activeServer });
}

function updateActiveServerUI() {
    document.querySelectorAll('.server-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.querySelector(`.server-card[data-server="${activeServer}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

function updateServerSelectionUI() {
    document.querySelectorAll('.server-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelectorAll('.env-button').forEach(button => {
        button.classList.remove('selected');
    });

    for (const serverTitle in selectedServers) {
        const envTypes = selectedServers[serverTitle];

        if (envTypes.length > 0) {
            const serverCard = document.querySelector(`.server-card[data-server="${serverTitle}"]`);
            if (serverCard) {
                serverCard.classList.add('selected');
            }
        }

        envTypes.forEach(envType => {
            const button = document.querySelector(`.env-button[data-server="${serverTitle}"][data-env-type="${envType}"]`);
            if (button) {
                button.classList.add('selected');
            }
        });
    }

    updateOpenButtonState();
}

function updateOpenButtonState() {
    let hasSelections = false;
    for (const serverTitle in selectedServers) {
        if (selectedServers[serverTitle].length > 0) {
            hasSelections = true;
            break;
        }
    }

    openSelectedBtn.disabled = !hasSelections;
    clearSelectionsBtn.disabled = !hasSelections;
}

function updateToolsForActiveServer() {
    if (!activeServer) return;

    updateShortcuts();
    updateQuickActions();
}

function updateShortcuts() {
    if (!sitesMapData || !sitesMapData.shortcuts) {
        shortcutsContainer.innerHTML = '<p>No shortcuts configured.</p>';
        return;
    }

    const serverUrl = getActiveServerUrl();
    if (!serverUrl && !useMultiServer) {
        shortcutsContainer.innerHTML = '<p>No server URL available for the active server.</p>';
        return;
    }

    let html = '';

    sitesMapData.shortcuts.forEach(category => {
        html += `<div class="shortcut-category">
      <h3>${category.category}</h3>
      <div class="shortcut-buttons">`;

        category.paths.forEach(path => {
            html += `<button class="shortcut-button" 
                      data-url="${path.url}" 
                      data-server="${serverUrl || ''}">
                ${path.title}
              </button>`;
        });

        html += `</div></div>`;
    });

    shortcutsContainer.innerHTML = html;

    document.querySelectorAll('.shortcut-button').forEach(button => {
        button.addEventListener('click', handleShortcutClick);
    });
}

function updateQuickActions() {
    if (!sitesMapData || !sitesMapData.quickActions) {
        quickActionsContainer.innerHTML = '<p>No quick actions configured.</p>';
        return;
    }

    const serverUrl = getActiveServerUrl();
    if (!serverUrl && !useMultiServer) {
        quickActionsContainer.innerHTML = '<p>No server URL available for the active server.</p>';
        return;
    }

    let html = '';

    sitesMapData.quickActions.forEach(category => {
        html += `<div class="quickaction-category">
      <h3>${category.category}</h3>
      <div class="quickaction-buttons">`;

        category.paths.forEach(path => {
            html += `<button class="quickaction-button" 
                      data-url="${path.url}" 
                      data-server="${serverUrl || ''}">
                ${path.title}
              </button>`;
        });

        html += `</div></div>`;
    });

    quickActionsContainer.innerHTML = html;

    document.querySelectorAll('.quickaction-button').forEach(button => {
        button.addEventListener('click', handleQuickActionClick);
    });
}

function getPathFromUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname;
    } catch (error) {
        console.error("Error parsing URL:", error);
        return "/";
    }
}

function handleShortcutClick(event) {
    const button = event.currentTarget;
    const shortcutUrl = button.dataset.url;
    const serverUrl = button.dataset.server;

    if (useMultiServer) {
        chrome.runtime.sendMessage({
            action: 'openShortcut',
            shortcutUrl,
            serverSelections: selectedServers,
            multiServer: true
        });
    } else {
        chrome.runtime.sendMessage({
            action: 'openShortcut',
            shortcutUrl,
            serverUrl,
            serverTitle: activeServer,
            multiServer: false
        });
    }
}

async function handleQuickActionClick(event) {
    const button = event.currentTarget;
    const quickActionUrl = button.dataset.url;
    const serverUrl = button.dataset.server;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let currentUrl = "/";

    if (tabs && tabs.length > 0 && tabs[0].url) {
        currentUrl = getPathFromUrl(tabs[0].url);
    }

    const server = sitesMapData.servers.find(s => s.title === activeServer);

    if (useMultiServer) {
        chrome.runtime.sendMessage({
            action: 'openQuickAction',
            quickActionUrl,
            serverSelections: selectedServers,
            originalPath: currentUrl,
            multiServer: true
        });
    } else {
        chrome.runtime.sendMessage({
            action: 'openQuickAction',
            quickActionUrl,
            serverUrl,
            serverTitle: activeServer,
            originalPath: currentUrl,
            multiServer: false
        });
    }
}

function getActiveServerUrl() {
    const server = sitesMapData.servers.find(s => s.title === activeServer);
    if (!server) return null;

    const envTypes = Object.keys(server.env);
    const preferredEnv = envTypes.includes('author') ? 'author' : envTypes[0];

    if (!preferredEnv || !server.env[preferredEnv] || server.env[preferredEnv].length === 0) {
        return null;
    }

    return server.env[preferredEnv][0];
}

function saveServerSelections() {
    chrome.storage.local.set({ lastServerSelections: selectedServers });
}

function openSelectedEnvironments() {
    chrome.runtime.sendMessage({
        action: 'openServerUrls',
        serverSelections: selectedServers
    });
}

function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}

function openServerStatusReport() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/status-report.html')
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const optionsButton = document.getElementById('openOptions');
    if (optionsButton) {
        optionsButton.addEventListener('click', openOptionsPage);
    }

    const statusButton = document.getElementById('checkServerStatus');
    if (statusButton) {
        statusButton.addEventListener('click', openServerStatusReport);
    }
});
