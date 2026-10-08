const AISummary = ({ summary, model }) => {
    if (!summary) {
        return null;
    }

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
                {summary}
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
        color: 'var(--ai-summary-content-color)',
        marginBottom: '8px',
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
