import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', style = {} }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-theme-toggle ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        padding: '0.45rem 0.85rem',
        borderRadius: '9999px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: 600,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...style,
      }}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          color: isDark ? 'var(--primary-accent)' : 'var(--secondary-accent)',
          transition: 'transform 0.3s ease',
          transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
        }}
      >
        <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
      </span>
      <span className="d-none d-sm-inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;
