import React from 'react';
import { User, Paperclip, Clock } from 'lucide-react';
import styles from './InteractionHistory.module.css';

interface Comment {
    publicId: string;
    text: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
        role: string;
    };
    attachments?: Array<{
        originalName: string;
        url: string;
    }>;
}

interface InteractionHistoryProps {
    comments: Comment[];
}

import { BASE_URL } from '../../api/api';

const InteractionHistory: React.FC<InteractionHistoryProps> = ({ comments }) => {
    if (!comments || comments.length === 0) {
        return null;
    }

    const getAttachmentUrl = (url: string) => {
        if (!url) return '';
        try {
            // Check if it's already a full URL
            const urlObj = new URL(url);
            // If it matches our BASE_URL origin, return as is.
            // If mismatch (e.g. backend internal ip vs localhost), replace origin with BASE_URL
            if (urlObj.pathname.startsWith('/uploads')) {
                // Remove trailing slash from BASE_URL if present to avoid double slash, 
                // but BASE_URL usually doesn't have it.
                // Safest: use the path from the url and append to BASE_URL
                return `${BASE_URL}${urlObj.pathname}`;
            }
            return url;
        } catch (e) {
            // Relative path case
            return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return diffMins + 'min atrás';
        if (diffHours < 24) return diffHours + 'h atrás';
        return diffDays + 'd atrás';
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'INSPECTOR':
                return 'Fiscal';
            case 'RT':
                return 'RT';
            default:
                return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'INSPECTOR':
                return '#f59e0b';
            case 'RT':
                return '#3b82f6';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className={styles.historyContainer}>
            <h4 className={styles.historyTitle}>
                <Clock size={16} />
                Histórico de Interações
            </h4>
            <div className={styles.timeline}>
                {comments.map((comment, index) => (
                    <div key={comment.publicId} className={styles.timelineItem}>
                        <div
                            className={styles.timelineDot}
                            style={{ backgroundColor: getRoleColor(comment.user.role) }}
                        />
                        {index < comments.length - 1 && <div className={styles.timelineLine} />}

                        <div className={styles.commentCard}>
                            <div className={styles.commentHeader}>
                                <div className={styles.userInfo}>
                                    <User size={14} />
                                    <span className={styles.userName}>{comment.user.name}</span>
                                    <span
                                        className={styles.userRole}
                                        style={{ color: getRoleColor(comment.user.role) }}
                                    >
                                        {getRoleLabel(comment.user.role)}
                                    </span>
                                </div>
                                <span className={styles.timestamp}>
                                    {getTimeAgo(comment.createdAt)}
                                </span>
                            </div>

                            <p className={styles.commentText}>{comment.text}</p>

                            {comment.attachments && comment.attachments.length > 0 && (
                                <div className={styles.attachmentsList}>
                                    {comment.attachments.map((attachment, idx) => (
                                        <a
                                            key={idx}
                                            href={getAttachmentUrl(attachment.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.attachmentLink}
                                            title="Clique para baixar"
                                        >
                                            <Paperclip size={14} />
                                            <span>{attachment.originalName || 'Anexo'}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InteractionHistory;
