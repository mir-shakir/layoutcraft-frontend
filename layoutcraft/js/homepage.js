// Homepage Interactions
document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE MANAGEMENT ---
    // We use a Set to track multiple selections
    const selectedFormats = new Set(['blog_header']); 
    const heroStyleSelect = document.getElementById('hero-style');
    const heroInput = document.getElementById('hero-prompt');
    const heroButton = document.getElementById('hero-generate');
    
    // --- 1. HERO INTERFACE LOGIC ---

    // Handle Dimension Pills (Multi-Select Logic)
    const dimensionPills = document.querySelectorAll('#hero-dimensions .pill');
    
    dimensionPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const value = target.dataset.value;

            // Special handling for "All Formats"
            if (value === 'multi') {
                const isCurrentlyActive = target.classList.contains('active');
                
                // Reset UI
                dimensionPills.forEach(p => p.classList.remove('active'));
                selectedFormats.clear();

                if (!isCurrentlyActive) {
                    target.classList.add('active');
                    selectedFormats.add('multi');
                } else {
                    // If unselecting all, default back to blog_header
                    const defaultPill = document.querySelector('.pill[data-value="blog_header"]');
                    if(defaultPill) defaultPill.classList.add('active');
                    selectedFormats.add('blog_header');
                }
                return;
            }

            // Regular Pill Logic
            // If "All Formats" was previously active, clear it
            if (selectedFormats.has('multi')) {
                selectedFormats.clear();
                document.querySelector('.pill[data-value="multi"]')?.classList.remove('active');
            }

            if (target.classList.contains('active')) {
                // Don't allow deselecting the last item
                if (selectedFormats.size > 1) {
                    target.classList.remove('active');
                    selectedFormats.delete(value);
                }
            } else {
                target.classList.add('active');
                selectedFormats.add(value);
            }
        });
    });

    // Typewriter Logic
    const prompts = [
        "Describe your campaign...",
        "Summer Sale for Organic Coffee Brand, 50% off",
        "Launch announcement for new AI SaaS tool",
        "Minimalist furniture showcase, cream background",
        "Tech conference poster, dark neon style"
    ];
    
    let promptIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 50;
    let isUserInteracting = false;

    function typeWriter() {
        if (isUserInteracting || !heroInput) return;

        const currentPrompt = prompts[promptIndex];
        
        if (isDeleting) {
            heroInput.placeholder = currentPrompt.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 30;
        } else {
            heroInput.placeholder = currentPrompt.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 80;
        }

        if (!isDeleting && charIndex === currentPrompt.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            promptIndex = (promptIndex + 1) % prompts.length;
            typeSpeed = 500; // Pause before next
        }

        setTimeout(typeWriter, typeSpeed);
    }

    // Start typewriter
    if(heroInput) {
        setTimeout(typeWriter, 1000);
        
        heroInput.addEventListener('focus', () => {
            isUserInteracting = true;
            heroInput.placeholder = "Describe your campaign...";
        });
        
        heroInput.addEventListener('blur', () => {
            if(heroInput.value === '') {
                isUserInteracting = false;
                typeWriter();
            }
        });

        // Handle enter key
        heroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                heroButton.click();
            }
        });
    }

    // --- 2. CHIPS LOGIC (Populate Form) ---
    // This handles the chips in the hero section. They simply fill the form.
    const chipButtons = document.querySelectorAll('.example-chip');
    chipButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Populate Prompt
            if(heroInput) {
                heroInput.value = btn.dataset.prompt;
                heroInput.focus();
                // Scroll to composer on mobile
                heroInput.closest('.hero-composer')?.scrollIntoView({behavior: "smooth", block: "center"});
            }

            // 2. Update Style UI
            if(heroStyleSelect) {
                heroStyleSelect.value = btn.dataset.style;
                // Visual feedback
                heroStyleSelect.style.borderColor = '#6366f1';
                setTimeout(() => heroStyleSelect.style.borderColor = '', 500);
            }

            // 3. Update Pills UI
            const template = btn.dataset.template;
            dimensionPills.forEach(p => p.classList.remove('active'));
            selectedFormats.clear();
            
            // Special check for 'multi' vs specific template
            if (template === 'multi') {
                const multiPill = document.querySelector('.pill[data-value="multi"]');
                if(multiPill) {
                    multiPill.classList.add('active');
                    selectedFormats.add('multi');
                }
            } else {
                const matchingPill = document.querySelector(`.pill[data-value="${template}"]`);
                if(matchingPill) {
                    matchingPill.classList.add('active');
                    selectedFormats.add(template);
                }
            }

            // Stop typewriter
            isUserInteracting = true;
        });
    });

    // --- 3. CAMPAIGN SHOWCASE LOGIC ---
    const campaigns = {
        saas: {
            promptHTML: `"Launch campaign for <strong>TaskFlow</strong>. Tagline: 'Automate the Boring Stuff'. Style: <strong>Modern SaaS</strong>, deep blue with glowing accents."`,
            promptText: "Launch campaign for TaskFlow. Tagline: 'Automate the Boring Stuff'. Style: Modern SaaS, deep blue with glowing accents.",
            style: "dark_neon_tech",
            images: {
                story: "/assets/images/campaign-saas-story.png",
                post: "/assets/images/campaign-saas-post.png",
                banner: "/assets/images/campaign-saas-banner.png",
                twitter: "/assets/images/campaign-saas-banner.png",
                youtube: "/assets/images/campaign-saas-banner.png"
            }
        },
        ecommerce: {
            promptHTML: `"Spring Sale for <strong>Urban Roots</strong> plants. Headline: 'Bring Nature Home'. Style: <strong>Minimal & Earthy</strong>, sage green and cream."`,
            promptText: "Spring Sale for Urban Roots plants. Headline: 'Bring Nature Home'. Style: Minimal & Earthy, sage green and cream.",
            style: "minimal_luxury_space",
            images: {
                story: "/assets/images/campaign-eco-story.png",
                post: "/assets/images/campaign-eco-post.png",
                banner: "/assets/images/campaign-eco-banner.png",
                twitter: "/assets/images/campaign-eco-banner.png",
                youtube: "/assets/images/campaign-eco-banner.png"
            }
        },
        event: {
            promptHTML: `"Tech conference <strong>DevSummit 2025</strong>. Headline: 'The Future of Code'. Style: <strong>Neon Cyber</strong>, electric blue and hot pink."`,
            promptText: "Tech conference DevSummit 2025. Headline: 'The Future of Code'. Style: Neon Cyber, electric blue and hot pink.",
            style: "dark_neon_tech",
            images: {
                story: "/assets/images/campaign-event-story.png",
                post: "/assets/images/campaign-event-post.png",
                banner: "/assets/images/campaign-event-banner.png",
                twitter: "/assets/images/campaign-event-banner.png",
                youtube: "/assets/images/campaign-event-banner.png"
            }
        },
        realestate: {
            promptHTML: `"Open House for <strong>Apex Realty</strong>. Headline: 'Modern Living Redefined'. Style: <strong>Luxury</strong>, clean white with gold accents."`,
            promptText: "Open House for Apex Realty. Headline: 'Modern Living Redefined'. Style: Luxury, clean white with gold accents.",
            style: "minimal_luxury_space",
            images: {
                story: "/assets/images/campaign-re-story.png",
                post: "/assets/images/campaign-re-post.png",
                banner: "/assets/images/campaign-re-banner.png",
                twitter: "/assets/images/campaign-re-banner.png",
                youtube: "/assets/images/campaign-re-banner.png"
            }
        }
    };

    const tabs = document.querySelectorAll('.campaign-tab');
    const promptEl = document.getElementById('dynamic-prompt-text');
    const btnEl = document.getElementById('dynamic-try-btn');
    const usePromptBtn = document.getElementById('btn-use-prompt');

    function updateCampaignState(key) {
        const data = campaigns[key];
        
        // Update big bottom button
        if(btnEl) {
            btnEl.dataset.prompt = data.promptText;
            btnEl.dataset.style = data.style;
        }

        // Update small internal button
        if(usePromptBtn) {
            usePromptBtn.dataset.prompt = data.promptText;
            usePromptBtn.dataset.style = data.style;
        }
    }

    updateCampaignState('saas');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const key = tab.dataset.target;
            const data = campaigns[key];

            // Update buttons data immediately
            updateCampaignState(key);

            // Handle Images (Fade out/in logic)
            const allImages = document.querySelectorAll('.marquee-track img');
            allImages.forEach(img => img.style.opacity = '0.5');

            setTimeout(() => {
                promptEl.innerHTML = data.promptHTML;
                
                // Update all images
                document.querySelectorAll('.img-story').forEach(img => img.src = data.images.story);
                document.querySelectorAll('.img-post').forEach(img => img.src = data.images.post);
                document.querySelectorAll('.img-banner').forEach(img => img.src = data.images.banner);
                document.querySelectorAll('.img-twitter').forEach(img => img.src = data.images.twitter);
                document.querySelectorAll('.img-youtube').forEach(img => img.src = data.images.youtube);

                allImages.forEach(img => img.style.opacity = '1');
            }, 300);
        });
    });

    btnEl?.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const promptData = {
            prompt: target.dataset.prompt,
            template: 'multi',
            style: target.dataset.style
        };
        handleCTAClick(promptData);
    });


    // 3. "Use This Prompt" (New Top Button)
    usePromptBtn?.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const promptData = {
            prompt: target.dataset.prompt,
            template: 'multi',
            style: target.dataset.style
        };
        handleCTAClick(promptData);
    });


    // 4. Make Showcase Images Clickable
    const showcaseCards = document.querySelectorAll('.output-card');
    showcaseCards.forEach(card => {
        card.style.cursor = 'pointer'; // Visual cue
        card.addEventListener('click', () => {
            // When clicking an image, we use the CURRENT active campaign data
            const activeTab = document.querySelector('.campaign-tab.active');
            const key = activeTab ? activeTab.dataset.target : 'saas';
            const data = campaigns[key];

            const promptData = {
                prompt: data.promptText,
                template: 'multi',
                style: data.style
            };
            handleCTAClick(promptData);
        });
    });



    // --- 4. CTA LOGIC (Redirect to App) ---
    
    // Helper function to handle redirection
    function handleCTAClick(promptData = null) {
        const nav = window.layoutCraftNav;
        if (!nav || !nav.authService) {
            console.error("Navigation or AuthService not initialized.");
            setTimeout(() => handleCTAClick(promptData), 100);
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
                sessionStorage.setItem('layoutcraft_post_auth_prompt', JSON.stringify(promptData));
            } else {
                sessionStorage.removeItem('layoutcraft_post_auth_prompt');
            }
            nav.openAuthModal('signup');
        }
    }

    // Handle "Create Campaign" (Hero Button)
    heroButton?.addEventListener('click', () => {
        const prompt = heroInput.value.trim();
        const style = heroStyleSelect ? heroStyleSelect.value : 'auto';
        
        // Convert Set to simple string for app compatibility
        let templateToSend = 'blog_header'; 
        if (selectedFormats.has('multi') || selectedFormats.size > 1) {
            templateToSend = 'blog_header'; // Safeguard until app supports 'multi'
        } else if (selectedFormats.size === 1) {
            templateToSend = selectedFormats.values().next().value;
        }
        
        // Only send prompt if there is text
        const promptData = prompt ? {
            prompt: prompt,
            template: templateToSend,
            style: style
        } : null;
        
        handleCTAClick(promptData);
    });

    // Handle other CTAs (Feature sections, Campaign showcase)
    // Note: We do NOT include .example-chip here anymore
    const redirectButtons = document.querySelectorAll('.example-try, .feature-cta');
    redirectButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const promptData = {
                prompt: btn.dataset.prompt,
                template: btn.dataset.template, // Likely 'multi' or specific
                style: btn.dataset.style
            };
            
            // Apply safeguard for 'multi' if coming from these buttons
            if (promptData.template === 'multi') {
                promptData.template = 'blog_header';
            }

            handleCTAClick(promptData);
        });
    });

    // Feature visuals click handler (Clicking the image acts as the CTA)
    const featureVisuals = document.querySelectorAll('.feature-visual');
    featureVisuals.forEach(visual => {
        visual.addEventListener('click', (e) => {
            const row = visual.closest('.feature-row');
            const btn = row.querySelector('.feature-cta');
            if (btn) btn.click();
        });
    });
   
   // Smooth scroll for internal links
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

   // Animation Observer
   const observerOptions = {
       threshold: 0.1,
       rootMargin: '0px 0px -50px 0px'
   };
   
   const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
           if (entry.isIntersecting) {
               entry.target.classList.add('animate-in');
               observer.unobserve(entry.target);
           }
       });
   }, observerOptions);
   
   document.querySelectorAll('.feature-visual, .campaign-source, .testimonial-card, .output-card').forEach(el => {
       el.style.opacity = '0';
       el.style.transform = 'translateY(20px)';
       observer.observe(el);
   });
   
   // Add Animation CSS if missing
   if (!document.getElementById('animation-styles')) {
       const style = document.createElement('style');
       style.id = 'animation-styles';
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
   }
   
   // Navbar scroll effect
   const nav = document.querySelector('.nav');
   if (nav) {
       window.addEventListener('scroll', () => {
           if (window.pageYOffset > 50) {
               nav.style.background = 'rgba(255, 255, 255, 0.95)';
               nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
           } else {
               nav.style.background = 'rgba(255, 255, 255, 0.8)';
               nav.style.boxShadow = 'none';
           }
       });
   }
    
    // Auth Redirect Handler
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'required') {
        setTimeout(() => {
            window.layoutCraftNav?.openAuthModal(
                'signup', 
                'Please sign up or log in to access the designer.'
            );
        }, 500);
        history.replaceState(null, '', window.location.pathname);
    }
});