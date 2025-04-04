
document.addEventListener('DOMContentLoaded', () => {
    updateTimestamp();

    checkServerStatus();

    document.getElementById('refreshButton').addEventListener('click', checkServerStatus);
});

function updateTimestamp() {
    const now = new Date();
    document.getElementById('timestamp').textContent =
        `Last updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

async function checkServerStatus() {
    try {
        const statusReport = document.getElementById('statusReport');
        statusReport.innerHTML = '<div class="loading">Checking server status...</div>';

        const { sitesMap } = await chrome.storage.local.get('sitesMap');
        const { loginCredentials } = await chrome.storage.local.get('loginCredentials');

        if (!sitesMap || !sitesMap.servers || sitesMap.servers.length === 0) {
            statusReport.innerHTML = '<div class="StatusReport__error">No servers configured. Please configure servers in the options page.</div>';
            return;
        }

        let reportHTML = '<div class="StatusReport">';

        for (const server of sitesMap.servers) {
            reportHTML += `<div class="ServerStatus">
                <h2>${server.title}</h2>
                <div class="ServerStatus__environments">`;

            const liveStatus = await checkEndpoint(server.live, loginCredentials);
            reportHTML += `
                <div class="ServerStatus__env ${liveStatus.isUp ? 'is-up' : 'is-down'}">
                    <span class="ServerStatus__label">Live:</span>
                    <span class="ServerStatus__url">${server.live}</span>
                    <span class="ServerStatus__status">${liveStatus.isUp ? '✅ Up' : '❌ Down'}</span>
                    <span class="ServerStatus__code">${liveStatus.statusCode || 'N/A'}</span>
                </div>`;

            reportHTML += `<div class="ServerStatus__group"><h3>Author</h3>`;
            for (const authorUrl of server.env.author) {
                const status = await checkEndpoint(authorUrl, loginCredentials);
                reportHTML += createStatusHTML(authorUrl, status);
            }
            reportHTML += `</div>`;

            reportHTML += `<div class="ServerStatus__group"><h3>Publisher</h3>`;
            for (const publisherUrl of server.env.publisher) {
                const status = await checkEndpoint(publisherUrl, loginCredentials);
                reportHTML += createStatusHTML(publisherUrl, status);
            }
            reportHTML += `</div>`;

            reportHTML += `<div class="ServerStatus__group"><h3>Dispatcher</h3>`;
            for (const dispatcherUrl of server.env.dispatcher) {
                const status = await checkEndpoint(dispatcherUrl, loginCredentials);
                reportHTML += createStatusHTML(dispatcherUrl, status);
            }
            reportHTML += `</div>`;

            reportHTML += `</div></div>`;
        }

        reportHTML += `</div>`;
        statusReport.innerHTML = reportHTML;

        updateTimestamp();
    } catch (error) {
        console.error("Error checking server status:", error);
        document.getElementById('statusReport').innerHTML =
            `<div class="StatusReport__error">Error checking server status: ${error.message}</div>`;
    }
}

function createStatusHTML(url, status) {
    return `
        <div class="ServerStatus__env ${status.isUp ? 'is-up' : 'is-down'}">
            <span class="ServerStatus__url">${url}</span>
            <span class="ServerStatus__status">${status.isUp ? '✅ Up' : '❌ Down'}</span>
            <span class="ServerStatus__code">${status.statusCode || 'N/A'}</span>
        </div>`;
}

async function checkEndpoint(url, credentials) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'checkServerStatus',
            url: url,
            credentials: credentials
        });

        return response;
    } catch (error) {
        console.error(`Error checking ${url}:`, error);
        return { isUp: false, statusCode: null, error: error.message };
    }
}
