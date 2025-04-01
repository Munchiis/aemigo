//load all categories from sites.json
//harrison comment

//iterate through sitesMap, get each category, and then check session storage for that category (shortcut__categoryName)

const sitesMap = await chrome.storage.local.get('sitesMap');
const shortcut = sitesMap.sitesMap.shortcuts;
shortcut.forEach(async (element) => {
    const categoryHTML = `shortcut_${element.category}`
    const html = await chrome.storage.local.get(categoryHTML);
    document.body.innerHTML += html[categoryHTML];
});