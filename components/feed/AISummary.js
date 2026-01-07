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
                摘要由 AI 模型总结生成，内容仅供参考，请仔细甄别
            </div>
        </div>
    );
};

const summaryStyles = {
    container: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#666',
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
        color: '#333',
        marginBottom: '8px',
    },
    disclaimer: {
        fontSize: '12px',
        color: '#999',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e8e8e8',
    },
};

export default AISummary;
