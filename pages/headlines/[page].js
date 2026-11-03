import FeedListFrame from '../../components/feed/FeedListFrame';
import { fetchFeedList } from '../../lib/internalApi';

const MAX_PAGES = 3;

const HeadlinesPage = ({ feeds, error, page }) => (
    <FeedListFrame feeds={feeds} error={error} page={page} messageType="hl-height" />
);

export async function getServerSideProps({ req, res, params }) {
    const page = parseInt(params.page, 10);

    if (isNaN(page) || page < 1 || page > MAX_PAGES) {
        return { notFound: true };
    }

    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    try {
        const feeds = await fetchFeedList(req, `headlines?page=${page}`);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=0');
        return { props: { feeds, page, error: null } };
    } catch (err) {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=0');
        return { props: { feeds: [], page, error: err.message } };
    }
}

export default HeadlinesPage;
