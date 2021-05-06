//

function escape(value) {

    const textDelimiter = "\"";
    const lineDelimiter = "\n";

    const textDelimiterRegex = new RegExp("\\" + textDelimiter, 'g');
    const lineDelimiterRegex = new RegExp("\\" + lineDelimiter, 'g');
    const escapedDelimiter = textDelimiter + textDelimiter;

    // Escape the textDelimiters contained in the field
    value = "" + value;
    value = value.replace(lineDelimiterRegex, " ");
    value = value.replace(textDelimiterRegex, escapedDelimiter);
    value = textDelimiter + value + textDelimiter;

    return value;
};

function buildCSV(comments) {
    const rows = [["index", "id", "author", "comment", "parent_comment", "reply_index"]];

    for (var i = 0; i < comments.length; i++) {
        const comment = comments[i].comment;
        const replies = comments[i].replies;

        rows.push([
            escape(i),
            escape(comment.id),
            escape(comment.author),
            escape(comment.comment),
            escape(-1),
            escape(-1),
        ]);

        for (var j = 0; j < replies.length; j++) {
            const reply = replies[j];

            rows.push([
                escape(i),
                escape(reply.id),
                escape(reply.author),
                escape(reply.comment),
                escape(i),
                escape(j),
            ]);
        }
    }

    return rows.map(row => row.join(",")).join("\n");
}

function downloadClicked() {

    function onError(error) {
        console.error(`Error: ${error}`);
    }

    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(tabs => {
        for (let tab of tabs) {
            browser.tabs.sendMessage(
                tab.id,
                {type: "get-comments"}
            ).then(response => {
                console.log("Got comments from the content script.");

                const csv  = buildCSV(response.comments);
                const data = new Blob([csv], { type: "text/plain;charset=utf-8" });
                const url  = window.URL.createObjectURL(data);

                browser.downloads.download({
                    url: url,
                    filename: 'comments.csv',
                    saveAs: true,
                })
                    .then(() => { console.log("Comments downloaded."); })
                    .catch(onError);

            }).catch(onError);
        }
    }).catch(onError);
}

browser.pageAction.onClicked.addListener(downloadClicked);
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url.match(/.*:\/\/m.facebook.com\/.*/)) {
    browser.pageAction.show(tab.id);
  }
});
