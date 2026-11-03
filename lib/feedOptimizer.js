export function optimizeFeedData(feed) {
    if (!feed) return null;

    return {
        feedType: feed.feedType,
        message_title: feed.message_title,
        title: feed.title,
        username: feed.username,
        userAvatar: feed.userAvatar,
        dateline: feed.dateline,
        message: feed.message,
        message_raw_output: feed.message_raw_output,
        picArr: feed.picArr,
        message_cover: feed.message_cover,
        productAlbumDetailInfo: feed.productAlbumDetailInfo || null,
    };
}

export function optimizeFeedListData(feed) {
    return {
        id: feed.id,
        feedType: feed.feedType,
        message_title: feed.message_title,
        title: feed.title,
        username: feed.username,
        userAvatar: feed.userAvatar,
        userInfo: feed.userInfo ? { verify_status: feed.userInfo.verify_status } : null,
        dateline: feed.dateline,
        message: feed.message,
        picArr: feed.picArr,
        pic: feed.pic,
        message_cover: feed.message_cover,
        device_title: feed.device_title,
        ttitle: feed.ttitle,
        tags: feed.tags,
        likenum: feed.likenum,
        replynum: feed.replynum,
        share_num: feed.share_num,
        forwardnum: feed.forwardnum,
        entityType: feed.entityType,
    };
}

function optimizeReplyRow(r) {
    return {
        username: r.username,
        ruid: r.ruid,
        rusername: r.rusername || null,
        isFeedAuthor: r.isFeedAuthor,
        dateline: r.dateline,
        message: r.message,
        pic: r.pic || null,
        picArr: r.picArr || null,
    };
}

export function optimizeReplyData(reply) {
    return {
        id: reply.id,
        username: reply.username,
        userAvatar: reply.userAvatar,
        isFeedAuthor: reply.isFeedAuthor,
        feedUid: reply.feedUid,
        dateline: reply.dateline,
        likenum: reply.likenum,
        replynum: reply.replynum,
        message: reply.message,
        pic: reply.pic || null,
        picArr: reply.picArr || null,
        replyRows: reply.replyRows ? reply.replyRows.map(optimizeReplyRow) : null,
        replyRowsMore: reply.replyRowsMore || 0,
    };
}
