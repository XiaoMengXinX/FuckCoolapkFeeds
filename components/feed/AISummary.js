import { useEffect, useState } from 'react';

const TYPE_INTERVAL_MS = 30;

// Reads the endpoint's server-sent events, one JSON object per event.
async function readEvents(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const event of events) {
            if (event.startsWith('data: ')) onEvent(JSON.parse(event.slice(6)));
        }
    }
}

const AISummary = ({ feedId }) => {
    // loading → (streaming →) done, or failed at any point
    const [status, setStatus] = useState('loading');
    const [text, setText] = useState('');
    const [model, setModel] = useState('');
    const [visibleLength, setVisibleLength] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const response = await fetch(`/summary/${encodeURIComponent(feedId)}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                // A cached summary arrives as JSON and is shown at once; a new one is streamed.
                if (response.headers.get('Content-Type')?.startsWith('application/json')) {
                    const summary = await response.json();
                    setText(summary.text);
                    setVisibleLength(summary.text.length);
                    setModel(summary.model);
                    setStatus('done');
                    return;
                }

                setStatus('streaming');
                let completed = false;
                await readEvents(response, (event) => {
                    if (event.model) setModel(event.model);
                    if (event.delta) setText((current) => current + event.delta);
                    if (event.done) completed = true;
                });
                setStatus(completed ? 'done' : 'failed');
            } catch {
                if (!controller.signal.aborted) setStatus('failed');
            }
        })();

        return () => controller.abort();
    }, [feedId]);

    // Reveals streamed text at a steady pace, speeding up when the backlog grows.
    useEffect(() => {
        if (visibleLength >= text.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisibleLength(text.length);
            return;
        }
        const timer = setTimeout(() => {
            setVisibleLength((n) => n + Math.max(1, Math.ceil((text.length - n) / 12)));
        }, TYPE_INTERVAL_MS);
        return () => clearTimeout(timer);
    }, [text, visibleLength]);

    if (status === 'failed') {
        return null;
    }

    const isTyping = status === 'streaming' || visibleLength < text.length;

    return (
        <div style={summaryStyles.container}>
            <div style={summaryStyles.header}>
                <div style={summaryStyles.heading}>
                    <span style={summaryStyles.icon}>✨</span>
                    <span style={summaryStyles.title}>AI 摘要</span>
                </div>
                <span style={summaryStyles.model}>{model}</span>
            </div>
            <div style={summaryStyles.content}>
                {!text ? (
                    // While loading, the label stays hidden briefly so a cached summary appears without it.
                    <span
                        className={status === 'loading' ? 'ai-summary-pending ai-summary-pending-delayed' : 'ai-summary-pending'}
                        style={summaryStyles.pending}
                    >
                        生成中
                    </span>
                ) : (
                    <>
                        {text.slice(0, visibleLength)}
                        {isTyping && <span className="ai-summary-caret" />}
                    </>
                )}
            </div>
            <div style={summaryStyles.disclaimer}>
                摘要由 AI 模型总结生成，内容仅供参考
            </div>
        </div>
    );
};

const summaryStyles = {
    container: {
        border: '1px solid var(--ai-summary-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        backgroundColor: 'var(--ai-summary-bg)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--ai-summary-header-color)',
    },
    heading: {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },
    icon: {
        marginRight: '6px',
        fontSize: '16px',
    },
    title: {
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    model: {
        fontSize: '12px',
        fontWeight: '400',
        textAlign: 'right',
        overflowWrap: 'anywhere',
        color: 'var(--ai-summary-disclaimer-color)',
    },
    content: {
        fontSize: '15px',
        lineHeight: '1.6',
        // Reserves one line so the card keeps its height while the summary loads.
        minHeight: '1.6em',
        color: 'var(--ai-summary-content-color)',
        marginBottom: '8px',
    },
    pending: {
        color: 'var(--ai-summary-disclaimer-color)',
    },
    disclaimer: {
        fontSize: '12px',
        color: 'var(--ai-summary-disclaimer-color)',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--ai-summary-separator)',
    },
};

export default AISummary;
