const jsonEditor = document.getElementById('jsonEditor');
const saveButton = document.getElementById('saveButton');
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const fileInput = document.getElementById('fileInput');

document.addEventListener('DOMContentLoaded', loadSitesData);

saveButton.addEventListener('click', saveSitesData);
exportButton?.addEventListener('click', exportSitesData);
importButton?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', importSitesData);

async function loadSitesData() {
    const { sitesMap } = await chrome.storage.local.get('sitesMap');
    if (sitesMap) {
        jsonEditor.value = JSON.stringify(sitesMap, null, 4);
    }
}

async function saveSitesData() {
    try {
        const jsonData = JSON.parse(jsonEditor.value);

        if (!jsonData.servers || !Array.isArray(jsonData.servers)) {
            throw new Error("JSON must contain a 'servers' array");
        }

        if (!jsonData.defaults) {
            jsonData.defaults = {};
        }

        if (!jsonData.defaults.contentPathMapping) {
            jsonData.defaults.contentPathMapping = {
                rootPath: "/content/path",
                contentPrefix: "/content"
            };
        }

        if (jsonData.quickActions) {
            jsonData.quickActions.forEach(category => {
                if (category.actions && !category.paths) {
                    category.paths = category.actions.map(action => ({
                        title: action.title,
                        url: action.urlModifier
                    }));
                    delete category.actions;
                }
            });
        }

        await chrome.storage.local.set({ sitesMap: jsonData });
        chrome.runtime.sendMessage({ action: 'reloadShortcuts' });

        alert('Settings saved successfully!');

    } catch (error) {
        console.error(error);
        alert(`Error saving settings: ${error.message}`);
    }
}

function exportSitesData() {
    try {
        const jsonData = JSON.parse(jsonEditor.value);
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'sites.json';
        a.click();

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        alert(`Error exporting settings: ${error.message}`);
    }
}

function importSitesData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            if (!jsonData.servers || !Array.isArray(jsonData.servers)) {
                throw new Error("Imported JSON must contain a 'servers' array");
            }

            if (!jsonData.defaults) {
                jsonData.defaults = {};
            }

            if (!jsonData.defaults.contentPathMapping) {
                jsonData.defaults.contentPathMapping = {
                    rootPath: "/content/path",
                    contentPrefix: "/content"
                };
            }

            if (jsonData.quickActions) {
                jsonData.quickActions.forEach(category => {
                    if (category.actions && !category.paths) {
                        category.paths = category.actions.map(action => ({
                            title: action.title,
                            url: action.urlModifier
                        }));
                        delete category.actions;
                    }
                });
            }

            jsonEditor.value = JSON.stringify(jsonData, null, 4);

            await chrome.storage.local.set({ sitesMap: jsonData });
            chrome.runtime.sendMessage({ action: 'reloadShortcuts' });

            alert('Settings imported successfully!');

        } catch (error) {
            console.error(error);
            alert(`Error importing settings: ${error.message}`);
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

async function loadCredentials() {
    const { loginCredentials } = await chrome.storage.local.get('loginCredentials');
    if (loginCredentials) {
        document.getElementById('username').value = loginCredentials.username || '';
    }
}

async function saveCredentials() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        await chrome.storage.local.set({
            loginCredentials: { username, password }
        });
        alert('Credentials saved successfully!');
    } else {
        alert('Please enter both username and password.');
    }
}

function openStatusReport() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/status-report.html')
    });
}

document.getElementById('saveCredentials')?.addEventListener('click', saveCredentials);
document.getElementById('checkServerStatus')?.addEventListener('click', openStatusReport);

document.addEventListener('DOMContentLoaded', () => {
    loadSitesData();
    loadCredentials();
});
