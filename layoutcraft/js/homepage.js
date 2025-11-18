// Homepage Interactions
document.addEventListener('DOMContentLoaded', () => {


    // ADD THIS NEW FUNCTION
    /**
     * Handles all call-to-action clicks on the homepage.
     * Checks if the user is logged in.
     * - If logged in, saves prompt data and redirects to /app/.
     * - If logged out, opens the authentication modal.
     * @param {object | null} promptData - The prompt data from a button, if any.
     */
    function handleCTAClick(promptData = null) {
        // The navigation module instance is attached to the window object by navigation.js
        const nav = window.layoutCraftNav;
        if (!nav || !nav.authService) {
            console.error("Navigation or AuthService not initialized.");
            alert("Something went wrong. Please refresh the page.");
            return;
        }

        if (nav.authService.hasToken() && !nav.authService.isTokenExpired()) {
            if (promptData) {
                sessionStorage.setItem('layoutcraft_initial_data', JSON.stringify(promptData));
            } else {
                sessionStorage.removeItem('layoutcraft_initial_data');
            }
            window.location.href = '/app/';
        } else {
            if (promptData) {
                // this data will be picked up by the auth modal after login/signup
                sessionStorage.setItem('layoutcraft_post_auth_prompt', JSON.stringify(promptData));
            } else {
                // Ensure old data is cleared if the new action has no prompt.
                sessionStorage.removeItem('layoutcraft_post_auth_prompt');
            }
            nav.openAuthModal('signup'); // Open the modalDefault to signup for new users
        }
    }
    // Hero input handling
    const heroInput = document.getElementById('hero-prompt');
    const heroButton = document.getElementById('hero-generate');
    const exampleChips = document.querySelectorAll('.example-chip');
    
    // Handle generate button click
    heroButton?.addEventListener('click', () => {
        const prompt = heroInput.value.trim();
        if (prompt) {
            const promptData = {
                prompt: prompt,
                template: "blog_header",
                style: "auto"
            };
            handleCTAClick(promptData);
        } else {
            // If the input is empty, still trigger the auth flow without a prompt
            handleCTAClick();
        }
    });

    // Handle enter key in input
    heroInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            heroButton.click();
        }
    });

    // Handle example chips
    const allExampleButtons = document.querySelectorAll('.example-chip, .example-try');
allExampleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const promptData = {
            prompt: btn.dataset.prompt,
            style: btn.dataset.style,
            template: btn.dataset.template
        };
        handleCTAClick(promptData);
    });
});
   
   // Smooth scroll for navigation
   document.querySelectorAll('a[href^="#"]').forEach(anchor => {
       anchor.addEventListener('click', function (e) {
           e.preventDefault();
           const target = document.querySelector(this.getAttribute('href'));
           if (target) { 
               target.scrollIntoView({
                   behavior: 'smooth',
                   block: 'start'
               });
           }
       });
   });

   // Intersection Observer for animations
   const observerOptions = {
       threshold: 0.1,
       rootMargin: '0px 0px -100px 0px'
   };
   
   const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
           if (entry.isIntersecting) {
               entry.target.classList.add('animate-in');
               observer.unobserve(entry.target);
           }
       });
   }, observerOptions);
   
   // Observe elements for animation
   document.querySelectorAll('.feature-card, .testimonial, .demo-card').forEach(el => {
       el.style.opacity = '0';
       el.style.transform = 'translateY(20px)';
       observer.observe(el);
   });
   
   // Add CSS for animations
   const style = document.createElement('style');
   style.textContent = `
       .animate-in {
           animation: fadeInUp 0.6s ease-out forwards;
       }
       
       @keyframes fadeInUp {
           to {
               opacity: 1;
               transform: translateY(0);
           }
       }
   `;
   document.head.appendChild(style);
   
   // Navbar scroll effect
   let lastScroll = 0;
   const nav = document.querySelector('.nav');
   
   window.addEventListener('scroll', () => {
       const currentScroll = window.pageYOffset;
       
       if (currentScroll > 100) {
           nav.style.background = 'rgba(255, 255, 255, 0.95)';
           nav.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
       } else {
           nav.style.background = 'rgba(255, 255, 255, 0.8)';
           nav.style.boxShadow = '';
       }
       
       lastScroll = currentScroll;
   });
   
   // Track scroll depth
   let maxScroll = 0;
   window.addEventListener('scroll', () => {
       const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
       if (scrollPercent > maxScroll) {
           maxScroll = scrollPercent;
           
           // Track milestones
           if (maxScroll > 25 && maxScroll < 30) {
               trackScrollMilestone(25);
           } else if (maxScroll > 50 && maxScroll < 55) {
               trackScrollMilestone(50);
           } else if (maxScroll > 75 && maxScroll < 80) {
               trackScrollMilestone(75);
           } else if (maxScroll > 90) {
               trackScrollMilestone(100);
           }
       }
   });
   
   function trackScrollMilestone(percent) {
       if (typeof gtag !== 'undefined') {
           gtag('event', 'scroll_depth', {
               event_category: 'Engagement',
               event_label: `${percent}%`,
               value: percent
           });
       }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'required') {
        // Use a small timeout to ensure navigation.js has fully loaded
        setTimeout(() => {
            window.layoutCraftNav?.openAuthModal(
                'signup', // Default to showing the signup form
                'Please sign up or log in to access the designer.' // The custom message
            );
        }, 100);

        // Clean the URL so the modal doesn't re-trigger on refresh
        history.replaceState(null, '', window.location.pathname);
    }
});