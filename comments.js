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

const comments = [];
var commentCount = 0;

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

function isCommentReply(div) {
    return dataSigilMatches(div, 'comment inline-reply');
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

function findCommentBody(root, commentId) {
    for (const div of root.getElementsByTagName('div')) {
        if (isCommentBody(div) && div.attributes.getNamedItem('data-commentid').value === commentId) {
            return div;
        }
    }
    return null;
}

function makeCommentBody(commentBody) {
    if (commentBody.previousElementSibling != null) {
        commentCount += 1;
        return {
            id: commentBody.attributes.getNamedItem('data-commentid').value,
            author: commentBody.previousElementSibling.innerText,
            comment: commentBody.innerText,
        };
    }
    return null;
}

function makeComment(comment) {

    const commentId = JSON.parse(comment.attributes.getNamedItem('data-store').value).token;
    const commentBody = findCommentBody(comment, commentId);
    const replies = [];

    for (const div of comment.getElementsByTagName('div')) {
        if (isCommentReply(div)) {
            const replyId = JSON.parse(div.attributes.getNamedItem('data-store').value).token;
            const replyBody = findCommentBody(div, replyId);

            const replyObject = makeCommentBody(replyBody);

            if (replyObject != null) {
                replies.push(replyObject);
            }
        }
    }

    const commentBodyObject = makeCommentBody(commentBody);

    if (commentBodyObject != null) {
        return {
            comment: commentBodyObject,
            replies,
        };
    }

    return null;
}

function updateComment(comment) {
    try {
        const repliesSeeMore = getRepliesSeeMore(comment);
        const repliesSeePrev = getRepliesSeePrev(comment);

        if (repliesSeeMore != null) {
            repliesSeeMore.style.border = "5px solid orange";
        }

        if (repliesSeePrev != null) {
            repliesSeePrev.style.border = "5px solid orange";
        }

        if (repliesSeeMore == null && repliesSeePrev == null) {

            const commentObject = makeComment(comment);

            if (commentObject != null) {
                comments.push(commentObject);
            }

            console.log("comments: " + commentCount);

            comment.remove();
        } else {
            comment.style.border = "5px solid red";
        }
    } catch (error) {
        console.log("exception in updateComment:", error);
    }
}

for (const div of article.getElementsByTagName('div')) {
    if (isComment(div)) {
        updateComment(div);
    }
}


const config = { childList: true, subtree: true };

const callback = function(mutationList, observer) {
    for (const div of article.getElementsByTagName('div')) {
        if (isComment(div)) {
            updateComment(div);
        }
    }
};

const observer = new MutationObserver(callback);
observer.observe(article, config);
console.log("Comments started.");

browser.runtime.onMessage.addListener(request => {
    console.log("Message from the background script:");
    if (request.type === 'get-comments') {
        return Promise.resolve({ comments });
    }
});
