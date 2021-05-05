/*
Log that we received the message.
Then display a notification. The notification contains the URL,
which we read from the message.
*/
function listener(message) {

    console.log("Background script received message.");
    console.log(message.type);

    if (message.type === 'download-csv') {
        console.log("downloading");

        const data = new Blob([message.csv], {
            type: "text/plain;charset=utf-8"
        });

        const url = window.URL.createObjectURL(data);

        console.log("url");
        console.log(browser);
        console.log(browser.downloads);
        console.log(browser.downloads.download);

        browser.downloads.download({
            url: url,
            filename: 'comment.csv',
            saveAs: true,
        })
            .then(() => { console.log("downloaded complete promise"); })
            .catch((error) => { console.log(error); });

        console.log("Downloaded");
    }
}

browser.runtime.onMessage.addListener(listener);
