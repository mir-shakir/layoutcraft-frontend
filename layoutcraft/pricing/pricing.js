import { authService } from '../shared/js/authService.js';

// Configuration
const PADDLE_CONFIG = {
    clientSideToken: 'test_d1dafba6ff4dc4f4f07c65c1404', // Replace with your actual client-side token
    environment: 'sandbox', // Change to 'production' for live
    theme: 'light',
    displayMode: 'overlay' // Changed from 'overlay' to avoid CSP issues
};

// Track initialization state
let paddleInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    await initializePaddle();
    setupUpgradeButtons();
    await updateButtonStates();
});

/**
 * Initialize Paddle SDK
 */
async function initializePaddle() {
    if (paddleInitialized) return;

    try {
        // Set environment first
        Paddle.Environment.set(PADDLE_CONFIG.environment);
        
        // Initialize Paddle with CSP-friendly settings
        await Paddle.Initialize({
            token: PADDLE_CONFIG.clientSideToken,
            eventCallback: handlePaddleEvents,
            checkout: {
                settings: {
                    displayMode: PADDLE_CONFIG.displayMode,
                    theme: PADDLE_CONFIG.theme,
                    locale: "en",
                    // Add CSP-friendly options
                    allowedPaymentMethods: ["card", "paypal"],
                    showAddTaxId: false,
                    showAddDiscounts: false
                }
            }
        });
        
        paddleInitialized = true;
        console.log('✅ Paddle initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Paddle:', error);
        // Still allow the page to function without Paddle
    }
}

/**
 * Handle Paddle events
 */
function handlePaddleEvents(data) {
    console.log('Paddle Event:', data);
    
    switch (data.name) {
        case 'checkout.loaded':
            console.log('Checkout loaded');
            break;
            
        case 'checkout.completed':
            console.log('Payment successful!', data.data);
            handlePaymentSuccess(data.data);
            break;
            
        case 'checkout.closed':
            console.log('Checkout closed');
            break;
            
        case 'checkout.error':
            console.error('Checkout error:', data.data);
            handlePaymentError(data.data);
            break;
            
        default:
            console.log('Unhandled Paddle event:', data.name, data.data);
    }
}

/**
 * Handle successful payment
 */
function handlePaymentSuccess(paymentData) {
    // Show success message
    showNotification('Payment successful! Your subscription is now active.', 'success');
    
    // Refresh the page to update subscription status
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

/**
 * Handle payment errors
 */
function handlePaymentError(errorData) {
    console.error('Payment error:', errorData);
    showNotification('Payment failed. Please try again or contact support.', 'error');
}

/**
 * Setup upgrade button event listeners
 */
function setupUpgradeButtons() {
    const proButton = document.getElementById('upgrade-pro-btn');
    const maxButton = document.getElementById('upgrade-max-btn');

    if (proButton) {
        proButton.addEventListener('click', (e) => handleUpgradeClick(e, 'pro'));
    }
    if (maxButton) {
        maxButton.addEventListener('click', (e) => handleUpgradeClick(e, 'max'));
    }
}

/**
 * Update button states based on user's current subscription
 */
async function updateButtonStates() {
    if (!authService.hasToken()) return;

    try {
        const response = await fetch(`${authService.apiBaseUrl}/paddle/subscription-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authService.getToken()}`
            }
        });

        if (!response.ok) return; // Fail silently, buttons will show default state

        const data = await response.json();
        const currentTier = data.subscription_tier || 'free';

        updateButtonsForTier(currentTier);
    } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        // Fail silently, buttons will show default state
    }
}

/**
 * Update button text and state based on current subscription tier
 */
function updateButtonsForTier(currentTier) {
    const proButton = document.getElementById('upgrade-pro-btn');
    const maxButton = document.getElementById('upgrade-max-btn');

    if (currentTier === 'pro') {
        if (proButton) {
            proButton.textContent = '✓ Current Plan';
            proButton.className = 'btn btn-success';
            proButton.disabled = true;
        }
        if (maxButton) {
            maxButton.textContent = 'Upgrade to Max';
        }
    } else if (currentTier === 'max') {
        if (proButton) {
            proButton.textContent = 'Downgrade to Pro';
            proButton.className = 'btn btn-secondary';
        }
        if (maxButton) {
            maxButton.textContent = '✓ Current Plan';
            maxButton.className = 'btn btn-success';
            maxButton.disabled = true;
        }
    }
}

/**
 * Handle upgrade button clicks
 */
