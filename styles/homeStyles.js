export const styles = `
  .container {
    min-height: 100vh;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .main {
    padding: 2rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 800px;
    margin-top: -5vh;
  }

  .title {
    margin: 0 0 1rem;
    line-height: 1.15;
    font-size: 4rem;
    text-align: center;
    font-weight: bold;
    color: #28a745;
  }

  .github-container {
    margin-bottom: 2.5rem;
    text-align: center;
  }

  .input-section {
    width: 100%;
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: stretch;
  }

  .input {
    flex: 1;
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: white;
    color: #333;
  }

  .input:focus {
    border-color: #28a745;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
  }

  .button-group.mobile {
    width: 100%;
    margin-top: 0.5rem;
  }

  .button {
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 8px;
    white-space: nowrap;
  }

  .button-group.mobile .button {
    flex: 1;
  }

  .copy-button {
    background-color: #6c757d;
  }

  .copy-button:hover:not(:disabled) {
    background-color: #5a6268;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .redirect-button {
    background-color: #28a745;
  }

  .redirect-button:hover:not(:disabled) {
    background-color: #218838;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
  }

  .button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .arrow-down {
    font-size: 2.5rem;
    color: #28a745;
    margin: 1rem 0 0.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .arrow-down.visible {
    opacity: 1;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  .output-container {
    margin-top: 0.5rem;
    text-align: center;
    word-break: break-all;
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    width: 100%;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
    box-sizing: border-box;
    overflow-wrap: break-word;
    opacity: 0;
    min-height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .output-container.visible {
    opacity: 1;
  }

  .output-link {
    font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', Menlo, Monaco, 'Courier New', monospace;
    color: #495057;
    font-size: 1.05rem;
    font-weight: 400;
    display: block;
    padding: 0;
    margin: 0;
    background: none;
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    text-align: center;
    width: 100%;
    letter-spacing: -0.01em;
  }

  @media (prefers-color-scheme: dark) {
    .input {
      background-color: #2d2d2d;
      color: #e0e0e0;
      border-color: #444;
    }

    .input:focus {
      border-color: #28a745;
      box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
    }

    .output-container {
      background-color: #2d2d2d;
      border-color: #444;
    }

    .output-link {
      color: #ced4da;
    }
  }

  @media (max-width: 768px) {
    .title {
      font-size: 3rem;
      margin-bottom: 2rem;
    }

    .input-section {
      flex-direction: column;
    }

    .input {
      font-size: 1rem;
      padding: 0.9rem 1.2rem;
    }

    .button {
      font-size: 0.95rem;
      padding: 0.9rem 1.5rem;
    }

    .output-container {
      padding: 1rem;
    }

    .output-link {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 2.5rem;
    }

    .arrow-down {
      font-size: 2rem;
    }
  }

  .footer {
    padding: 2rem 0 1.5rem;
    text-align: center;
  }

  .powered-by {
    margin: 0;
    font-size: 0.9rem;
    color: #6c757d;
  }

  .powered-by.deployed {
    margin-top: 0.25rem;
  }

  .tech {
    font-weight: 600;
    color: #28a745;
  }

  @media (prefers-color-scheme: dark) {
    .powered-by {
      color: #adb5bd;
    }

    .tech {
      color: #3dd56d;
    }
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #6c757d;
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s ease, background-color 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 6px;
  }

  .github-link:visited {
    color: #6c757d;
  }

  .github-link:hover {
    color: #28a745;
    background-color: rgba(40, 167, 69, 0.1);
    text-decoration: none;
  }

  .github-link svg {
    transition: transform 0.3s ease;
  }

  .github-link:hover svg {
    transform: scale(1.1);
  }

  @media (prefers-color-scheme: dark) {
    .github-link {
      color: #adb5bd;
    }

    .github-link:visited {
      color: #adb5bd;
    }

    .github-link:hover {
      color: #3dd56d;
      background-color: rgba(61, 213, 109, 0.1);
      text-decoration: none;
    }
  }
`;