//load all categories from sites.json

//in event of clicking shortcut -> getcurrentab ->
//create new url -> append shortcut pathname ->
//make group -> add tab to that group
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
const res = await getCurrentTab();
console.log(res);