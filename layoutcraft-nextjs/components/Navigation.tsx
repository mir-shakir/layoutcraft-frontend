'use client';

import React from 'react';

const Navigation = () => {

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  const handleSignupClick = () => {
    console.log('Signup clicked');
  };

  return (
    <header className="main-header">
      <div className="container">
        <nav className="main-nav">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1' }}></stop>
                    <stop offset="100%" style={{ stopColor: '#8b5cf6' }}></stop>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="8" fill="url(#brandGradient)"></rect>
                <path d="M12 12V28C12 32.4183 15.5817 36 20 36H36V20C36 15.5817 32.4183 12 28 12H20C20 12 20 20 20 20H28C28 20 28 28 28 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"></path>
                <circle cx="24" cy="24" r="2.5" fill="white" opacity="0.9"></circle>
              </svg>
            </div>
            <span className="logo-text">LayoutCraft</span>
          </a>

          <div className="nav-links">
            <a href="/pricing/" className="nav-link">Pricing</a>
            <a href="/blog/" className="nav-link">Blog</a>
            <a href="/faq/" className="nav-link">FAQ</a>
          </div>

          <div className="nav-actions">
            <button onClick={handleLoginClick} className="btn btn-secondary">Log In</button>
            <button onClick={handleSignupClick} className="btn btn-primary">Sign Up</button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
