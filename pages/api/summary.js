import { fetchFeedData } from '../../lib/internalApi';
import { getSummaryInput, streamAISummary } from '../../lib/aiSummary';

// Limits on new generations, which spend model tokens. Cache hits are never counted.
const IP_HOURLY_LIMIT = 20;
const SITE_HOURLY_LIMIT = 100;
const SITE_DAILY_LIMIT = 1200;

// Keeps a failing feed or a provider outage from being retried on every page view.
const FAILURE_TTL_MS = 10 * 60 * 1000;
// How long a feed lookup is reused, so repeated requests do not refetch from Coolapk.
const LOOKUP_TTL_MS = {
    eligible: 10 * 60 * 1000,
    ineligible: 24 * 60 * 60 * 1000,
    missing: 60 * 1000,
};

const NO_STORE = 'no-store';
// Cloudflare caches every path on the site and honors s-maxage, so these responses are also served from the edge.
const SUMMARY_CACHE_CONTROL = 'public, s-maxage=604800';
const INELIGIBLE_CACHE_CONTROL = 'public, s-maxage=86400';
const MISSING_CACHE_CONTROL = 'public, s-maxage=60';

class LruMap {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.map = new Map();
    }

    get(key) {
        const value = this.map.get(key);
        if (value !== undefined) {
            this.map.delete(key);
            this.map.set(key, value);
        }
        return value;
    }

    set(key, value) {
        this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.maxSize) {
            this.map.delete(this.map.keys().next().value);
        }
    }
}

// Counts uses within a fixed window and starts over whenever the window key changes.
class WindowCounter {
    constructor(limit) {
        this.limit = limit;
        this.window = '';
        this.count = 0;
    }

    hasRoom(window) {
        if (this.window !== window) {
            this.window = window;
            this.count = 0;
        }
        return this.count < this.limit;
    }
}

const summaries = new LruMap(5000);
const failures = new LruMap(5000);
const lookups = new LruMap(5000);
const inFlight = new Map();
const ipCounters = new LruMap(10000);
const siteHourly = new WindowCounter(SITE_HOURLY_LIMIT);
const siteDaily = new WindowCounter(SITE_DAILY_LIMIT);

// The self-hosted server is reachable only through Cloudflare, which sets cf-connecting-ip.
// On Vercel clients can send that header themselves, so only the Vercel-set x-real-ip is trusted there.
function clientIp(req) {
    return req.headers[process.env.VERCEL ? 'x-real-ip' : 'cf-connecting-ip'] || req.socket.remoteAddress;
}

function quotaCounters(ip) {
    let ipCounter = ipCounters.get(ip);
    if (!ipCounter) {
        ipCounter = new WindowCounter(IP_HOURLY_LIMIT);
        ipCounters.set(ip, ipCounter);
    }
    // Windows follow China Standard Time: "YYYY-MM-DDTHH" for hours, "YYYY-MM-DD" for days.
    const hour = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 13);
    return [[ipCounter, hour], [siteHourly, hour], [siteDaily, hour.slice(0, 10)]];
}

function hasQuota(ip) {
    return quotaCounters(ip).every(([counter, window]) => counter.hasRoom(window));
}

function takeQuota(ip) {
    if (!hasQuota(ip)) return false;
    for (const [counter] of quotaCounters(ip)) counter.count += 1;
    return true;
}

// Resolves to { status: 'eligible', input } | { status: 'ineligible' } | { status: 'missing' }.
// Concurrent requests for the same feed share one Coolapk fetch.
function lookupFeed(id, req) {
    const cached = lookups.get(id);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const entry = { expiresAt: Infinity };
    entry.result = fetchFeedData(id, req).then(({ feed }) => {
        const input = feed && getSummaryInput(feed);
        const result = input ? { status: 'eligible', input } : { status: feed ? 'ineligible' : 'missing' };
        entry.expiresAt = Date.now() + LOOKUP_TTL_MS[result.status];
        return result;
    });
    lookups.set(id, entry);
    return entry.result;
}

function sendStatus(res, status, cacheControl = NO_STORE) {
    res.setHeader('Cache-Control', cacheControl);
    res.status(status).end();
}

function sendSummary(res, summary) {
    res.setHeader('Cache-Control', SUMMARY_CACHE_CONTROL);
    res.status(200).json(summary);
}

async function sendPending(res, pending) {
    const summary = await pending;
    if (summary) sendSummary(res, summary);
    else sendStatus(res, 503);
}

function generate(id, input, onDelta) {
    const pending = streamAISummary(input, onDelta).then((summary) => {
        if (summary) summaries.set(id, summary);
        else failures.set(id, Date.now() + FAILURE_TTL_MS);
        inFlight.delete(id);
        return summary;
    });
    inFlight.set(id, pending);
    return pending;
}

async function streamSummary(res, id, input) {
    let clientGone = false;
    res.on('close', () => { clientGone = true; });
    const send = (event) => {
        if (!clientGone) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        // no-transform keeps Next.js and Cloudflare from compressing, which would buffer the stream.
        'Cache-Control': 'no-store, no-transform',
    });
    res.flushHeaders();

    let model = null;
    // Generation continues after the client leaves so the tokens already spent still fill the cache.
    const summary = await generate(id, input, (delta, deltaModel) => {
        if (model !== deltaModel) {
            model = deltaModel;
            send({ model });
        }
        send({ delta });
    });

    send(summary ? { done: true } : { error: true });
    res.end();
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendStatus(res, 405);

    const { id } = req.query;
    if (typeof id !== 'string' || !/^[1-9]\d{0,15}$/.test(id)) return sendStatus(res, 400);

    const cached = summaries.get(id);
    if (cached) return sendSummary(res, cached);
    if (failures.get(id) > Date.now()) return sendStatus(res, 503);
    if (inFlight.has(id)) return sendPending(res, inFlight.get(id));

    // Checked before the lookup so rate-limited clients cannot drive Coolapk fetches.
    const ip = clientIp(req);
    if (!hasQuota(ip)) return sendStatus(res, 429);

    const lookup = await lookupFeed(id, req);
    if (lookup.status === 'missing') return sendStatus(res, 404, MISSING_CACHE_CONTROL);
    if (lookup.status === 'ineligible') return sendStatus(res, 404, INELIGIBLE_CACHE_CONTROL);

    // Another request may have started generating while the feed was being fetched.
    if (inFlight.has(id)) return sendPending(res, inFlight.get(id));
    if (!takeQuota(ip)) return sendStatus(res, 429);

    return streamSummary(res, id, lookup.input);
}
