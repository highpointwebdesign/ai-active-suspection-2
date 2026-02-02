import React, { useEffect, useState } from 'react';
import './layout.css';

/**
 * TemplatePage - Use this as a starting point for new pages.
 * Includes a title, alert area, and instructions/info area.
 */
function TemplatePage({
  title = 'Page Title',
  alert,
  instructions,
  sections = null,
  children = null,
  onAlertDismiss
}) {
  const alertType = typeof alert === 'object' && alert !== null ? (alert.type || 'info') : 'info';
  const alertMessage = typeof alert === 'object' && alert !== null ? alert.message : alert;
  const [alertVisible, setAlertVisible] = useState(Boolean(alertMessage));

  useEffect(() => {
    setAlertVisible(Boolean(alertMessage));
  }, [alertMessage]);

  return (
    <>
      {alertMessage && alertVisible && (
        <div className={`template-alert template-alert--${alertType}`}>
          <span className="template-alert-message">{alertMessage}</span>
          <button
            type="button"
            className="template-alert-close"
            aria-label="Dismiss alert"
            onClick={() => {
              setAlertVisible(false);
              if (onAlertDismiss) onAlertDismiss();
            }}
          >
            ×
          </button>
        </div>
      )}
      <div className="template-page">
        <div className="template-title">
          <h2>{title}</h2>
        </div>
        <div className="template-content">
          {Array.isArray(sections) && sections.length > 0 ? (
            <div className="template-sections">
              {sections.map((section, index) => (
                <section className="template-section" key={index}>
                  {section?.title && <h3 className="template-section-title">{section.title}</h3>}
                  <div className="template-section-content">
                    {section?.content}
                  </div>
                  {section?.info && (
                    <div className="template-section-info">
                      {section.info}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <>
              {children}
              {instructions && (
                <div className="template-info-box">
                  {instructions}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default TemplatePage;
