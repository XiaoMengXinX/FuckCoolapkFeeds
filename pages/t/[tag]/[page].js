import FeedListFrame from '../../../components/feed/FeedListFrame';
import { fetchFeedList } from '../../../lib/internalApi';

const MAX_PAGES = 5;

const TagFeedPage = ({ feeds, error, page }) => (
    <FeedListFrame feeds={feeds} error={error} page={page} messageType="tag-height" />
);

export async function getServerSideProps({ req, res, params }) {
    const { tag } = params;
    const page = parseInt(params.page, 10);

    if (isNaN(page) || page < 1 || page > MAX_PAGES) {
        return { notFound: true };
    }

    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    try {
        const feeds = await fetchFeedList(req, `tag?tag=${encodeURIComponent(tag)}&page=${page}`);
        res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=0');
        return { props: { feeds, page, error: null } };
    } catch (err) {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=0');
        return { props: { feeds: [], page, error: err.message } };
    }
}

export default TagFeedPage;
