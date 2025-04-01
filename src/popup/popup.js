async function generateContent() {
    try {
        const { sitesMap } = await chrome.storage.local.get('sitesMap');

        for (const category of sitesMap.shortcuts) {
            const { [`shortcut_${category.category}`]: html } =
                await chrome.storage.local.get(`shortcut_${category.category}`);

            const fragment = document.createRange().createContextualFragment(html);
            document.body.appendChild(fragment);

        }

        document.querySelectorAll('.path-link').forEach(link => {
            link.addEventListener('click', async () => {
                const href = link.getAttribute('data-href');

                const pathUrl = new URL(href);
                const pathname = pathUrl.pathname;

                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentUrl = new URL(activeTab.url);

                const newUrl = `${currentUrl.origin}${pathname}`;

                await chrome.tabs.update(activeTab.id, { url: newUrl });
            });
        });
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', generateContent);
