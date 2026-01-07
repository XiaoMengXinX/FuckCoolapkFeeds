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
    };
}
