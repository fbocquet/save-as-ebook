var allStyles = [];
var currentStyle = null;
var appliedStyles = [];

// create menu labels
document.getElementById('menuTitle').innerHTML = chrome.i18n.getMessage('extName');
document.getElementById('includeStyle').innerHTML = chrome.i18n.getMessage('includeStyle');
document.getElementById('editStyles').innerHTML = chrome.i18n.getMessage('editStyles');
document.getElementById('savePageLabel').innerHTML = chrome.i18n.getMessage('savePage');
document.getElementById('saveSelectionLabel').innerHTML = chrome.i18n.getMessage('saveSelection');
document.getElementById('pageChapterLabel').innerHTML = chrome.i18n.getMessage('pageChapter');
document.getElementById('selectionChapterLabel').innerHTML = chrome.i18n.getMessage('selectionChapter');
document.getElementById('editChapters').innerHTML = chrome.i18n.getMessage('editChapters');
document.getElementById('waitMessage').innerHTML = chrome.i18n.getMessage('waitMessage');

checkIfBusy((result) => {
    if (result.isBusy) {
        document.getElementById('busy').style.display = 'block';
    } else {
        document.getElementById('busy').style.display = 'none';
    }
})

getStyles(createStyleList);

function createStyleList(styles) {
    allStyles = styles;
    chrome.tabs.query({'active': true}, function (tabs) {
        var currentUrl = tabs[0].url;

        if (!styles || styles.length === 0) {
            return;
        }

        var foundMatchingUrl = false;

        // if multiple URL regexes match, select the longest one
        var allMatchingStyles = [];

        for (var i = 0; i < styles.length; i++) {
            var listItem = document.createElement('option');
            listItem.id = 'option_' + i;
            listItem.className = 'cssEditor-chapter-item';
            listItem.value = 'option_' + i;
            listItem.innerText = styles[i].title;

            currentUrl = currentUrl.replace(/(http[s]?:\/\/|www\.)/i, '').toLowerCase();
            var styleUrl = styles[i].url;
            var styleUrlRegex = null;

            try {
                styleUrlRegex =  new RegExp(styleUrl, 'i');
            } catch (e) {
            }

            if (styleUrlRegex && styleUrlRegex.test(currentUrl)) {
                allMatchingStyles.push({
                    index: i,
                    length: styleUrl.length
                });
            }
        }

        if (allMatchingStyles.length >= 1) {
            allMatchingStyles.sort(function (a, b) {
                return b.length - a.length;
            });
            var selStyle = allMatchingStyles[0];
            currentStyle = styles[selStyle.index];
            setCurrentStyle(currentStyle);
        }
    });
}

function createIncludeStyle(data) {
    var includeStyleCheck = document.getElementById('includeStyleCheck');
    includeStyleCheck.checked = data;
}

getIncludeStyle(createIncludeStyle);

document.getElementById('includeStyleCheck').onclick = function () {
    var includeStyleCheck = document.getElementById('includeStyleCheck');
    setIncludeStyle(includeStyleCheck.checked);
}

document.getElementById("editStyles").onclick = function() {

    if (document.getElementById('cssEditor-Modal')) {
        return;
    }

    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        chrome.tabs.executeScript(tab[0].id, {file: '/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/saveEbook.js'});
        chrome.tabs.insertCSS(tab[0].id, {file: '/cssEditor.css'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/cssEditor.js'
        });

         window.close();
    });
};

document.getElementById("editChapters").onclick = function() {

    if (document.getElementById('chapterEditor-Modal')) {
        return;
    }

    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {

        chrome.tabs.executeScript(tab[0].id, {file: '/jquery.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/saveEbook.js'});
        chrome.tabs.executeScript(tab[0].id, {file: '/jquery-sortable.js'});
        chrome.tabs.insertCSS(tab[0].id, {file: '/chapterEditor.css'});

        chrome.tabs.executeScript(tab[0].id, {
            file: '/chapterEditor.js'
        });

         window.close();
    });
};