async function handleUpgradeClick(event, plan) {
    event.preventDefault();

    if (!authService.hasToken()) {
        if (window.layoutCraftNav) window.layoutCraftNav.openAuthModal('signup');
        return;
    }

    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;

    try {
        const response = await fetch(`${authService.apiBaseUrl}/paddle/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authService.getToken()}`
            },
            body: JSON.stringify({ plan_id: plan })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Could not create checkout session.');
        }

        const data = await response.json();

        // --- THE FIX: Use the transaction_id directly from the backend response ---
        if (!data.transaction_id) {
            throw new Error('Invalid response from server: Missing transaction_id.');
        }
        
        Paddle.Environment.set('sandbox');
        
        await Paddle.Initialize({
            token: 'test_d1dafba6ff4dc4f4f07c65c1404', // Replace with your Client-side Token
            eventCallback: function(data) {
                if (data.name === 'checkout.completed') {
                    console.log('Payment successful!', data.data);
                    window.location.href = '/app/history/';
                }
            }
        });
        
        Paddle.Checkout.open({
            transactionId: data.transaction_id, // <-- Use the correct field here
            customer: {
                email: authService.getCurrentUser().email
            }
        });
        // --- END OF FIX ---

    } catch (error) {
        console.error('Upgrade failed:', error);
        alert(`Error: ${error.message}`);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

/**
 * Create checkout session via backend
 */
async function createCheckoutSession(plan) {
    try {
        const response = await fetch(`${authService.apiBaseUrl}/paddle/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authService.getToken()}`
            },
            body: JSON.stringify({ plan_id: plan })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { detail: `Server error: ${response.status}` };
            }
            
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Backend response:', data);
        
        if (!data.checkout_url) {
            throw new Error('No checkout URL received from server');
        }
        
        return data;
        
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

/**
 * Try to open Paddle checkout (may fail due to CSP)
 */
async function openPaddleCheckout(checkoutUrl) {
    try {
        // Method 1: Try to extract transaction ID
        const transactionId = extractTransactionIdFromUrl(checkoutUrl);
        console.log('Extracted transaction ID:', transactionId);
        
        if (transactionId && paddleInitialized) {
            // Try to open with Paddle SDK
            Paddle.Checkout.open({
                transactionId: transactionId,
                settings: {
                    displayMode: 'inline',
                    theme: 'light',
                    frameTarget: 'paddle-checkout-container',
                    frameInitialHeight: 450,
                    frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;'
                }
            });
            return; // Success
        }
        
        // Method 2: Try direct URL opening
        throw new Error('Could not extract transaction ID or Paddle not initialized');
        
    } catch (error) {
        console.error('Paddle SDK checkout failed:', error);
        throw error;
    }
}

/**
 * Open checkout URL in new window/tab (fallback method)
 */
function openCheckoutInNewWindow(checkoutUrl) {
    console.log('Opening checkout in new window:', checkoutUrl);
    
    // Open in new window with specific dimensions
    const popup = window.open(
        checkoutUrl,
        'paddle-checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
    );
    
    if (!popup) {
        // Popup blocked, fallback to same window
        showNotification('Please allow popups and try again, or click below to continue:', 'warning');
        
        // Create a manual link as final fallback
        const link = document.createElement('a');
        link.href = checkoutUrl;
        link.target = '_blank';
        link.textContent = 'Complete Payment';
        link.style.cssText = 'display: inline-block; margin-top: 10px; color: #3b82f6; text-decoration: underline;';
        
        document.body.appendChild(link);
        setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
        }, 10000);
    } else {
        showNotification('Checkout opened in new window. Please complete your payment there.', 'info');
        
        // Monitor popup for closure (user completed or cancelled)
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                // Refresh page to check subscription status
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }, 1000);
    }
}

/**
 * Extract transaction ID from various URL formats
 */
function extractTransactionIdFromUrl(url) {
    try {
        // Try different URL patterns
        const patterns = [
            /\/transaction\/([a-zA-Z0-9_-]+)/,
            /transactionId=([a-zA-Z0-9_-]+)/,
            /txn_([a-zA-Z0-9_-]+)/,
            /checkout\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        console.warn('Could not extract transaction ID from URL:', url);
        return null;
    } catch (error) {
        console.error('Error extracting transaction ID:', error);
        return null;
    }
}

/**
 * Handle upgrade errors
 */
function handleUpgradeError(error) {
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error.message.includes('Invalid plan')) {
        message = 'Invalid subscription plan selected.';
    } else if (error.message.includes('User email not found')) {
        message = 'Please complete your profile before subscribing.';
    } else if (error.message.includes('Server error: 500')) {
        message = 'Server temporarily unavailable. Please try again later.';
    } else if (error.message.includes('Server error: 400')) {
        message = 'Invalid request. Please refresh the page and try again.';
    } else if (error.message.includes('No checkout URL')) {
        message = 'Payment system error. Please contact support.';
    } else if (error.message) {
        message = error.message;
    }
    
    showNotification(message, 'error');
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        font-weight: 500;
        line-height: 1.4;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = message;
    
    // Add animation CSS if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, type === 'error' ? 8000 : 5000);
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}