import '../styles/globals.css';
import { useHighlightTheme } from '../lib/theme';

function MyApp({ Component, pageProps }) {
  useHighlightTheme();
  return <Component {...pageProps} />;
}

export default MyApp;