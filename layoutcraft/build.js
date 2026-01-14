import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';

const PATHS = {
  contentDir: './content/blog',
  templatesDir: './src/templates',
  outputDir: './public/blog',
  postsOutputDir: './public/blog/posts'
};

const SITE_URL = 'https://www.layoutcraft.tech';

// Configure marked for safe HTML rendering
marked.setOptions({
  gfm: true,
  breaks: false
});

// Simple template engine - replaces {{placeholder}} with values
function renderTemplate(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value ?? '');
  }
  return result;
}

// Format date for display (e.g., "January 26, 2025")
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate post card HTML for the blog index
function generatePostCard(post) {
  return `                <article class="post-card glass-card">
                    <div class="post-meta">
                        <time datetime="${post.dateISO}">${post.date}</time>
                        <span class="post-category">${post.category}</span>
                    </div>
                    <h2 class="post-title">
                        <a href="/blog/posts/${post.slug}/">
                            ${post.title}
                        </a>
                    </h2>
                    <p class="post-excerpt">
                        ${post.description}
                    </p>
                    <a href="/blog/posts/${post.slug}/" class="post-link">
                        Read more →
                    </a>
                </article>`;
}

async function build() {
  console.log('Starting build...\n');

  try {
    // 1. Read templates
    console.log('Loading templates...');
    const postTemplate = await fs.readFile(
      path.join(PATHS.templatesDir, 'blog-post.html'),
      'utf-8'
    );
    const indexTemplate = await fs.readFile(
      path.join(PATHS.templatesDir, 'blog-index.html'),
      'utf-8'
    );

    // 2. Read all markdown files from content/blog/
    console.log('Reading content files...');
    const files = await fs.readdir(PATHS.contentDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const posts = [];

    // 3. Process each markdown file
    for (const file of mdFiles) {
      const filePath = path.join(PATHS.contentDir, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const { data: frontMatter, content } = matter(raw);

      // Build post object with all necessary data
      const post = {
        ...frontMatter,
        dateISO: frontMatter.date,
        dateModifiedISO: frontMatter.dateModified || frontMatter.date,
        date: formatDate(frontMatter.date),
        canonicalUrl: `${SITE_URL}/blog/posts/${frontMatter.slug}/`
      };

      posts.push(post);

      // 4. Generate HTML only for "generated" type posts
      if (frontMatter.type === 'generated') {
        console.log(`  Generating: ${frontMatter.slug}`);

        // Convert markdown to HTML
        const htmlContent = marked.parse(content);

        // Render the template with post data
        const html = renderTemplate(postTemplate, {
          ...post,
          content: htmlContent
        });

        // Ensure output directory exists
        const outputDir = path.join(PATHS.postsOutputDir, frontMatter.slug);
        await fs.mkdir(outputDir, { recursive: true });

        // Write HTML file
        await fs.writeFile(path.join(outputDir, 'index.html'), html);
      } else {
        console.log(`  Skipping (manual): ${frontMatter.slug}`);
      }
    }

    // 5. Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

    // 6. Generate blog index
    console.log('\nGenerating blog index...');
    const postCards = posts.map(generatePostCard).join('\n');
    const indexHtml = renderTemplate(indexTemplate, {
      postsList: postCards
    });

    await fs.writeFile(path.join(PATHS.outputDir, 'index.html'), indexHtml);

    // Summary
    const generatedCount = posts.filter(p => p.type === 'generated').length;
    const manualCount = posts.filter(p => p.type === 'manual').length;

    console.log('\n✓ Build complete!');
    console.log(`  - Generated ${generatedCount} post(s) from markdown`);
    console.log(`  - Preserved ${manualCount} manual post(s)`);
    console.log(`  - Blog index lists ${posts.length} total posts`);

  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

build();
