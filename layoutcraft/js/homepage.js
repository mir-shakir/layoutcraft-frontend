// Homepage Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Hero input handling
    const heroInput = document.getElementById('hero-prompt');
    const heroButton = document.getElementById('hero-generate');
    const exampleChips = document.querySelectorAll('.example-chip');
    
    // Handle generate button click
    heroButton?.addEventListener('click', () => {
        const prompt = heroInput.value.trim();
        if (prompt) {
            // Encode and redirect to app with prompt
            // const encoded = encodeURIComponent(prompt);
            const promptData = {
                prompt: prompt,
                template: "blog_header",
                style:"auto"

            };
            sessionStorage.setItem('layoutcraft_initial_data', JSON.stringify(promptData));
            window.location.href = '/app/';
            console.log("hero button promt used")

            // Track event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'homepage_generate', {
                    event_category: 'Engagement',
                    event_label: 'hero_cta'
                });
            }
        } else {
            // Highlight input if empty
            heroInput.focus();
            heroInput.style.borderColor = '#ef4444';
            setTimeout(() => {
                heroInput.style.borderColor = '';
            }, 2000);
        }
    });

    // Handle enter key in input
    heroInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            heroButton.click();
        }
    });

    // Handle example chips
    exampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptData = {
                prompt: chip.dataset.prompt,
                style: chip.dataset.style, // Assumes you add data-style="..."
                template: chip.dataset.template // Assumes you add data-template="..."
            };
            sessionStorage.setItem('layoutcraft_initial_data', JSON.stringify(promptData));
            window.location.href = '/app/';
            // Track example usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'use_homepage_chip', {
                    event_category: 'Engagement',
                    event_label: chip.textContent.trim()
                });
            }
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


   // Add this to the existing homepage.js

// Handle example "Try This" buttons
document.querySelectorAll('.example-try').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const promptData = {
            prompt: btn.dataset.prompt,
            style: btn.dataset.style,
            template: btn.dataset.template
        };
        sessionStorage.setItem('layoutcraft_initial_data', JSON.stringify(promptData));
       window.location.href = '/app/';
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'try_example', {
                event_category: 'Engagement',
                event_label: 'homepage_example'
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
});