function dispatch(action, justAddToBuffer) {
    document.getElementById('busy').style.display = 'block';
    if (!justAddToBuffer) {
        removeEbook();
    }
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tab) {
        chrome.tabs.sendMessage(tab[0].id, {
            type: 'echo'
        }, function(response) {

            if (currentStyle && currentStyle.style) {
                chrome.tabs.insertCSS(tab[0].id, {code: currentStyle.style});
                appliedStyles.push(currentStyle);
            }

            if (!response) {
                // when first invoked, response will be undefined because extractHtml.js
                // was not executed yet
                chrome.tabs.executeScript(tab[0].id, {file: '/jquery.js'},
                function (result) {
                    if (!result) {
                        alert('Save as eBook does not work on this web site!');
                        setIsBusy(false)
                        document.getElementById('busy').style.display = 'none';
                    } else {
                        chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
                        chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
                        chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
                        chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
                        chrome.tabs.executeScript(tab[0].id, {file: '/pure-parser.js'});
                        chrome.tabs.executeScript(tab[0].id, {file: '/cssjson.js'});

                        chrome.tabs.executeScript(tab[0].id, {
                            file: 'extractHtml.js'
                        }, function() {
                            sendMessage(tab[0].id, action, justAddToBuffer, appliedStyles);
                        });
                    }
                });
                // FIXME
                // chrome.tabs.executeScript(tab[0].id, {file: '/utils.js'});
                // chrome.tabs.executeScript(tab[0].id, {file: '/filesaver.js'});
                // chrome.tabs.executeScript(tab[0].id, {file: '/jszip.js'});
                // chrome.tabs.executeScript(tab[0].id, {file: '/jszip-utils.js'});
                // chrome.tabs.executeScript(tab[0].id, {file: '/pure-parser.js'});
                // chrome.tabs.executeScript(tab[0].id, {file: '/cssjson.js'});
                //
                // chrome.tabs.executeScript(tab[0].id, {
                //     file: 'extractHtml.js'
                // }, function() {
                //     sendMessage(tab[0].id, action, justAddToBuffer, appliedStyles);
                // });
            } else if (response.echo) {
                sendMessage(tab[0].id, action, justAddToBuffer, appliedStyles);
            }
        });
    });
}

function sendMessage(tabId, action, justAddToBuffer, appliedStyles) {
    chrome.tabs.sendMessage(tabId, {
        type: action,
        appliedStyles: appliedStyles
    }, function(response) {
        if (!response) {
            alert('Save as eBook does not work on this web site!');
            setIsBusy(false)
            document.getElementById('busy').style.display = 'none';
            return
        }
        if (response.length === 0) {
            if (justAddToBuffer) {
                alert('Cannot add an empty selection as chapter!');
            } else {
                alert('Cannot generate the eBook from an empty selection!');
            }
            window.close();
        }
        if (!justAddToBuffer) {
            buildEbook([response], true);
        } else {
            getEbookPages(function (allPages) {
                allPages.push(response);
                saveEbookPages(allPages);
                window.close();
            });
        }
        setTimeout(function () {
            document.getElementById('busy').style.display = 'none';
        }, 500);
    });
}

document.getElementById('savePage').onclick = function() {
    dispatch('extract-page', false);
};

document.getElementById('saveSelection').onclick = function() {
    dispatch('extract-selection', false);
};

document.getElementById('pageChapter').onclick = function() {
    dispatch('extract-page', true);
};

document.getElementById('selectionChapter').onclick = function() {
    dispatch('extract-selection', true);
};

// get all shortcuts and display them in the menuTitle
chrome.commands.getAll((commands) => {
    for (let command of commands) {
        if (command.name === 'save-page') {
            document.getElementById('savePageShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'save-selection') {
            document.getElementById('saveSelectionShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'add-page') {
            document.getElementById('pageChapterShortcut').appendChild(document.createTextNode(command.shortcut));
        } else if (command.name === 'add-selection') {
            document.getElementById('selectionChapterShortcut').appendChild(document.createTextNode(command.shortcut));
        }
    }
})
