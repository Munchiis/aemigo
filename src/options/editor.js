
document.addEventListener('DOMContentLoaded', () => {
    const jsonEditor = document.getElementById('jsonEditor');

    const editor = CodeMirror(document.getElementById('editor-container'), {
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
    });

    function syncTextarea() {
        jsonEditor.value = editor.getValue();
    }

    editor.on('change', syncTextarea);

    chrome.storage.local.get('sitesMap', function (data) {
        if (data.sitesMap) {
            const formattedJson = JSON.stringify(data.sitesMap, null, 2);
            editor.setValue(formattedJson);
        }
    });
});
