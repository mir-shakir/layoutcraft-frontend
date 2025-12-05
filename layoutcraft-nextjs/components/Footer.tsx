import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="brandGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#6366f1' }}></stop>
                      <stop offset="100%" style={{ stopColor: '#8b5cf6' }}></stop>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="8" fill="url(#brandGradientFooter)"></rect>
                  <path d="M12 12V28C12 32.4183 15.5817 36 20 36H36V20C36 15.5817 32.4183 12 28 12H20C20 12 20 20 20 20H28C28 20 28 28 28 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"></path>
                  <circle cx="24" cy="24" r="2.5" fill="white" opacity="0.9"></circle>
                </svg>
              </div>
              <span className="logo-text">LayoutCraft</span>
            </div>
            <p className="footer-tagline">
              AI design tool for the rest of us.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="/app/">Create Design</a>
              <a href="/blog/">Blog</a>
              <a href="/about/">About</a>
              <a href="/faq/">FAQ</a>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <a href="/blog/posts/writing-better-prompts/">Prompt Guide</a>
              <a href="/app/">Templates</a>
              <a href="/faq/">Help</a>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <a href="/legal/terms.html">Terms</a>
              <a href="/legal/privacy.html">Privacy</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 LayoutCraft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
