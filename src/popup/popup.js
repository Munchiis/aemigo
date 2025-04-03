async function generateContent() {
    try {
        const { sitesMap } = await chrome.storage.local.get('sitesMap');
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
                const href = link.getAttribute('data-href');

                const pathUrl = new URL(href);
                const pathname = pathUrl.pathname;

                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentUrl = new URL(activeTab.url);
                const selectedEnvs = getSelectedEnv();
                const server = sitesMap.servers.find((currentServer, index) => {
                    const envList = currentServer.env.author.concat(currentServer.env.publisher, currentServer.env.dispatcher, currentServer.live)
                    return envList.some((env) => new URL(env).origin === currentUrl.origin)
                });

                redirect(selectedEnvs, server.env, pathname, server.title)
            });
        });
    } catch (error) {
        console.error(error);
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
    if (selectedEnvs.author) {
        for (const author of envs.author) {
            const createdTabUrl = author + pathname;
            const tab = await chrome.tabs.create({ active: false, url: createdTabUrl })
            tabIds.push(tab.id);
        }
    }
    if (selectedEnvs.dispatcher) {
        for (const dispatcher of envs.dispatcher) {
            const createdTabUrl = dispatcher + pathname;
            const tab = await chrome.tabs.create({ active: false, url: createdTabUrl })
            tabIds.push(tab.id)
        }
    }
    if (selectedEnvs.publisher) {
        for (const publisher of envs.publisher) {
            const createdTabUrl = publisher + pathname;
            const tab = await chrome.tabs.create({ active: false, url: createdTabUrl })
            tabIds.push(tab.id)
        }
    }

    const groups = await chrome.tabGroups.query({ title: name });

    if (groups.length > 0) {
        await chrome.tabs.group({ tabIds, groupId: groups[0].id });
    } else {
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, { color: 'blue', title: name });
    }
}


document.addEventListener('DOMContentLoaded', generateContent);
