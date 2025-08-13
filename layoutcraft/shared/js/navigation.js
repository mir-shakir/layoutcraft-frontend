/*
=================================================================
 FILE 2: /shared/js/navigation.js (FINAL, CORRECTED VERSION)
=================================================================
This file now correctly handles the signup flow by delegating to
the authService and then switching the UI to login mode.
*/

import { authService } from './authService.js';

class LayoutCraftNav {
    constructor() {
        this.authService = authService;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.mobileMenuOpen = false;
        this.profileDropdownOpen = false;
        this.authModalOpen = false;
        this.authMode = 'login';

        this.checkAuth();
        this.renderUI();
        this.setupEventListeners();
    }

    checkAuth() {
        this.isLoggedIn = this.authService.hasToken();
        if (this.isLoggedIn) {
            this.currentUser = this.authService.getCurrentUser();
        }
    }

    async handleAuthSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitBtn = document.getElementById('auth-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
        this.hideAuthError();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            if (this.authMode === 'login') {
                const response = await this.authService.login({ email: data.email, password: data.password });
                
                this.checkAuth();
                this.closeAuthModal();
                this.renderUI();
                this.showSuccessMessage(`Welcome back, ${response.user.full_name || response.user.email}!`);
                document.dispatchEvent(new CustomEvent('authChange'));

            } else {
                // --- CORRECTED SIGNUP LOGIC (INSPIRED BY SCRIPTS.JS) ---
                if (data.password.length < 6) {
                    throw new Error('Password must be at least 6 characters long.');
                }
                
                await this.authService.register({ full_name: data.full_name, email: data.email, password: data.password });
                
                // Show success and switch to login mode instead of auto-logging in.
                this.showSuccessMessage('Registration successful! Please log in to continue.');
                this.openAuthModal('login');
                // --- END OF FIX ---
            }
        } catch (error) {
            this.showAuthError(error.message);
        } finally {
            // Reset button state only if the modal is still open
            if (this.authModalOpen) {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        }
    }

    handleLogout() {
        this.authService.logout();
        this.isLoggedIn = false;
        this.currentUser = null;
        this.closeMobileMenu();
        this.renderUI();
        this.showSuccessMessage('You have been logged out successfully.');
        document.dispatchEvent(new CustomEvent('authChange'));
    }

    // --- All other functions (renderUI, renderNav, etc.) remain the same ---
    renderUI() {
        this.renderNav();
        this.renderMobileMenu();
        if (!document.getElementById('auth-modal')) {
            this.renderAuthModal();
        }
        this.updateActiveNavLink();
    }
    
