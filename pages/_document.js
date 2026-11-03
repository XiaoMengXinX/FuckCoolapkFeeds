import { Html, Head, Main, NextScript } from 'next/document';

// Instant View pages carry their own inline styles, so the global stylesheet is left out of them.
class DocumentHead extends Head {
    getCssLinks(files) {
        if (this.context.__NEXT_DATA__.page.startsWith('/iv/')) return null;
        return super.getCssLinks(files);
    }
}

export default function Document({ adsensePublisherId }) {
    return (
        <Html>
            <DocumentHead>
                {adsensePublisherId && (
                    <meta name="google-adsense-account" content={adsensePublisherId} />
                )}
            </DocumentHead>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}

Document.getInitialProps = async (ctx) => {
    const initialProps = await ctx.defaultGetInitialProps(ctx);
    return {
        ...initialProps,
        adsensePublisherId: process.env.ADSENSE_PUBLISHER_ID ?? null,
    };
};
