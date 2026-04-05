// src/components/Comments.js
import React, { useState } from 'react';
import { FiSend, FiTrash2, FiUser } from 'react-icons/fi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Comments({ itemId }) {
  const [newComment, setNewComment] = useState('');
  const { getComments, addComment, deleteComment, currentUser } = useStore();
  const comments = getComments(itemId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(itemId, newComment.trim());
    setNewComment('');
    toast.success('Comment added!');
  };

  const handleDelete = (commentId) => {
    deleteComment(itemId, commentId);
    toast.success('Comment deleted');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="section comments-section">
      <h2 className="section-title">💬 Comments</h2>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-input-group">
          <div className="comment-avatar">
            {currentUser ? (
              <div className="user-avatar">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            ) : (
              <FiUser size={20} />
            )}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={currentUser ? "Share your thoughts..." : "Login to comment..."}
            className="comment-input"
            rows="3"
            disabled={!currentUser}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={!newComment.trim() || !currentUser}
          >
            <FiSend size={18} />
          </button>
        </div>
        {!currentUser && (
          <p className="comment-login-note">Please login to add comments.</p>
        )}
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to share your opinion!</p>
          </div>
        ) : (
          comments
            .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
            .map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-avatar">
                    <div className="user-avatar">
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="comment-meta">
                    <span className="comment-username">{comment.username}</span>
                    <span className="comment-timestamp">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                  {(currentUser && (currentUser.id === comment.userId || currentUser.username === comment.username)) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="comment-delete-btn"
                      title="Delete comment"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="comment-text">
                  {comment.text}
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  );
}