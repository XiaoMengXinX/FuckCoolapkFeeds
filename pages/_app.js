import { useRouter } from 'next/router';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isIVPage = router.pathname.startsWith('/iv/');

  useEffect(() => {
    if (!isIVPage) {
      import('../styles/globals.css');
    }
  }, [isIVPage]);

  return <Component {...pageProps} />;
}

export default MyApp;