    updateActiveNavLink() {
        const currentPagePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            try {
                const linkUrl = new URL(link.href);
                let linkPath = linkUrl.pathname.endsWith('/') ? linkUrl.pathname : linkUrl.pathname + '/';
                if (linkPath === currentPagePath) {
                    link.classList.add('active');
                }
            } catch (e) {}
        });
    }

    renderNav() {
        const navElement = document.getElementById('main-navigation');
        if (!navElement) return;
        const isAppPage = window.location.pathname.includes('/app');
        navElement.innerHTML = `<nav class="nav"><div class="container"><div class="nav-wrapper"><a href="/" class="logo"><div class="logo-icon"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6366f1;"/><stop offset="100%" style="stop-color:#8b5cf6;"/></linearGradient></defs><rect width="48" height="48" rx="8" fill="url(#brandGradient)"/><path d="M12 12V28C12 32.4183 15.5817 36 20 36H36V20C36 15.5817 32.4183 12 28 12H20C20 12 20 20 20 20H28C28 20 28 28 28 28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/><circle cx="24" cy="24" r="2.5" fill="white" opacity="0.9"/></svg></div><span class="logo-text">LayoutCraft</span></a><div class="nav-links desktop-nav"><a href="/about/" class="nav-link">About</a><a href="/blog/" class="nav-link">Blog</a><a href="/faq/" class="nav-link">FAQ</a><a href="/faq/" class="nav-link">FAQ</a><a href="/pricing/" class="nav-link">Pricing</a>${this.renderAuthSection()}${!isAppPage ? '<a href="/app/" class="nav-link nav-cta">Launch App →</a>' : ''}</div><button class="mobile-menu-btn" id="mobile-menu-btn" type="button"><svg class="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg><svg class="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button></div></div></nav>`;
    }

    renderMobileMenu() {
        const existingMenu = document.getElementById('mobile-menu');
        if (existingMenu) existingMenu.remove();
        const isAppPage = window.location.pathname.includes('/app');
        const mobileMenuHTML = `<div class="mobile-menu" id="mobile-menu"><div class="mobile-menu-content"><a href="/" class="mobile-nav-link">Home</a><a href="/about/" class="mobile-nav-link">About</a><a href="/blog/" class="mobile-nav-link">Blog</a><a href="/faq/" class="mobile-nav-link">FAQ</a><a href="/pricing/" class="mobile-nav-link">Pricing</a><div class="mobile-divider"></div>${this.renderMobileAuthSection()}${!isAppPage ? '<a href="/app/" class="mobile-nav-link mobile-cta">Launch App →</a>' : ''}</div></div>`;
        document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);
    }

    renderAuthModal() {
        const authModalHTML = `<div class="auth-modal-overlay" id="auth-modal"><div class="auth-modal-content"><button class="auth-modal-close" type="button"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button><h2 class="auth-modal-title" id="auth-modal-title">Welcome Back</h2><p class="auth-modal-subtitle" id="auth-modal-subtitle">Log in to continue your work.</p><form id="auth-form"><div class="auth-form-group" id="name-group" style="display: none;"><label for="auth-name">Full Name</label><input type="text" id="auth-name" name="full_name" placeholder="John Doe"></div><div class="auth-form-group"><label for="auth-email">Email</label><input type="email" id="auth-email" name="email" required placeholder="you@example.com"></div><div class="auth-form-group"><label for="auth-password">Password</label><input type="password" id="auth-password" name="password" required minlength="6" placeholder="••••••••"></div><div class="auth-error" id="auth-error" style="display: none;"></div><button type="submit" class="auth-submit-btn" id="auth-submit-btn"><span class="btn-text">Log In</span><span class="btn-loading" style="display: none;">Processing...</span></button></form><div class="auth-toggle"><span id="auth-toggle-text">Don't have an account?</span><button type="button" data-auth-toggle id="auth-toggle-btn">Sign Up</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', authModalHTML);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const logo = e.target.closest('.logo');
            if (logo && window.location.pathname === '/') { e.preventDefault(); return; }
            if (e.target.closest('#mobile-menu-btn')) { e.preventDefault(); this.toggleMobileMenu(); return; }
            if (e.target.closest('.profile-btn')) { e.preventDefault(); this.toggleProfileDropdown(); return; }
            if (!e.target.closest('.profile-dropdown-container')) { this.closeProfileDropdown(); }
            if (e.target.closest('[data-auth-login]')) { e.preventDefault(); this.openAuthModal('login'); }
            if (e.target.closest('[data-auth-signup]')) { e.preventDefault(); this.openAuthModal('signup'); }
            if (e.target.closest('[data-auth-logout]')) { e.preventDefault(); this.handleLogout(); }
            if (e.target.closest('[data-auth-toggle]')) { e.preventDefault(); this.toggleAuthMode(); }
            if (e.target.id === 'auth-modal' || e.target.closest('.auth-modal-close')) { e.preventDefault(); this.closeAuthModal(); }
        });
        document.addEventListener('submit', (e) => { if (e.target.id === 'auth-form') this.handleAuthSubmit(e); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { this.closeAuthModal(); this.closeMobileMenu(); this.closeProfileDropdown(); }
        });
    }
    
    renderAuthSection() {
        if (this.isLoggedIn) {
            return `<div class="profile-dropdown-container"><button class="profile-btn" type="button"><div class="profile-avatar">${this.currentUser?.full_name?.charAt(0) || this.currentUser?.email?.charAt(0) || 'U'}</div><span class="profile-name">${this.currentUser?.full_name || this.currentUser?.email || 'User'}</span><svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="profile-dropdown" id="profile-dropdown"><button class="dropdown-item" type="button" data-auth-logout>Logout</button></div></div>`;
        } else {
            return `<button class="nav-link nav-link-btn" type="button" data-auth-login>Log In</button><button class="nav-link nav-signup-btn" type="button" data-auth-signup>Sign Up</button>`;
        }
    }
    
    renderMobileAuthSection() {
        if (this.isLoggedIn) {
            return `<div class="mobile-profile-section"><div class="mobile-profile-info"><div class="profile-avatar">${this.currentUser?.full_name?.charAt(0) || this.currentUser?.email?.charAt(0) || 'U'}</div><span>${this.currentUser?.full_name || this.currentUser?.email || 'User'}</span></div><button class="mobile-nav-link logout-link" type="button" data-auth-logout>Logout</button></div>`;
        } else {
            return `<button class="mobile-nav-link" type="button" data-auth-login>Log In</button><button class="mobile-nav-link mobile-signup" type="button" data-auth-signup>Sign Up</button>`;
        }
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (this.mobileMenuOpen) { mobileMenu.classList.add('active'); menuBtn.classList.add('active'); document.body.style.overflow = 'hidden'; } 
        else { this.closeMobileMenu(); }
    }
    
    closeMobileMenu() {
        this.mobileMenuOpen = false;
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    toggleProfileDropdown() {
        this.profileDropdownOpen = !this.profileDropdownOpen;
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.classList.toggle('active', this.profileDropdownOpen);
    }
    
    closeProfileDropdown() {
        if (!this.profileDropdownOpen) return;
        this.profileDropdownOpen = false;
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
    
    openAuthModal(mode = 'login') {
        this.authMode = mode; this.authModalOpen = true;
        const modal = document.getElementById('auth-modal');
        if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        const title = document.getElementById('auth-modal-title');
        const subtitle = document.getElementById('auth-modal-subtitle');
        const nameGroup = document.getElementById('name-group');
        const submitBtn = document.getElementById('auth-submit-btn');
        const toggleText = document.getElementById('auth-toggle-text');
        const toggleBtn = document.getElementById('auth-toggle-btn');
        if (mode === 'signup') { title.textContent = 'Create an Account'; subtitle.textContent = 'Join LayoutCraft to unlock all features.'; nameGroup.style.display = 'block'; submitBtn.querySelector('.btn-text').textContent = 'Sign Up'; toggleText.textContent = 'Already have an account?'; toggleBtn.textContent = 'Log In'; } 
        else { title.textContent = 'Welcome Back'; subtitle.textContent = 'Log in to continue your work.'; nameGroup.style.display = 'none'; submitBtn.querySelector('.btn-text').textContent = 'Log In'; toggleText.textContent = "Don't have an account?"; toggleBtn.textContent = 'Sign Up'; }
        document.getElementById('auth-form').reset();
        this.hideAuthError(); this.closeMobileMenu();
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
    
    closeAuthModal() {
        this.authModalOpen = false;
        const modal = document.getElementById('auth-modal');
        if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    }
    
    toggleAuthMode() {
        this.authMode = this.authMode === 'login' ? 'signup' : 'login';
        this.openAuthModal(this.authMode);
    }
    
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
    }
    
    hideAuthError() {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) errorEl.style.display = 'none';
    }
    
    showSuccessMessage(message) {
        let toast = document.getElementById('success-toast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'success-toast'; toast.className = 'success-toast'; document.body.appendChild(toast); }
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => { toast.classList.remove('active'); }, 3000);
    }
}

// Export the class so it can be imported in the HTML
const layoutCraftNav = new LayoutCraftNav(authService);
export { layoutCraftNav };