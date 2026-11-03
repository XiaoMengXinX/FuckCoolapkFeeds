import { useState, useEffect } from 'react';
import Head from 'next/head';
import { styles } from '../styles/homeStyles';
import { useIframePages } from '../lib/useIframePages';

const getPreviewLink = (input, host) => {
  const value = input.trim();
  if (/^\d+$/.test(value)) return `${host}/feed/${value}`;
  if (!value.includes('coolapk.com')) return '';
  try {
    return `${host}${new URL(value).pathname}`;
  } catch {
    return '';
  }
};

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [host, setHost] = useState('');
  const outputLink = getPreviewLink(inputValue, host);

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  const handleCopy = () => {
    if (!outputLink) return;

    try {
      const textElement = document.getElementById('output-link-text');
      if (!textElement) {
        alert('复制失败，请手动复制');
        return;
      }

      const range = document.createRange();
      range.selectNode(textElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      alert('链接已复制!');
      selection.removeAllRanges();
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  const handleRedirect = () => {
    if (outputLink) {
      window.location.href = outputLink;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && outputLink) {
      handleRedirect();
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Coolapk1s</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="一键去除酷安跟踪参数，并提供支持 Markdown 且无干扰的网页动态预览。" />

        <meta property="og:title" content="Coolapk1s" />
        <meta property="og:description" content="一键去除酷安跟踪参数，并提供支持 Markdown 且无干扰的网页动态预览。" />

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#28a745" />
      </Head>

      <main className="main">
        <h1 className="title">Coolapk1s</h1>

        <div className="github-container">
          <a
            href="https://github.com/XiaoMengXinX/FuckCoolapkFeeds"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入酷安分享链接或动态ID"
          />
          <div className="button-group">
            <button onClick={handleCopy} className="button copy-button" title="复制链接" disabled={!outputLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button onClick={handleRedirect} className="button redirect-button" title="跳转" disabled={!outputLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>

        {outputLink && (
          <div className="arrow-down visible">↓</div>
        )}
        {outputLink && (
          <div className="output-container visible">
            <code className="output-link" id="output-link-text">{outputLink}</code>
          </div>
        )}

        <HeadlinesSection />
      </main>

      <footer className="footer">
        <p className="powered-by">
          Powered with <span className="tech">Next.js</span> & <span className="tech">Go</span>
        </p>
        <p className="powered-by deployed">
          Deployed on <span className="tech">Vercel</span>
        </p>
      </footer>

      <style jsx>{styles}</style>
    </div>
  );
}

const MAX_HL_PAGES = 3;

function HeadlinesSection() {
  const { pages, getHeight, isLoading, isFinished, loaderRef } = useIframePages('hl-height', MAX_HL_PAGES);

  return (
    <div className="hl-section">
      <div className="hl-section-header">
        <div className="hl-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          头条榜
        </div>
      </div>

      {pages.map(p => (
        <div key={p} className="hl-iframe-container" style={{ minHeight: getHeight(p) + 'px' }}>
          {isLoading(p) && (
            <div className="hl-loading">
              <div className="hl-spinner" />
              <span>{p === 1 ? '加载头条中...' : '加载更多中...'}</span>
            </div>
          )}
          <iframe
            src={`/headlines/${p}`}
            className="hl-iframe"
            style={{
              height: getHeight(p) + 'px',
              opacity: isLoading(p) ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
            scrolling="no"
            frameBorder="0"
            title={`头条榜 - 第${p}页`}
          />
        </div>
      ))}
      <div ref={loaderRef} style={{ height: '10px', width: '100%' }} />
      {isFinished && (
        <div className="hl-end-msg">没有更多内容了</div>
      )}
    </div>
  );
}