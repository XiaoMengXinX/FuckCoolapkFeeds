import { useState, useEffect } from 'react';
import Head from 'next/head';
import { styles } from '../styles/homeStyles';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [outputLink, setOutputLink] = useState('');
  const [host, setHost] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.origin);
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    if (!inputValue.trim()) {
      setOutputLink('');
      return;
    }

    try {
      if (inputValue.includes('coolapk.com')) {
        // 处理酷安链接
        const url = new URL(inputValue);
        // 移除查询参数，保留完整路径
        const cleanPath = url.pathname;
        setOutputLink(`${host}${cleanPath}`);
      } else if (/^\d+$/.test(inputValue.trim())) {
        // 处理纯数字ID
        setOutputLink(`${host}/feed/${inputValue.trim()}`);
      } else {
        setOutputLink('');
      }
    } catch (error) {
      // 如果URL解析失败，检查是否为纯数字
      if (/^\d+$/.test(inputValue.trim())) {
        setOutputLink(`${host}/feed/${inputValue.trim()}`);
      } else {
        setOutputLink('');
      }
    }
  }, [inputValue, host]);

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
      
      // 移除之前选中内容
      if (selection.rangeCount > 0) {
        selection.removeAllRanges();
      }
      
      selection.addRange(range);
      document.execCommand('copy');
      alert('链接已复制!');
      selection.removeAllRanges();
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  const handleRedirect = () => {
    if (outputLink) {
      window.location.href = outputLink;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Coolapk1s</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="一键去除 Coolapk 跟踪参数，并提供支持 Markdown 且无干扰的网页动态预览。" />

        <meta property="og:title" content="Coolapk1s" />
        <meta property="og:description" content="一键去除 Coolapk 跟踪参数，并提供支持 Markdown 且无干扰的网页动态预览。" />

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
            placeholder="输入酷安分享链接或动态ID"
          />
          {!isMobile && (
            <div className="button-group">
              <button onClick={handleCopy} className="button copy-button" disabled={!outputLink}>
                复制链接
              </button>
              <button onClick={handleRedirect} className="button redirect-button" disabled={!outputLink}>
                跳转
              </button>
            </div>
          )}
        </div>

        {isMobile && (
          <div className="button-group mobile">
            <button onClick={handleCopy} className="button copy-button" disabled={!outputLink}>
              复制链接
            </button>
            <button onClick={handleRedirect} className="button redirect-button" disabled={!outputLink}>
              跳转
            </button>
          </div>
        )}

        <div className={`arrow-down ${outputLink ? 'visible' : ''}`}>↓</div>
        <div className={`output-container ${outputLink ? 'visible' : ''}`}>
          <code className="output-link" id="output-link-text">{outputLink || '\u00A0'}</code>
        </div>
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