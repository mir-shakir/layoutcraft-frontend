// LayoutCraft Blog Post JavaScript

class BlogPost {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollProgress();
        this.generateTableOfContents();
        this.setupThemeSwitcher();
        this.setupScrollToTop();
    }

    setupScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) return;

        const updateProgress = () => {
            const article = document.querySelector('.blog-post-content');
            if (!article) return;

            const articleTop = article.offsetTop;
            const articleHeight = article.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollY = window.scrollY;

            // Calculate progress based on article content
            const start = articleTop - windowHeight / 3;
            const end = articleTop + articleHeight - windowHeight / 3;
            const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));

            progressBar.style.transform = `scaleX(${progress})`;
        };

        window.addEventListener('scroll', updateProgress);
        updateProgress(); // Initial call
    }

    generateTableOfContents() {
        const tocList = document.getElementById('tocList');
        const tocContainer = document.getElementById('tocContainer');
        const content = document.getElementById('articleContent');
        
        if (!tocList || !content) return;

        const headings = content.querySelectorAll('h2, h3');
        
        if (headings.length === 0) {
            if (tocContainer) {
                tocContainer.style.display = 'none';
            }
            return;
        }

        // Generate TOC items
        const tocItems = Array.from(headings).map(heading => {
            const id = heading.id || this.generateId(heading.textContent);
            heading.id = id;

            const level = heading.tagName.toLowerCase();
            const text = heading.textContent;

            return `
                <li>
                    <a href="#${id}" class="${level}" data-target="${id}">
                        ${text}
                    </a>
                </li>
            `;
        }).join('');

        tocList.innerHTML = tocItems;

        // Add click handlers for smooth scrolling
        tocList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const targetId = e.target.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 100; // Account for fixed header
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });

        // Setup intersection observer for active states
        this.setupTocActiveStates(headings);
    }

    setupTocActiveStates(headings) {
        const tocLinks = document.querySelectorAll('.toc-list a');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const tocLink = document.querySelector(`.toc-list a[data-target="${id}"]`);
                
                if (entry.isIntersecting) {
                    // Remove active from all links
                    tocLinks.forEach(link => link.classList.remove('active'));
                    // Add active to current link
                    if (tocLink) {
                        tocLink.classList.add('active');
                    }
                }
            });
        }, {
            rootMargin: '-100px 0px -80% 0px',
            threshold: 0
        });

        headings.forEach(heading => {
            observer.observe(heading);
        });
    }

    generateId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    setupThemeSwitcher() {
        let currentTheme = 'light';
        
        function loadTheme() {
            try {
                const saved = localStorage.getItem('layoutcraft-theme');
                if (saved === 'dark' || saved === 'light') {
                    currentTheme = saved;
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    currentTheme = 'dark';
                }
                document.documentElement.setAttribute('data-theme', currentTheme);
            } catch (e) {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
        
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            try {
                localStorage.setItem('layoutcraft-theme', currentTheme);
            } catch (e) {}
            updateButton();
        }
        
        function updateButton() {
            const btn = document.getElementById('themeSwitcher');
            if (btn) {
                const icon = btn.querySelector('i');
                const isDark = currentTheme === 'dark';
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
                btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
                btn.setAttribute('aria-label', btn.title);
            }
        }
        
        // Load theme immediately
        loadTheme();
        
        // Setup when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            updateButton();
            const btn = document.getElementById('themeSwitcher');
            if (btn) {
                btn.addEventListener('click', toggleTheme);
            }
        });
    }

    setupScrollToTop() {
        // Create scroll to top button
        const scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollToTopBtn.className = 'scroll-to-top-btn';
        scrollToTopBtn.title = 'Scroll to top';
        scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scroll-to-top-btn {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 3rem;
                height: 3rem;
                border: none;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: var(--text-white);
                font-size: 1.25rem;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-normal);
                box-shadow: var(--shadow-lg);
                z-index: 100;
            }
            
            .scroll-to-top-btn:hover {
                background-color: var(--primary-dark);
                transform: translateY(-2px);
            }
            
            .scroll-to-top-btn.visible {
                opacity: 1;
                visibility: visible;
            }
            
            @media (max-width: 768px) {
                .scroll-to-top-btn {
                    bottom: 1rem;
                    right: 1rem;
                    width: 2.5rem;
                    height: 2.5rem;
                    font-size: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(scrollToTopBtn);

        // Show/hide button based on scroll position
        const toggleScrollToTopBtn = () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        };

        // Scroll to top functionality
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        window.addEventListener('scroll', toggleScrollToTopBtn);
        toggleScrollToTopBtn(); // Initial call
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogPost();
});

export default BlogPost;