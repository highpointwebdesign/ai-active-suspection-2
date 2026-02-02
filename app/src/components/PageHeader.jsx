import React from 'react';

function PageHeader({
  title = 'Page Title',
  connected = true,
  onNetworkClick,
  showNetworkIcon = true
}) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {showNetworkIcon && (
        <div className="header-controls">
          <button
            className="network-settings-btn"
            title="Network Settings"
            onClick={onNetworkClick}
            disabled={!onNetworkClick}
            style={{ background: 'none', border: 'none', padding: 0, cursor: onNetworkClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
            type="button"
          >
            <svg
              width="28" height="28" viewBox="0 0 24 24"
              fill="none"
              stroke={connected ? '#16c79a' : '#888'}
              style={{ opacity: connected ? 1 : 0.6, transition: 'stroke 0.3s, opacity 0.3s' }}
              strokeWidth="2"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" fill={connected ? '#16c79a' : '#888'} />
              {!connected && (
                <line x1="4" y1="4" x2="20" y2="20" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}

export default PageHeader;
