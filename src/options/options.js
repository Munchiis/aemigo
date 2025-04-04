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

    } catch (error) {
        console.error(error)
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
        console.error(error)
    }
}

function importSitesData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

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

        } catch (error) {
            console.error(error)
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}
