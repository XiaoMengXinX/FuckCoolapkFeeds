import { styles } from '../../styles/feedStyles';

const AISummary = ({ summary }) => {
    if (!summary) {
        return null;
    }

    return (
        <div style={summaryStyles.container}>
            <div style={summaryStyles.header}>
                <span style={summaryStyles.icon}>✨</span>
                <span style={summaryStyles.title}>AI 摘要</span>
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
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--ai-summary-header-color)',
    },
    icon: {
        marginRight: '6px',
        fontSize: '16px',
    },
    title: {
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
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
