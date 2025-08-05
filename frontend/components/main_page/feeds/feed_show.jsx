


import React, { useState, useRef, useEffect } from 'react';
import FloatingMessage from '../../common/FloatingMessage';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', domain: 'facebook.com' },
  { key: 'twitter', label: 'X (Twitter)', domain: 'twitter.com' },
  { key: 'instagram', label: 'Instagram', domain: 'instagram.com' },
  { key: 'linkedin', label: 'LinkedIn', domain: 'linkedin.com' },
  { key: 'youtube', label: 'YouTube', domain: 'youtube.com' },
  { key: 'tiktok', label: 'TikTok', domain: 'tiktok.com' },
  { key: 'pinterest', label: 'Pinterest', domain: 'pinterest.com' },
  { key: 'threads', label: 'Threads', domain: 'threads.net' }
];



const FeedShow = ({ feed, socialLinks, websiteLinks }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const errorTimeoutRef = useRef(null);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  // Example: simulate follow action (replace with real follow logic)
  const handleFollow = async (platform, username) => {
    try {
      // ...API call to follow...
      // If error 422 (already following):
      throw { response: { status: 422 }, message: 'Already following this profile.' };
    } catch (err) {
      let msg = 'An error occurred.';
      if (err.response && err.response.status === 422) {
        msg = 'You are already following this profile.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const groupedWebsiteLinks = {};
  websiteLinks.forEach(link => {
    try {
      const domain = new URL(link).hostname.replace('www.', '');
      if (!groupedWebsiteLinks[domain]) {
        groupedWebsiteLinks[domain] = [];
      }
      groupedWebsiteLinks[domain].push(link);
    } catch (e) {
      // Invalid URL, skip
    }
  });

  return (
    <>
      <FloatingMessage message={errorMessage} onClose={() => setErrorMessage("")} type="error" />
      {/* TEST BUTTON: Remove after confirming error message works */}
      <button
        style={{ position: 'fixed', top: 80, right: 24, zIndex: 10000, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={() => setErrorMessage('This is a test error message!')}
      >
        Show Test Error Message
      </button>
      <div className="feed-show-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          <div className="website-section" style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              {feed.favicon_url && (
                <img src={feed.favicon_url} alt="Website favicon" style={{ width: '40px', height: '40px' }} />
              )}
              <div>
                <h2 style={{ margin: 0 }}>{feed.title}</h2>
                {feed.website_url && (
                  <a 
                    href={feed.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#666', fontSize: '0.9em', wordBreak: 'break-all' }}
                  >
                    {feed.website_url}
                  </a>
                )}
              </div>
            </div>

            {feed.description && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px' }}>
                <h3 style={{ marginTop: 0, fontSize: '1.1em' }}>About</h3>
                <p style={{ margin: 0 }}>{feed.description}</p>
              </div>
            )}

            <div>
              <h3 style={{ marginTop: 0 }}>Website Sections</h3>
              {Object.keys(groupedWebsiteLinks).length > 0 ? (
                Object.entries(groupedWebsiteLinks).map(([domain, links]) => (
                  <div key={domain} style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>{domain}</h4>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                      {links.slice(0, 5).map((link, idx) => (
                        <li key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', wordBreak: 'break-all' }}>
                            {link.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>No additional website links found.</p>
              )}
            </div>
          </div>

          <div className="social-sections" style={{ flex: 1, minWidth: '320px' }}>
            <h2 style={{ color: '#333', marginTop: 0 }}>Social Media</h2>
            {/* TEST BUTTON: Remove after confirming error message works */}
            <button
              style={{ marginBottom: 18, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              onClick={() => setErrorMessage('This is a test error message!')}
            >
              Show Test Error Message
            </button>
            {SOCIAL_PLATFORMS.map((platform) => {
              const links = socialLinks[platform.key] || [];
              return (
                <div 
                  key={platform.key}
                  style={{
                    backgroundColor: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${links.length ? '#28a745' : '#ddd'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: links.length ? '#e8f5e9' : '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {links.length ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1em' }}>{platform.label}</h3>
                    {/* Example follow button for demo/testing: */}
                    {/* {!links.length && (
                      <button onClick={() => handleFollow(platform.key, 'zahichreim')} style={{ marginLeft: 12, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>Follow</button>
                    )} */}
                  </div>
                  
                  {links.length > 0 && (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: '10px 0 0 0' }}>
                      {links.map((link, idx) => (
                        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', wordBreak: 'break-all' }}
                          >
                            {link.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedShow;