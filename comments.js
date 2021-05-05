//

// id = m_story_permalink_view:
// .. .. data-sigil = comment:
// .. .. .. .. data-sigil = comment-body, data-commentid = ?:
// then {
// .. .. .. .. data-sigil = replies-see-more
// } or {
// .. .. .. .. data-sigil = replies-see-prev
//      repeat {
// .. .. .. .. data-sigil = comment inline-reply
// .. .. .. .. .. .. data-sigil = comment-body, data-commentid = ?
//      }
//  } or {
//  nothing, no replies.
// }

const article = document.getElementById('m_story_permalink_view');

article.style.border = "5px solid red";


const incomplete_comments = new Map();

const comments = new Map();
const comments_bodies = new Map();

function dataSigilMatches(div, value) {
    const attr = div.attributes.getNamedItem('data-sigil');
    return (attr != null && attr.value === value);
}

function isComment(div) {
    return dataSigilMatches(div, 'comment');
}

function isCommentBody(div) {
    return dataSigilMatches(div, 'comment-body');
}

function getRepliesSeeMore(comment) {
    for (const div of comment.getElementsByTagName('div')) {
        if (dataSigilMatches(div, 'replies-see-more')) {
            return div;
        }
    }
    return null;
}

function getRepliesSeePrev(comment) {
    for (const div of comment.getElementsByTagName('div')) {
        if (dataSigilMatches(div, 'replies-see-prev')) {
            return div;
        }
    }
    return null;
}

function makeCommentCSV(comment) {

    var rows = ["id,comment"];

    for (const div of comment.getElementsByTagName('div')) {
        if (dataSigilMatches(div, 'comment-body')) {
            rows.push("" + div.attributes.getNamedItem('data-commentid').value + "," + "comment will be here");
        }
    }

    return rows.join("\n");
}

function updateComment(comment) {
    const repliesSeeMore = getRepliesSeeMore(comment);
    const repliesSeePrev = getRepliesSeePrev(comment);

    if (repliesSeeMore != null) {
        repliesSeeMore.style.border = "5px solid orange";
    }

    if (repliesSeePrev != null) {
        repliesSeePrev.style.border = "5px solid orange";
    }

    if (repliesSeeMore == null && repliesSeePrev == null) {
        // console.log("downloading");
        const csv = makeCommentCSV(comment);
        // console.log("csv");
        // const data = new Blob([csv], {
        //     type: "text/plain;charset=utf-8"
        // });

        // console.log("data");
        // const url = window.URL.createObjectURL(data);
        // console.log("url");
        // console.log(browser);
        // console.log(browser.downloads);
        // console.log(browser.downloads.download);
        // browser.downloads.download({
        //     url: url,
        //     filename: 'comment.csv',
        //     saveAs: true,
        // })
        //     .then(() => { console.log("downloaded complete promise"); })
        //     .catch((error) => { console.log(error); });

        console.log("Sending download request to backend.");
        browser.runtime.sendMessage({
            type: 'download-csv',
            csv: csv,
        });

        comment.style.border = "5px solid green";
    } else {
        comment.style.border = "5px solid red";
    }
}

for (const div of article.getElementsByTagName('div')) {
    if (isComment(div)) {
        updateComment(div);
    }
}


const config = { childList: true, subtree: true };

const callback = function(mutationList, observer) {
    console.log("mutation callback");
    mutationList.forEach((mutation) => {
        console.log(mutation.type);
        if (mutation.type === 'childList') {
            {
                var node = mutation.target;
                while (node != null) {
                    if (isComment(node)) {
                        updateComment(node);
                    }
                    node = node.parentNode;
                }
            }

            // {
            //     mutation.addedNodes.forEach((node) => {
            //         if (isComment(node)) {
            //             console.log("Adding comment node");
            //             updateComment(node);
            //         }

            //         for (const div of node.getElementsByTagName('div')) {
            //             if (isComment(div)) {
            //                 console.log("child of added node was a comment.");
            //                 updateComment(div);
            //             }
            //         }
            //     });
            // }
        }
    });
};

const observer = new MutationObserver(callback);
observer.observe(article, config);

console.log("Comments started.");
