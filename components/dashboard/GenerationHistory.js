/**
 * Generation History Component for LayoutCraft
 * Displays user's generation history with pagination
 */

class GenerationHistory {
    constructor() {
        this.isLoading = false;
        this.generations = [];
        this.error = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.selectedGeneration = null;
    }

    async init() {
        await this.loadGenerations();
    }

    async loadGenerations(page = 1) {
        this.isLoading = true;
        this.error = null;
        this.currentPage = page;

        try {
            const token = localStorage.getItem('auth_token');
            const offset = (page - 1) * this.itemsPerPage;

            const response = await fetch(`http://127.0.0.1:8000/users/history?limit=${this.itemsPerPage}&offset=${offset}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load generation history');
            }

            this.generations = await response.json();

            // Get total count for pagination (you may need to add this to your backend)
            const countResponse = await fetch('http://127.0.0.1:8000/users/history/count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (countResponse.ok) {
                const countData = await countResponse.json();
                this.totalItems = countData.total;
            }

        } catch (error) {
            this.error = error.message;
            console.error('Error loading generation history:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async deleteGeneration(generationId) {
        if (!confirm('Are you sure you want to delete this generation?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://127.0.0.1:8000/users/history/${generationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete generation');
            }

            // Refresh the list
            await this.loadGenerations(this.currentPage);

            // Show success message
            this.showMessage('Generation deleted successfully', 'success');

        } catch (error) {
            this.showMessage('Failed to delete generation', 'error');
            console.error('Error deleting generation:', error);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatGenerationTime(ms) {
        if (!ms) return 'N/A';
        const seconds = Math.round(ms / 1000);
        return `${seconds}s`;
    }

    getTotalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    render() {
        if (this.isLoading) {
            return `
          <div class="glass-card p-6">
            <div class="flex items-center justify-center h-64">
              <div class="loading-animation w-8 h-8"></div>
            </div>
          </div>
        `;
        }

        if (this.error) {
            return `
          <div class="glass-card p-6">
            <div class="text-center text-red-600">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-lg font-medium mb-2">Error Loading History</p>
              <p class="text-sm">${this.error}</p>
              <button onclick="window.historyManager.loadGenerations()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Try Again
              </button>
            </div>
          </div>
        `;
        }

        if (this.generations.length === 0) {
            return `
          <div class="glass-card p-6">
            <div class="text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-lg font-medium mb-2">No Generations Yet</p>
              <p class="text-sm">Your generated images will appear here</p>
            </div>
          </div>
        `;
        }

        const totalPages = this.getTotalPages();

        return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">Generation History</h2>
            <div class="text-sm text-gray-500">
              ${this.totalItems} total generations
            </div>
          </div>
  
          <!-- Generations Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.generations.map(generation => `
              <div class="glass-card p-4 hover:shadow-lg transition-all">
                <!-- Generation Image -->
                <div class="aspect-w-16 aspect-h-9 mb-4 rounded-lg overflow-hidden bg-gray-100">
                  ${generation.image_url ? `
                    <img src="${generation.image_url}" 
                         alt="Generated image" 
                         class="w-full h-full object-cover">
                  ` : `
                    <div class="flex items-center justify-center h-full">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  `}
                </div>
  
                <!-- Generation Info -->
                <div class="space-y-2">
                  <p class="text-sm text-gray-600 line-clamp-2">
                    ${generation.prompt}
                  </p>
                  
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>${generation.width}×${generation.height}</span>
                    <span>${generation.model_used}</span>
                  </div>
                  
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>${this.formatDate(generation.created_at)}</span>
                    <span>${this.formatGenerationTime(generation.generation_time_ms)}</span>
                  </div>
                </div>
  
                <!-- Actions -->
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <button onclick="window.historyManager.viewGeneration('${generation.id}')" 
                          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View Details
                  </button>
                  
                  <div class="flex items-center space-x-2">
                    ${generation.image_url ? `
                      <a href="${generation.image_url}" 
                         download="layoutcraft-${generation.id}.png"
                         class="text-green-600 hover:text-green-800 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </a>
                    ` : ''}
                    
                    <button onclick="window.historyManager.deleteGeneration('${generation.id}')" 
                            class="text-red-600 hover:text-red-800 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
  
          <!-- Pagination -->
          ${totalPages > 1 ? `
            <div class="flex items-center justify-center space-x-2">
              <button onclick="window.historyManager.loadGenerations(${this.currentPage - 1})" 
                      ${this.currentPage === 1 ? 'disabled' : ''}
                      class="px-3 py-2 rounded-lg glass-card hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <div class="flex items-center space-x-1">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                  <button onclick="window.historyManager.loadGenerations(${page})" 
                          class="px-3 py-2 rounded-lg ${page === this.currentPage ? 'bg-indigo-600 text-white' : 'glass-card hover:shadow-md'} transition-all">
                    ${page}
                  </button>
                `).join('')}
              </div>
              
              <button onclick="window.historyManager.loadGenerations(${this.currentPage + 1})" 
                      ${this.currentPage === totalPages ? 'disabled' : ''}
                      class="px-3 py-2 rounded-lg glass-card hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }
}
  