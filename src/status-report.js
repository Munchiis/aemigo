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
        
        statusReport.innerHTML = '';
        
        const { sitesMap } = await chrome.storage.local.get('sitesMap');
        const { loginCredentials } = await chrome.storage.local.get('loginCredentials');

        if (!sitesMap || !sitesMap.servers || sitesMap.servers.length === 0) {
            statusReport.innerHTML = '<div class="StatusReport__error">No servers configured. Please configure servers in the options page.</div>';
            return;
        }

        sitesMap.servers.forEach(server => {
            const serverElement = createServerSkeleton(server);
            statusReport.appendChild(serverElement);
        });

        sitesMap.servers.forEach(async (server, index) => {
            await processServer(server, loginCredentials, index);
        });

        updateTimestamp();
    } catch (error) {
        console.error("Error checking server status:", error);
        document.getElementById('statusReport').innerHTML =
            `<div class="StatusReport__error">Error checking server status: ${error.message}</div>`;
    }
}

function createServerSkeleton(server) {
    const serverElement = document.createElement('div');
    serverElement.className = 'ServerStatus';
    serverElement.id = `server-${server.title}`;
    
    serverElement.innerHTML = `
        <div class="skeleton skeleton-server"></div>
        
        <div class="ServerStatus__environments">
            <div class="skeleton skeleton-env"></div>
            
            <div class="ServerStatus__group">
                <div class="skeleton skeleton-text short"></div>
                ${Array(server.env.author?.length || 1).fill().map(() => 
                    `<div class="skeleton skeleton-env"></div>`
                ).join('')}
            </div>
            
            <div class="ServerStatus__group">
                <div class="skeleton skeleton-text short"></div>
                ${Array(server.env.publisher?.length || 2).fill().map(() => 
                    `<div class="skeleton skeleton-env"></div>`
                ).join('')}
            </div>
            
            <div class="ServerStatus__group">
                <div class="skeleton skeleton-text short"></div>
                ${Array(server.env.dispatcher?.length || 2).fill().map(() => 
                    `<div class="skeleton skeleton-env"></div>`
                ).join('')}
            </div>
        </div>
    `;
    
    return serverElement;
}

async function processServer(server, loginCredentials, index) {
    try {
        const serverElement = document.getElementById(`server-${server.title}`);
        
        serverElement.innerHTML = `
            <h2>${server.title}</h2>
            <div class="ServerStatus__environments" id="environments-${server.title}">
                <div class="ServerStatus__env is-loading">
                    <span class="ServerStatus__label">Live:</span>
                    <span class="ServerStatus__url">${server.live}</span>
                    <span class="ServerStatus__status">Checking...</span>
                    <span class="ServerStatus__code"></span>
                </div>
                
                <div class="ServerStatus__group">
                    <h3>Author</h3>
                    <div id="author-${server.title}"></div>
                </div>
                
                <div class="ServerStatus__group">
                    <h3>Publisher</h3>
                    <div id="publisher-${server.title}"></div>
                </div>
                
                <div class="ServerStatus__group">
                    <h3>Dispatcher</h3>
                    <div id="dispatcher-${server.title}"></div>
                </div>
            </div>
        `;
        
        const liveStatus = await checkEndpoint(server.live, loginCredentials);
        updateEndpointStatus(`environments-${server.title}`, server.live, liveStatus, true);
        
        const envTypes = ['author', 'publisher', 'dispatcher'];
        
        envTypes.forEach(async (envType) => {
            if (!server.env[envType]) return;
            
            const container = document.getElementById(`${envType}-${server.title}`);

            server.env[envType].forEach(url => {
                const envElement = document.createElement('div');
                envElement.className = 'ServerStatus__env is-loading';
                envElement.id = `env-${btoa(url)}`;
                envElement.innerHTML = `
                    <span class="ServerStatus__url">${url}</span>
                    <span class="ServerStatus__status">Checking...</span>
                    <span class="ServerStatus__code"></span>
                `;
                container.appendChild(envElement);
            });
            const promises = server.env[envType].map(async (url) => {
                const status = await checkEndpoint(url, loginCredentials);
                const elementId = `env-${btoa(url)}`;
                updateEndpointElement(elementId, status);
            });
        });
        
    } catch (error) {
        console.error(`Error processing server ${server.title}:`, error);
        const serverElement = document.getElementById(`server-${server.title}`);
        serverElement.innerHTML += `
            <div class="StatusReport__error">Error checking server: ${error.message}</div>
        `;
    }
}

function updateEndpointStatus(containerId, url, status, isLive = false) {
    const container = document.getElementById(containerId);
    const liveElement = container.querySelector('.ServerStatus__env');
    
    if (liveElement) {
        liveElement.className = `ServerStatus__env ${status.isUp ? 'is-up' : 'is-down'}`;
        liveElement.innerHTML = `
            <span class="ServerStatus__label">${isLive ? 'Live:' : ''}</span>
            <span class="ServerStatus__url">${url}</span>
            <span class="ServerStatus__status">${status.isUp ? '✅ Up' : '❌ Down'}</span>
            <span class="ServerStatus__code">${status.statusCode || 'N/A'}</span>
        `;
    }
}

function updateEndpointElement(elementId, status) {
    const element = document.getElementById(elementId);
    if (element) {
        element.className = `ServerStatus__env ${status.isUp ? 'is-up' : 'is-down'}`;
        const statusText = element.querySelector('.ServerStatus__status');
        const codeText = element.querySelector('.ServerStatus__code');
        
        if (statusText) statusText.textContent = status.isUp ? '✅ Up' : '❌ Down';
        if (codeText) codeText.textContent = status.statusCode || 'N/A';
    }
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
