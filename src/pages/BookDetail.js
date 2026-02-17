// src/pages/BookDetail.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiStar, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import booksService from '../services/books';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './Detail.css';

export default function BookDetail() {
  const { id } = useParams();
  const { addToReadlist, removeFromReadlist, isInReadlist } = useStore();

  const { data: book, isLoading } = useQuery(
    ['book-detail', id],
    () => booksService.getBookDetails(id),
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="detail-loading container" style={{ paddingTop: '6rem' }}>
        <div className="loading-spinner-large" style={{ margin: '8rem auto' }} />
      </div>
    );
  }

  if (!book) return null;

  const isSaved = isInReadlist(book.id);

  const handleToggleSave = () => {
    if (isSaved) {
      removeFromReadlist(book.id);
      toast('Removed from Reading List');
    } else {
      addToReadlist({ ...book, mediaType: 'book' });
      toast.success('Added to Reading List 📚');
    }
  };

  const olUrl = book.olKey ? `https://openlibrary.org${book.olKey}` : null;

  return (
    <div className="detail-page">
      {/* Background gradient for books */}
      <div className="detail-backdrop book-backdrop" />
      <div className="detail-backdrop-overlay" style={{ background: 'linear-gradient(to top, var(--bg-primary) 40%, rgba(10,8,5,0.7) 80%, rgba(30,20,5,0.3) 100%)' }} />

      <div className="detail-content container">
        {/* Back */}
        <Link to="/books" className="back-link">
          <FiArrowLeft /> Back to Books
        </Link>

        {/* HERO INFO */}
        <div className="detail-hero">
          {/* Cover */}
          <div className="detail-poster book-poster">
            {book.cover ? (
              <img src={book.cover} alt={book.title} />
            ) : (
              <div className="no-poster" style={{ height: '400px' }}>📖</div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="label" style={{ color: 'var(--gold)' }}>📚 Book</div>
            <h1 className="detail-title">{book.title}</h1>

            {/* Author */}
            {book.author && (
              <p className="book-author">by {book.author}</p>
            )}

            {/* Meta */}
            <div className="detail-meta">
              {book.rating && (
                <span className="badge badge-gold">
                  <FiStar fill="currentColor" size={12} />
                  {book.rating} / 5
                </span>
              )}
              {book.year && <span className="badge badge-accent">📅 {book.year}</span>}
              {book.pageCount && <span className="badge">📖 {book.pageCount} pages</span>}
            </div>

            {/* Subjects / Tags */}
            {book.subjects?.length > 0 && (
              <div className="chip-group">
                {book.subjects.slice(0, 6).map((s, i) => (
                  <span key={i} className="chip" style={{ cursor: 'default', fontSize: '0.78rem' }}>
                    {typeof s === 'string' ? s : s.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <p className="detail-overview">
                {book.description.length > 600
                  ? book.description.substring(0, 600) + '...'
                  : book.description}
              </p>
            )}

            {/* Actions */}
            <div className="detail-actions">
              <button
                className={`btn btn-primary btn-lg ${isSaved ? 'saved-btn' : ''}`}
                onClick={handleToggleSave}
                style={isSaved ? { background: 'var(--gold)', boxShadow: '0 4px 20px rgba(245,200,66,0.3)' } : {}}
              >
                {isSaved ? <BsBookmarkFill /> : <BsBookmark />}
                {isSaved ? 'In Reading List' : 'Add to Reading List'}
              </button>
              {olUrl && (
                <a href={olUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-lg">
                  <FiExternalLink /> Open Library
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
