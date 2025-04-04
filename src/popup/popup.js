
async function findCurrentServer(currentOrigin) {
    const { sitesMap } = await chrome.storage.local.get('sitesMap');

    return sitesMap.servers.find((currentServer) => {
        const envList = [
            ...currentServer.env.author,
            ...currentServer.env.publisher,
            ...currentServer.env.dispatcher,
            currentServer.live
        ];
        return envList.some((env) => {
            try {
                return new URL(env).origin === currentOrigin;
            } catch (e) {
                return false;
            }
        });
    });
}
function normalizePath(path) {
    return path.startsWith('/') ? path.substring(1) : path;
}
async function addTabToGroup(tabId, serverTitle) {
    const groups = await chrome.tabGroups.query({ title: serverTitle });

    if (groups.length > 0) {
        await chrome.tabs.group({ tabIds: [tabId], groupId: groups[0].id });
    } else {
        const group = await chrome.tabs.group({ tabIds: [tabId] });
        await chrome.tabGroups.update(group, { color: 'blue', title: serverTitle });
    }
}

async function generateContent() {
    try {
        const { sitesMap } = await chrome.storage.local.get('sitesMap');

        const { quickActionsHtml } = await chrome.storage.local.get('quickActionsHtml');
        if (quickActionsHtml) {
            const quickActionsContainer = document.querySelector('.Popup__quickActionsContainer');
            if (quickActionsContainer) {
                const quickActionsFragment = document.createRange().createContextualFragment(`
                    <h2 class="Popup__sectionTitle">Quick Actions</h2>
                    ${quickActionsHtml}
                `);
                quickActionsContainer.appendChild(quickActionsFragment);

                document.querySelectorAll('.QuickActions__button').forEach(button => {
                    button.addEventListener('click', async () => {
                        const url = button.getAttribute('data-url');
                        await executeQuickAction(url);
                    });
                });
            }
        }

        const shortcutContainer = document.querySelector('.Popup__shortcutContainer');
        for (const category of sitesMap.shortcuts) {
            const { [`shortcut_${category.category}`]: html } =
                await chrome.storage.local.get(`shortcut_${category.category}`);

            const fragment = document.createRange().createContextualFragment(html);
            shortcutContainer.appendChild(fragment);
        }

        document.querySelectorAll('.Shortcut__category').forEach(category => {
            category.addEventListener('click', () => {
                const pathContainer = category.parentElement.querySelector('.Shortcut__pathContainer');
                pathContainer.classList.toggle('display')
            });
        })

        document.querySelectorAll('.path-link').forEach(link => {
            link.addEventListener('click', async () => {
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentUrl = new URL(activeTab.url);
                const href = link.getAttribute('data-href');

                const pathUrl = new URL(href);
                const pathname = pathUrl.pathname;

                const selectedEnvs = getSelectedEnv();
                const server = await findCurrentServer(currentUrl.origin);

                redirect(selectedEnvs, server.env, pathname, server.title)
            });
        });
    } catch (error) {
        console.error(error);
    }
}

async function executeQuickAction(url) {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = new URL(activeTab.url);
        const path = currentUrl.pathname;

        const server = await findCurrentServer(currentUrl.origin);

        if (!server) {
            console.error("Could not determine current server");
            return;
        }

        const modifiedUrl = url.replace('{path}', path);
        const normalizedModifier = normalizePath(modifiedUrl);
        const selectedEnvs = getSelectedEnv();
        const tabIds = [];
        const createTabsForEnv = async (envUrls) => {
            for (const envUrl of envUrls) {
                const createdTabUrl = `${envUrl}/${normalizedModifier}`;
                const tab = await chrome.tabs.create({ active: false, url: createdTabUrl });
                tabIds.push(tab.id);
            }
        };

        if (selectedEnvs.author) {
            await createTabsForEnv(server.env.author);
        }
        if (selectedEnvs.dispatcher) {
            await createTabsForEnv(server.env.dispatcher);
        }
        if (selectedEnvs.publisher) {
            await createTabsForEnv(server.env.publisher);
        }
        if (tabIds.length === 0) {
            const isLive = currentUrl.origin === new URL(server.live).origin;
            let newUrl;

            if (isLive && server.env.author.length > 0) {
                newUrl = `${server.env.author[0]}/${normalizedModifier}`;
            } else {
                newUrl = `${currentUrl.origin}/${normalizedModifier}`;
            }

            const newTab = await chrome.tabs.create({ active: false, url: newUrl });
            tabIds.push(newTab.id);
        }
        if (tabIds.length > 0) {
            const groups = await chrome.tabGroups.query({ title: server.title });

            if (groups.length > 0) {
                await chrome.tabs.group({ tabIds, groupId: groups[0].id });
            } else {
                const group = await chrome.tabs.group({ tabIds });
                await chrome.tabGroups.update(group, { color: 'blue', title: server.title });
            }
        }
    } catch (error) {
        console.error("Error executing quick action:", error);
    }
}

function getSelectedEnv() {
    const selectedEnvs = {}

    const inputs = document.querySelectorAll('input[name="author"], input[name="dispatcher"], input[name="publisher"]')
    inputs.forEach(input => {
        selectedEnvs[input.name] = input.checked;
    });
    return selectedEnvs;
}

async function redirect(selectedEnvs, envs, pathname, name) {
    const tabIds = []

    const createTabsForEnv = async (envUrls) => {
        for (const envUrl of envUrls) {
            const createdTabUrl = envUrl + pathname;
            const tab = await chrome.tabs.create({ active: false, url: createdTabUrl });
            tabIds.push(tab.id);
        }
    };

    if (selectedEnvs.author) {
        await createTabsForEnv(envs.author);
    }
    if (selectedEnvs.dispatcher) {
        await createTabsForEnv(envs.dispatcher);
    }
    if (selectedEnvs.publisher) {
        await createTabsForEnv(envs.publisher);
    }

    if (tabIds.length > 0) {
        const groups = await chrome.tabGroups.query({ title: name });

        if (groups.length > 0) {
            await chrome.tabs.group({ tabIds, groupId: groups[0].id });
        } else {
            const group = await chrome.tabs.group({ tabIds });
            await chrome.tabGroups.update(group, { color: 'blue', title: name });
        }
    }
}

document.addEventListener('DOMContentLoaded', generateContent);
