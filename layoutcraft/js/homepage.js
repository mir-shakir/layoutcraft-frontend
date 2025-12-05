// Homepage Interactions
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let allFormatsSelected = true; // Default to All Formats
    let selectedFormats = []; // Empty when allFormatsSelected is true
    let selectedStyle = 'auto';

    const heroInput = document.getElementById('hero-prompt');
    const heroButton = document.getElementById('hero-generate');

    // --- DATA (consistent with designer page) ---
    const DIMENSIONS_DATA = [
        { value: "all_formats", label: "All Formats", isAllFormats: true },
        { value: "blog_header", label: "Blog Header" },
        { value: "social_square", label: "Instagram Post" },
        { value: "story", label: "Story" },
        { value: "twitter_post", label: "Twitter Post" },
        { value: "youtube_thumbnail", label: "YouTube Thumbnail" },
    ];
    const ALL_DIMENSION_VALUES = DIMENSIONS_DATA.filter(d => !d.isAllFormats).map(d => d.value);

    const STYLE_DATA = [
        { value: "auto", label: "Auto" },
        { value: "minimal_luxury_space", label: "Minimal & Clean" },
        { value: "bold_geometric_solid", label: "Bold Geometric" },
        { value: "dark_neon_tech", label: "Neon / Tech" },
        { value: "vibrant_gradient_energy", label: "Vibrant Energy" },
    ];

    // --- 1. HERO INTERFACE LOGIC ---

    // Create homepage dropdowns
    function createHomeDropdown(containerId, type, options, isMultiSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        const dropdown = document.createElement('div');
        dropdown.className = 'hero-custom-dropdown';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hero-dropdown-toggle';

        const menu = document.createElement('div');
        menu.className = 'hero-dropdown-menu';

        const updateButtonLabel = () => {
            if (isMultiSelect) {
                if (allFormatsSelected) {
                    button.textContent = 'All Formats';
                } else {
                    const count = selectedFormats.length;
                    button.textContent = count === 1
                        ? DIMENSIONS_DATA.find(d => d.value === selectedFormats[0])?.label || `Dimensions (${count})`
                        : `Dimensions (${count})`;
                }
            } else {
                const selected = options.find(o => o.value === selectedStyle);
                button.textContent = selected ? selected.label : 'Auto';
            }
        };

        const updateAllCheckboxStates = () => {
            if (!isMultiSelect) return;
            const allFormatsCheckbox = menu.querySelector('input[value="all_formats"]');
            const otherCheckboxes = menu.querySelectorAll('input:not([value="all_formats"])');

            if (allFormatsCheckbox) {
                allFormatsCheckbox.checked = allFormatsSelected;
            }
            otherCheckboxes.forEach(cb => {
                cb.checked = allFormatsSelected || selectedFormats.includes(cb.value);
            });
        };

        options.forEach((option) => {
            const item = document.createElement('div');
            const isAllFormatsOption = option.isAllFormats;

            item.className = 'hero-dropdown-item';

            let isChecked = false;
            if (isMultiSelect) {
                if (isAllFormatsOption) {
                    isChecked = allFormatsSelected;
                } else {
                    isChecked = allFormatsSelected || selectedFormats.includes(option.value);
                }
            } else {
                isChecked = selectedStyle === option.value;
            }

            item.innerHTML = `<label>
                <input type="${isMultiSelect ? 'checkbox' : 'radio'}"
                name="hero-${type}-option"
                value="${option.value}"
                ${isChecked ? 'checked' : ''}>
                ${option.label}
            </label>`;

            item.querySelector('input').addEventListener('change', (e) => {
                if (isMultiSelect) {
                    if (isAllFormatsOption) {
                        if (e.target.checked) {
                            allFormatsSelected = true;
                            selectedFormats = [];
                        } else {
                            allFormatsSelected = false;
                            selectedFormats = ['blog_header'];
                        }
                        updateAllCheckboxStates();
                    } else {
                        // Individual dimension selection
                        if (allFormatsSelected) {
                            allFormatsSelected = false;
                            if (!e.target.checked) {
                                selectedFormats = ALL_DIMENSION_VALUES.filter(d => d !== option.value);
                            } else {
                                selectedFormats = [option.value];
                            }
                        } else {
                            if (e.target.checked) {
                                if (!selectedFormats.includes(option.value)) {
                                    selectedFormats.push(option.value);
                                }
                                if (selectedFormats.length === ALL_DIMENSION_VALUES.length) {
                                    allFormatsSelected = true;
                                    selectedFormats = [];
                                }
                            } else {
                                selectedFormats = selectedFormats.filter(d => d !== option.value);
                                if (selectedFormats.length === 0) {
                                    selectedFormats = [option.value];
                                    e.target.checked = true;
                                }
                            }
                        }
                        const allFormatsCheckbox = menu.querySelector('input[value="all_formats"]');
                        if (allFormatsCheckbox) {
                            allFormatsCheckbox.checked = allFormatsSelected;
                        }
                    }
                } else {
                    selectedStyle = option.value;
                    menu.classList.remove('show');
                }
                updateButtonLabel();
            });

            menu.appendChild(item);
        });

        updateButtonLabel();
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.hero-dropdown-menu.show').forEach(otherMenu => {
                if (otherMenu !== menu) otherMenu.classList.remove('show');
            });
            menu.classList.toggle('show');
        });

        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        container.appendChild(dropdown);
    }

    // Initialize dropdowns
    createHomeDropdown('hero-dimensions-dropdown', 'dimensions', DIMENSIONS_DATA, true);
    createHomeDropdown('hero-style-dropdown', 'style', STYLE_DATA, false);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.hero-custom-dropdown')) {
            document.querySelectorAll('.hero-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Helper to get selected formats for sending to app
    function getSelectedFormatsForApp() {
        if (allFormatsSelected) {
            return 'multi';
        } else if (selectedFormats.length === 1) {
            return selectedFormats[0];
        } else {
            return 'multi'; // Multiple selected = multi
        }
    }

    // Helper to set formats from external data (chips, etc.)
    function setFormatsFromTemplate(template) {
        if (template === 'multi' || template === 'all_formats') {
            allFormatsSelected = true;
            selectedFormats = [];
        } else {
            allFormatsSelected = false;
            selectedFormats = [template];
        }
        // Re-render dimensions dropdown to update UI
        createHomeDropdown('hero-dimensions-dropdown', 'dimensions', DIMENSIONS_DATA, true);
    }

    function setStyleFromValue(styleValue) {
        selectedStyle = styleValue;
        createHomeDropdown('hero-style-dropdown', 'style', STYLE_DATA, false);
    }

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

            // 2. Update Style
            if (btn.dataset.style) {
                setStyleFromValue(btn.dataset.style);
            }

            // 3. Update Dimensions
            const template = btn.dataset.template;
            setFormatsFromTemplate(template);

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
        const templateToSend = getSelectedFormatsForApp();

        // Only send prompt if there is text
        const promptData = prompt ? {
            prompt: prompt,
            template: templateToSend,
            style: selectedStyle
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
        visual.addEventListener('click', () => {
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