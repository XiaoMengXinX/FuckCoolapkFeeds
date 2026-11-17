/** @type {import('next').NextConfig} */
module.exports = {
    async rewrites() {
        return {
            // `vercel dev` hands every /api/* request to the Go functions, so pages request /summary/:id.
            beforeFiles: [{ source: '/summary/:id(\\d+)', destination: '/api/summary?id=:id' }],
        };
    },
};
