AEMigo - Adobe Experience Manager Helper Extension
AEMigo is a Chrome extension designed to streamline workflows for Adobe Experience Manager (AEM) developers, administrators, and content authors. It provides quick access to multiple AEM environments, useful shortcuts, and server status monitoring.

Installation
Clone the repository or download the source code
Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" in the top-right corner
Click "Load unpacked" and select the extension directory
The AEMigo extension icon should now appear in your browser toolbar
Features
Environment Management: Quickly switch between different AEM environments (author, publisher, dispatcher)
Server Status Monitoring: Check the health of all your AEM instances at a glance
Shortcuts: Access common AEM tools and consoles with a single click
Quick Actions: Perform context-aware actions on the current page
Multi-server Operations: Open the same path across multiple environments simultaneously
How to Use
Main Popup Interface
Server Selection: Click on a server card to set it as the active server
Environment Selection: Click on environment buttons (author, publisher, dispatcher) to select which environments to open
Open Selected: Click the "Open Selected" button to open all selected environments
Clear Selections: Click the "Clear Selections" button to deselect all environments
Multi-server Mode: Enable this option to apply shortcuts and quick actions across all selected servers
Server Status Report
Click the "Server Status" button in the popup
View the status of all configured servers and their environments
Click "Refresh Status" to check the current status of all servers
Configuration
Click the "Configuration" button to open the options page where you can edit the sites.json configuration.

Configuring sites.json
The sites.json file is the heart of AEMigo's configuration. It defines your AEM servers, environments, shortcuts, and quick actions.

Structure Overview
{
    "defaults": {
        "contentPathMapping": {
            "rootPath": "/content/path/to/root",
            "contentPrefix": "/content/path"
        }
    },
    "servers": [...],
    "shortcuts": [...],
    "quickActions": [...]
}

Copy


Servers Configuration
The servers array defines all your AEM environments:

"servers": [
    {
        "title": "PROD",
        "live": "https://www.example.com",
        "env": {
            "author": [
                "http://author.example.com:4502"
            ],
            "publisher": [
                "http://publish1.example.com:4503",
                "http://publish2.example.com:4503"
            ],
            "dispatcher": [
                "https://dispatcher1.example.com",
                "https://dispatcher2.example.com"
            ]
        }
    }
]

Copy


Each server object requires:

title: A unique name for the environment
live: The production/live URL
env: An object containing arrays of URLs for each environment type:
author: Author instance URLs
publisher: Publisher instance URLs
dispatcher: Dispatcher instance URLs
You can add as many servers and as many instances of each environment type as needed.

Shortcuts Configuration
Shortcuts provide quick access to common AEM tools and consoles:

"shortcuts": [
    {
        "category": "Development Tools",
        "paths": [
            {
                "title": "CRXDE Lite",
                "url": "/crx/de/index.jsp"
            },
            {
                "title": "Package Manager",
                "url": "/crx/packmgr/index.jsp"
            }
        ]
    }
]

Copy


Each shortcut category contains:

category: The name of the category
paths: An array of shortcuts with:
title: The display name
url: The path to append to the server URL
Shortcuts are typically used for accessing administrative tools and consoles that have fixed paths across all AEM instances.

Quick Actions Configuration
Quick actions are context-aware operations that can be performed on the current page:

"quickActions": [
    {
        "category": "WCM Modes",
        "paths": [
            {
                "title": "Edit Mode",
                "url": "/editor.html{path}.html"
            },
            {
                "title": "Disabled Mode",
                "url": "{path}.html?wcmmode=disabled"
            }
        ]
    }
]

Copy


Quick actions use the special {path} placeholder, which is replaced with the current page's path. This allows you to perform actions on the current content path.

Customization Examples
Adding Custom Shortcuts
You can add shortcuts to your organization's custom tools:

{
    "category": "Custom Tools",
    "paths": [
        {
            "title": "Content Migration",
            "url": "/apps/custom/migration-tool.html"
        },
        {
            "title": "SEO Dashboard",
            "url": "/apps/seo/dashboard.html"
        }
    ]
}

Copy


Environment-specific Quick Actions
Create quick actions for specific environments:

{
    "category": "Content Operations",
    "paths": [
        {
            "title": "Activate Page",
            "url": "/libs/wcm/core/content/reference.html?path={path}&resource=/libs/wcm/core/content/reference/activation.html"
        },
        {
            "title": "Page Permissions",
            "url": "/libs/cq/security/content/permissions.html?path={path}"
        }
    ]
}

Copy


Adding New Environment Types
You can add custom environment types beyond the standard author/publisher/dispatcher:

"servers": [
    {
        "title": "DEV",
        "live": "https://dev.example.com",
        "env": {
            "author": ["http://author-dev.example.com:4502"],
            "publisher": ["http://publish-dev.example.com:4503"],
            "dispatcher": ["https://dispatcher-dev.example.com"],
            "preview": ["https://preview-dev.example.com"],
            "testing": ["https://testing-dev.example.com"]
        }
    }
]

Copy


Best Practices
Organize by Environment: Group your servers logically by environment (DEV, QA, PROD, etc.)
Meaningful Titles: Use clear, descriptive titles for servers and shortcuts
Group Related Shortcuts: Organize shortcuts into logical categories
Consistent Naming: Use consistent naming conventions across all configurations
Regular Updates: Keep your configuration updated as environments change
Troubleshooting
Server Status Shows Down: Check if the server is actually running and if your network can access it
Authentication Issues: Ensure your login credentials are correctly configured
Shortcuts Not Working: Verify the paths in your shortcuts match your AEM version
Extension Not Loading: Try reloading the extension in Chrome's extension manager
Advanced Configuration
Content Path Mapping
The contentPathMapping in the defaults section helps with path translation:

"defaults": {
    "contentPathMapping": {
        "rootPath": "/content/mysite/en/home",
        "contentPrefix": "/content/mysite"
    }
}

Copy


This is used by quick actions to properly handle content paths across different sites.

Login Credentials
For environments requiring authentication, you can configure credentials in the extension's options page.

Contributing
Contributions to AEMigo are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

This README provides a comprehensive guide to using and customizing the AEMigo extension. The configuration through sites.json offers flexibility to adapt the extension to various AEM setups and organizational needs.