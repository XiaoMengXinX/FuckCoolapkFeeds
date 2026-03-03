/**
 * Extract only necessary fields from feed data to reduce page size
 * @param {Object} feed - Full feed data object
 * @returns {Object} - Optimized feed object with only required fields
 */
export function optimizeFeedData(feed) {
    if (!feed) return null;

    return {
        // Basic feed info
        feedType: feed.feedType,

        // Title fields
        message_title: feed.message_title,
        title: feed.title,

        // User info
        username: feed.username,
        userAvatar: feed.userAvatar,

        // Timestamp
        dateline: feed.dateline,

        // Content
        message: feed.message,
        message_raw_output: feed.message_raw_output,

        // Images
        picArr: feed.picArr,
        message_cover: feed.message_cover,

        // Product Album (goods)
        productAlbumDetailInfo: feed.productAlbumDetailInfo || null,
    };
}

/**
 * Extract only necessary fields from feed data to reduce page size
 * @param {Object} feed - Full feed data object
 * @returns {Object} - Optimized feed object with only required fields
 */
export function optimizeFeedListData(feed) {
    if (!feed) return null;

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
        entityType: feed.entityType
    };
}

/**
 * Extract only necessary fields from a nested reply row (replyRows entry).
 * @param {Object} r - Raw reply row object
 * @returns {Object} - Optimized reply row
 */
function optimizeReplyRow(r) {
    if (!r) return null;
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

/**
 * Extract only necessary fields from a top-level reply object to reduce __NEXT_DATA__ size.
 * @param {Object} reply - Raw reply object from Coolapk API
 * @returns {Object} - Optimized reply
 */
export function optimizeReplyData(reply) {
    if (!reply) return null;
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
