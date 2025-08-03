class GitHubMarkdownPresenter {
    constructor() {
        this.slides = [];
        this.currentSlide = 0;
        this.isFullscreen = false;
        this.settings = {
            headingFont: 'bmjua',
            bodyFont: 'bmjua',
            codeFont: 'd2coding'
        };
        this.recentItems = [];
        this.fileSlideMap = [];
        this.originalMarkdownContent = '';
        this.currentFileName = '';
        
        // Preview functionality
        this.previewSlides = [];
        this.currentPreviewSlide = 0;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadRecentItems();
        this.setupKeyboardNavigation();
        this.setupFullscreenHandling();
        this.getCurrentRepoInfo();
        this.checkKatexLoaded();
        this.checkMermaidLoaded();
        
        // 초기 로딩 후 잠시 기다렸다가 자동으로 폴더 검색
        setTimeout(() => {
            const currentRepoRadio = document.getElementById('current-repo');
            if (currentRepoRadio && currentRepoRadio.checked) {
                this.searchFolders();
            }
        }, 1000);
    }

    checkKatexLoaded() {
        // Check if KaTeX is loaded
        const checkLoaded = () => {
            if (typeof katex !== 'undefined') {
                console.log('KaTeX library loaded successfully');
                return true;
            } else {
                console.log('KaTeX library not yet loaded, waiting...');
                return false;
            }
        };
        
        // Check immediately
        if (!checkLoaded()) {
            // If not loaded, check every 100ms for up to 5 seconds
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (checkLoaded() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (attempts >= maxAttempts) {
                        console.error('KaTeX library failed to load after 5 seconds');
                    }
                }
            }, 100);
        }
    }

    checkMermaidLoaded() {
        // Check if Mermaid is loaded
        const checkLoaded = () => {
            if (typeof mermaid !== 'undefined') {
                console.log('Mermaid library loaded successfully');
                // Initialize mermaid with configuration
                mermaid.initialize({ 
                    startOnLoad: false,
                    theme: 'default',
                    themeVariables: {
                        primaryColor: '#007bff',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#0056b3',
                        lineColor: '#333',
                        secondaryColor: '#e9ecef',
                        tertiaryColor: '#f8f9fa'
                    }
                });
                return true;
            } else {
                console.log('Mermaid library not yet loaded, waiting...');
                return false;
            }
        };
        
        // Check immediately
        if (!checkLoaded()) {
            // If not loaded, check every 100ms for up to 5 seconds
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (checkLoaded() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (attempts >= maxAttempts) {
                        console.error('Mermaid library failed to load after 5 seconds');
                    }
                }
            }, 100);
        }
    }

    bindEvents() {
        // Repository source selection
        const radioButtons = document.querySelectorAll('input[name="repo-source"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => this.handleRepoSourceChange());
        });

        // Search folders button
        document.getElementById('search-folders-btn').addEventListener('click', () => this.searchFolders());

        // Load local files button
        document.getElementById('load-local-files-btn').addEventListener('click', () => this.loadLocalFiles());

        // Load direct input button
        document.getElementById('load-direct-input-btn').addEventListener('click', () => this.loadDirectInput());

        // Save markdown button (removed from main form, now in toolbar)
        const saveBtn = document.getElementById('save-markdown-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveMarkdown());
        }

        // Logo button - go back to home
        document.getElementById('logo-btn').addEventListener('click', () => this.goToHome());

        // File upload change event
        document.getElementById('file-upload').addEventListener('change', () => {
            this.handleFileUpload();
            this.updateFilePreview();
        });

        // File select button event
        document.getElementById('file-select-btn').addEventListener('click', () => this.openFileDialog());

        // Drag and drop events
        this.setupDragAndDrop();

        // Repository form submission
        document.getElementById('repo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadPresentation();
        });

        // Markdown textarea input event for real-time preview
        document.getElementById('markdown-textarea').addEventListener('input', () => this.updatePreview());
        
        // Keyboard shortcuts for WYSIWYG
        document.getElementById('markdown-textarea').addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Preview navigation - will be dynamically added for thumbnails

        // WYSIWYG toolbar buttons - check if elements exist before adding listeners
        const toolbarButtons = {
            'toolbar-bold': () => this.insertMarkdown('**', '**', '굵은 텍스트'),
            'toolbar-italic': () => this.insertMarkdown('*', '*', '기울임 텍스트'),
            'toolbar-underline': () => this.insertMarkdown('<u>', '</u>', '밑줄 텍스트'),
            'toolbar-strike': () => this.insertMarkdown('~~', '~~', '취소선 텍스트'),
            'toolbar-header': () => this.insertMarkdown('## ', '', '제목'),
            'toolbar-quote': () => this.insertMarkdown('> ', '', '인용구'),
            'toolbar-list': () => this.insertMarkdown('- ', '', '리스트 항목'),
            'toolbar-numbered-list': () => this.insertMarkdown('1. ', '', '번호 리스트 항목'),
            'toolbar-link': () => this.insertLink(),
            'toolbar-image': () => this.insertImage(),
            'toolbar-code': () => this.insertCodeBlock(),
            'toolbar-slide': () => this.insertNewSlide()
        };
        
        Object.entries(toolbarButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
        
        // Save markdown toolbar button - check if exists
        const saveToolbarBtn = document.getElementById('save-markdown-toolbar-btn');
        if (saveToolbarBtn) {
            saveToolbarBtn.addEventListener('click', () => this.saveMarkdown());
        }

        // Slide navigation
        document.getElementById('prev-slide').addEventListener('click', () => this.previousSlide());
        document.getElementById('next-slide').addEventListener('click', () => this.nextSlide());

        // Home button
        document.getElementById('home-button').addEventListener('click', () => this.goHome());

        // Presentation logo
        document.getElementById('presentation-logo').addEventListener('click', () => this.goToFirstSlide());

        // Fullscreen toggle
        document.getElementById('fullscreen-toggle').addEventListener('click', () => this.toggleFullscreen());

        // File navigation toggle
        document.getElementById('file-nav-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFileListPopup();
        });
        document.getElementById('close-file-nav').addEventListener('click', () => this.closeFileNavigation());

        // PDF export button
        document.getElementById('pdf-export-btn').addEventListener('click', () => this.exportToPDF());

        // Markdown export button
        document.getElementById('markdown-export-btn').addEventListener('click', () => this.exportToMarkdown());

        // Page input navigation
        document.getElementById('page-input').addEventListener('change', (e) => this.goToPageInput(e.target.value));
        document.getElementById('page-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.goToPageInput(e.target.value);
            }
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Help modal
        document.getElementById('help-btn').addEventListener('click', () => {
            this.closeSettingsDropdown(); // Close settings dropdown first
            this.openHelpModal();
        });
        document.getElementById('close-help-modal').addEventListener('click', () => this.closeHelpModal());
        
        // Help modal backdrop click
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.closeHelpModal();
            }
        });

        // Settings dropdown
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettingsDropdown();
        });
        
        document.getElementById('close-settings-dropdown').addEventListener('click', () => {
            this.closeSettingsDropdown();
        });

        // Individual font settings
        document.getElementById('heading-font-dropdown').addEventListener('change', (e) => {
            this.settings.headingFont = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        document.getElementById('body-font-dropdown').addEventListener('change', (e) => {
            this.settings.bodyFont = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        document.getElementById('code-font-dropdown').addEventListener('change', (e) => {
            this.settings.codeFont = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        // Reset fonts button
        document.getElementById('reset-fonts-btn').addEventListener('click', () => {
            this.resetFontSettings();
        });
    }

    setupFullscreenHandling() {
        // Enhanced fullscreen change event handling
        const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        
        fullscreenEvents.forEach(eventName => {
            document.addEventListener(eventName, () => {
                this.handleFullscreenChange();
            });
        });

        // Handle window resize for proper UI adjustment
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    handleFullscreenChange() {
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        this.isFullscreen = isCurrentlyFullscreen;
        
        // Update UI state
        const container = document.getElementById('slide-container');
        const bottomNavContainer = document.getElementById('bottom-nav-container');
        const logoContainer = document.getElementById('presentation-logo');
        
        if (this.isFullscreen) {
            container.classList.add('fullscreen');
            // Ensure bottom navigation is visible in fullscreen
            if (bottomNavContainer) bottomNavContainer.style.display = 'flex';
            
            // Position logo at top-left of screen in fullscreen mode
            if (logoContainer) {
                logoContainer.style.position = 'fixed';
                logoContainer.style.top = '20px';
                logoContainer.style.left = '20px';
                logoContainer.style.zIndex = '100';
                logoContainer.style.transform = 'none';
            }
        } else {
            container.classList.remove('fullscreen');
            // Reset any inline styles that might interfere
            if (bottomNavContainer) bottomNavContainer.style.display = '';
            
            // Reset logo position to slide-content relative positioning
            if (logoContainer) {
                logoContainer.style.position = '';
                logoContainer.style.top = '';
                logoContainer.style.left = '';
                logoContainer.style.zIndex = '';
                logoContainer.style.transform = '';
            }
        }

        // Trigger layout recalculation after a short delay
        setTimeout(() => {
            this.recalculateLayout();
        }, 100);
    }

    handleWindowResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.recalculateLayout();
        }, 150);
    }

    recalculateLayout() {
        // Force layout recalculation for proper responsive behavior
        const slideContent = document.getElementById('slide-content');
        if (slideContent) {
            // Temporarily hide and show to force reflow
            const display = slideContent.style.display;
            slideContent.style.display = 'none';
            slideContent.offsetHeight; // Trigger reflow
            slideContent.style.display = display;
        }
    }

    getCurrentRepoInfo() {
        // Try to detect current repository from GitHub Pages URL
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        if (hostname.endsWith('.github.io')) {
            let owner, repo;
            
            if (hostname === 'github.io') {
                // Custom domain or direct github.io access
                const pathParts = pathname.split('/').filter(part => part);
                if (pathParts.length >= 2) {
                    owner = pathParts[0];
                    repo = pathParts[1];
                }
            } else {
                // username.github.io format
                owner = hostname.split('.')[0];
                if (pathname === '/' || pathname === '') {
                    repo = owner + '.github.io';
                } else {
                    repo = pathname.split('/')[1];
                }
            }
            
            if (owner && repo) {
                this.currentRepo = { owner, repo };
                this.updateCurrentRepoDisplay();
            }
        }
    }

    updateCurrentRepoDisplay() {
        if (this.currentRepo) {
            const currentRepoRadio = document.getElementById('current-repo');
            const label = currentRepoRadio.nextElementSibling;
            label.innerHTML = `발표자료 선택 <span class="text-sm text-gray-500">(${this.currentRepo.owner}/${this.currentRepo.repo})</span>`;
        }
    }

    handleRepoSourceChange() {
        const selectedSource = document.querySelector('input[name="repo-source"]:checked');
        if (!selectedSource) {
            // 모바일에서는 기본값으로 current-repo를 선택
            const currentRepoOption = document.getElementById('current-repo');
            if (currentRepoOption) {
                currentRepoOption.checked = true;
            }
            return;
        }
        const sourceValue = selectedSource.value;
        const customFields = document.getElementById('custom-repo-fields');
        const localFields = document.getElementById('local-file-fields');
        const directFields = document.getElementById('direct-input-fields');
        const repoUrlInput = document.getElementById('repo-url');
        const folderSelection = document.getElementById('folder-selection');
        const loadBtn = document.getElementById('load-presentation-btn');
        const searchBtn = document.getElementById('search-folders-btn');
        const loadLocalBtn = document.getElementById('load-local-files-btn');
        const loadDirectBtn = document.getElementById('load-direct-input-btn');
        
        // Reset all selections
        folderSelection.classList.add('hidden');
        loadBtn.classList.add('hidden');
        loadLocalBtn.classList.add('hidden');
        loadDirectBtn.classList.add('hidden');
        searchBtn.classList.remove('hidden'); // 옵션 변경시 폴더 검색 버튼 다시 표시
        document.getElementById('folder-dropdown').innerHTML = '';
        
        // Initialize preview state
        this.previewSlides = [];
        this.currentPreviewSlide = 0;
        
        if (sourceValue === 'current') {
            customFields.style.display = 'none';
            localFields.classList.add('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.add('hidden'); // URL 입력창 숨기고 바로 폴더 검색
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
            // Current repo selected - automatically search folders
            this.searchFolders();
        } else if (sourceValue === 'custom') {
            customFields.style.display = 'block';
            localFields.classList.add('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.remove('hidden');
            repoUrlInput.disabled = false;
            repoUrlInput.required = true;
        } else if (sourceValue === 'local') {
            customFields.style.display = 'none';
            localFields.classList.remove('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.add('hidden');
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
        } else if (sourceValue === 'direct') {
            customFields.style.display = 'none';
            localFields.classList.add('hidden');
            directFields.classList.remove('hidden');
            searchBtn.classList.add('hidden');
            loadDirectBtn.classList.remove('hidden');
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
            
            // Clear preview when switching to direct input
            this.clearPreview();
        }
    }

    renderRecentItems() {
        const recentItemsList = document.getElementById('recent-items-list');
        const recentItemsSection = document.getElementById('recent-items-section');
        
        if (this.recentItems.length === 0) {
            recentItemsSection.classList.add('hidden');
            return;
        }
        
        recentItemsSection.classList.remove('hidden');
        recentItemsList.innerHTML = '';
        
        this.recentItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'history-item';
            
            let itemInfo = '';
            if (item.type === 'repo') {
                itemInfo = `
                    <div class="history-item-info">
                        <div class="history-item-url">${item.owner}/${item.repo}</div>
                        <div class="history-item-folder">${item.folder || '폴더 지정 없음'}</div>
                        <div class="text-xs text-gray-500">저장소</div>
                    </div>
                `;
            } else if (item.type === 'local') {
                itemInfo = `
                    <div class="history-item-info">
                        <div class="history-item-url">${item.fileName}</div>
                        <div class="text-xs text-gray-500">로컬 파일</div>
                    </div>
                `;
            } else if (item.type === 'direct') {
                const preview = item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '');
                itemInfo = `
                    <div class="history-item-info">
                        <div class="history-item-url">직접 입력</div>
                        <div class="history-item-folder text-sm text-gray-600">${preview}</div>
                        <div class="text-xs text-gray-500">마크다운 직접 입력</div>
                    </div>
                `;
            }
            
            itemElement.innerHTML = `
                ${itemInfo}
                <button class="history-item-delete" data-index="${index}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Add click handler for loading this item
            itemElement.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete')) {
                    this.loadFromRecentItem(item);
                }
            });
            
            // Add delete handler
            const deleteBtn = itemElement.querySelector('.history-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFromRecentItems(index);
            });
            
            recentItemsList.appendChild(itemElement);
        });
    }

    async loadFromRecentItem(item) {
        if (item.type === 'repo') {
            // Set the radio button to correct source
            const sourceRadio = item.owner === 'weniv' && item.repo === 'weniv_presentation' 
                ? document.getElementById('current-repo')
                : document.getElementById('custom-repo');
            sourceRadio.checked = true;
            this.handleRepoSourceChange();
            
            // Set repo URL if custom
            if (item.owner !== 'weniv' || item.repo !== 'weniv_presentation') {
                document.getElementById('repo-url').value = `https://github.com/${item.owner}/${item.repo}`;
            }
            
            // Search for folders first
            await this.searchFolders();
            
            // Wait a bit for the UI to update
            setTimeout(() => {
                // Select the folder if it exists
                if (item.folder) {
                    const folderDropdown = document.getElementById('folder-dropdown');
                    for (let i = 0; i < folderDropdown.options.length; i++) {
                        if (folderDropdown.options[i].value === item.folder) {
                            folderDropdown.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                // Show the load button (it should already be visible after searchFolders)
                const loadBtn = document.getElementById('load-presentation-btn');
                if (loadBtn) {
                    loadBtn.classList.remove('hidden');
                }
            }, 100);
        } else if (item.type === 'local') {
            // Set radio to local files
            document.getElementById('local-files').checked = true;
            this.handleRepoSourceChange();
            
            // Check if we have stored content
            if (item.content) {
                console.log('Loading from stored content, size:', new Blob([item.content]).size);
                try {
                    let decompressedContent = item.content;
                    
                    // Try to decompress if LZString is available
                    if (typeof LZString !== 'undefined') {
                        try {
                            const decompressed = LZString.decompressFromUTF16(item.content);
                            if (decompressed) {
                                decompressedContent = decompressed;
                                console.log('Successfully decompressed content');
                            }
                        } catch (e) {
                            console.log('Content was not compressed or decompression failed, using as-is');
                        }
                    }
                    
                    const storedData = JSON.parse(decompressedContent);
                    
                    // Restore the slides and file map
                    this.slides = storedData.slides || [];
                    this.fileSlideMap = storedData.fileSlideMap || [];
                    
                    // Restore logo if available
                    if (storedData.logo) {
                        const logoElement = document.getElementById('presentation-logo');
                        logoElement.src = storedData.logo;
                        logoElement.classList.remove('hidden');
                    }
                    
                    // Show uploaded files info
                    const filesList = document.getElementById('uploaded-files-list');
                    const fileItems = document.getElementById('file-items');
                    
                    if (filesList && fileItems) {
                        fileItems.innerHTML = `
                            <div class="file-item flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">${item.fileName}</span>
                                </div>
                            </div>
                        `;
                        filesList.classList.remove('hidden');
                    }
                    
                    // Show preview section
                    const previewSection = document.getElementById('preview-section');
                    if (previewSection) {
                        previewSection.classList.remove('hidden');
                        
                        // Update preview manually
                        const previewSlides = document.getElementById('preview-slides');
                        if (previewSlides && this.slides.length > 0) {
                            // Show first slide as preview
                            const firstSlide = this.slides[0];
                            previewSlides.innerHTML = `
                                <div class="preview-slide p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                                    ${firstSlide.content}
                                </div>
                            `;
                        }
                    }
                    
                    // Show load button
                    const loadLocalBtn = document.getElementById('load-local-files-btn');
                    if (loadLocalBtn) {
                        loadLocalBtn.classList.remove('hidden');
                        
                        // Set a flag to indicate we're loading from recent items
                        this.loadingFromRecentItem = true;
                        this.recentItemData = storedData;
                    }
                    
                } catch (e) {
                    console.error('Failed to restore local file content:', e);
                    // Fall back to re-upload message
                    this.showReuploadMessage(item);
                }
            } else {
                // No content stored, show re-upload message
                this.showReuploadMessage(item);
            }
        } else if (item.type === 'direct') {
            // Set radio to direct input
            document.getElementById('direct-input').checked = true;
            this.handleRepoSourceChange();
            
            // Set the content (decompress if needed)
            const markdownTextarea = document.getElementById('markdown-textarea');
            if (markdownTextarea) {
                let content = item.content;
                
                // Decompress if needed
                if (item.compressed && typeof LZString !== 'undefined') {
                    try {
                        content = LZString.decompressFromUTF16(item.content);
                        console.log('Decompressed direct input content');
                    } catch (e) {
                        console.warn('Failed to decompress direct input:', e);
                    }
                }
                
                markdownTextarea.value = content;
                
                // Show the load button
                const loadDirectBtn = document.getElementById('load-direct-input-btn');
                if (loadDirectBtn) {
                    loadDirectBtn.classList.remove('hidden');
                }
                
                // Show preview
                const previewSection = document.getElementById('preview-section');
                const previewSlides = document.getElementById('preview-slides');
                
                if (previewSection && previewSlides) {
                    previewSection.classList.remove('hidden');
                    
                    // Parse and preview the markdown (decompress if needed)
                    let contentToParse = content; // Use already decompressed content
                    const slides = this.parseLocalMarkdownToSlides(contentToParse);
                    if (slides.length > 0) {
                        // Show first slide as preview
                        const firstSlide = slides[0];
                        previewSlides.innerHTML = `
                            <div class="preview-slide p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                                ${firstSlide.content}
                            </div>
                        `;
                    }
                }
            }
        }
    }

    showReuploadMessage(item) {
        // Show uploaded files info
        const filesList = document.getElementById('uploaded-files-list');
        const fileItems = document.getElementById('file-items');
        
        if (filesList && fileItems) {
            fileItems.innerHTML = `
                <div class="file-item flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="text-sm text-gray-700 dark:text-gray-300">${item.fileName}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">(다시 업로드 필요)</span>
                    </div>
                </div>
            `;
            filesList.classList.remove('hidden');
        }
        
        // Show preview area with message
        const previewSection = document.getElementById('preview-section');
        const previewSlides = document.getElementById('preview-slides');
        
        if (previewSection && previewSlides) {
            previewSection.classList.remove('hidden');
            previewSlides.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-8 text-center">
                    <svg class="mx-auto h-16 w-16 text-yellow-600 dark:text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">파일 재업로드 필요</h3>
                    <p class="text-gray-600 dark:text-gray-400">보안상의 이유로 로컬 파일은 저장되지 않습니다.</p>
                    <p class="text-gray-600 dark:text-gray-400">동일한 파일을 다시 업로드해주세요.</p>
                </div>
            `;
        }
        
        // Show alert as well
        alert('로컬 파일은 다시 업로드해야 합니다.');
    }

    async loadFromHistory(repo) {
        // First, search for folders and populate dropdown
        try {
            this.showLoading(true);
            const folders = await this.fetchRepositoryFolders(repo.owner, repo.repo);
            this.populateFolderDropdown(folders);
            
            // Show folder selection
            document.getElementById('folder-selection').classList.remove('hidden');
            document.getElementById('load-presentation-btn').classList.remove('hidden');
            
            // Select the folder from history if it exists
            const folderDropdown = document.getElementById('folder-dropdown');
            const folderPath = repo.folder || '';
            
            // Try to find and select the matching folder
            for (let i = 0; i < folderDropdown.options.length; i++) {
                if (folderDropdown.options[i].value === folderPath) {
                    folderDropdown.selectedIndex = i;
                    break;
                }
            }
            
        } catch (error) {
            console.error('히스토리에서 폴더 로드 실패:', error);
            alert(`폴더를 가져올 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    deleteFromRecentItems(index) {
        this.recentItems.splice(index, 1);
        this.saveRecentItems();
        this.renderRecentItems();
    }

    addToRecentItems(item) {
        // Check storage size before adding
        const itemSize = new Blob([JSON.stringify(item)]).size;
        const currentSize = new Blob([JSON.stringify(this.recentItems)]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        
        // For local files, check if content size is acceptable
        if (item.type === 'local' && item.content) {
            const contentSize = new Blob([item.content]).size;
            console.log('Local file content size:', contentSize, 'bytes (', (contentSize / 1024 / 1024).toFixed(2), 'MB)');
            // If content is too large (> 4.5MB after compression), don't store it
            // Note: LZ-string compression typically reduces size by 50-80%
            if (contentSize > 4.5 * 1024 * 1024) {
                console.warn('Local file content too large (>4.5MB compressed), storing metadata only');
                item = {
                    type: item.type,
                    fileName: item.fileName,
                    timestamp: item.timestamp
                };
            } else {
                console.log('Content size is acceptable, will store with content');
            }
        }
        
        // Check if the new item would exceed storage limit
        if (currentSize + itemSize > maxSize) {
            console.warn('Storage limit would be exceeded, not adding to recent items');
            return;
        }
        
        // Remove if already exists (based on type and identifying properties)
        this.recentItems = this.recentItems.filter(existingItem => {
            if (item.type === 'repo') {
                return !(existingItem.type === 'repo' && 
                        existingItem.owner === item.owner && 
                        existingItem.repo === item.repo && 
                        existingItem.folder === item.folder);
            } else if (item.type === 'local') {
                return !(existingItem.type === 'local' && 
                        existingItem.fileName === item.fileName);
            } else if (item.type === 'direct') {
                return !(existingItem.type === 'direct' && 
                        existingItem.content === item.content);
            }
            return true;
        });
        
        // Add to beginning
        this.recentItems.unshift({ ...item, timestamp: Date.now() });
        
        // Keep only last 10 items
        if (this.recentItems.length > 10) {
            this.recentItems = this.recentItems.slice(0, 10);
        }
        
        this.saveRecentItems();
        this.renderRecentItems();
    }

    saveRecentItems() {
        try {
            localStorage.setItem('github-presenter-recent-items', JSON.stringify(this.recentItems));
        } catch (e) {
            console.error('Failed to save recent items to localStorage:', e);
            // If storage is full, remove oldest items and try again
            if (e.name === 'QuotaExceededError' && this.recentItems.length > 1) {
                this.recentItems.pop();
                this.saveRecentItems();
            }
        }
    }

    loadRecentItems() {
        try {
            const saved = localStorage.getItem('github-presenter-recent-items');
            if (saved) {
                this.recentItems = JSON.parse(saved);
                this.renderRecentItems();
            }
        } catch (e) {
            console.error('Failed to load recent items:', e);
            this.recentItems = [];
        }
        this.handleRepoSourceChange(); // Update UI based on initial state
    }

    async searchFolders() {
        const selectedSource = document.querySelector('input[name="repo-source"]:checked').value;
        let owner, repo;
        
        if (selectedSource === 'current') {
            if (!this.currentRepo) {
                alert('현재 GitHub Pages 리포지토리를 감지할 수 없습니다.');
                return;
            }
            owner = this.currentRepo.owner;
            repo = this.currentRepo.repo;
        } else {
            const repoUrl = document.getElementById('repo-url').value.trim();
            if (!repoUrl) {
                alert('GitHub 리포지토리 URL을 입력해주세요.');
                return;
            }
            try {
                const parsed = this.parseGitHubUrl(repoUrl);
                owner = parsed.owner;
                repo = parsed.repo;
            } catch (error) {
                alert(error.message);
                return;
            }
        }

        try {
            this.showLoading(true);
            const folders = await this.fetchRepositoryFolders(owner, repo);
            this.populateFolderDropdown(folders);
            
            document.getElementById('folder-selection').classList.remove('hidden');
            document.getElementById('load-presentation-btn').classList.remove('hidden');
            
            // 폴더 검색 후 검색 버튼 숨기기
            document.getElementById('search-folders-btn').classList.add('hidden');
            
        } catch (error) {
            console.error('폴더 검색 실패:', error);
            alert(`폴더를 가져올 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchRepositoryFolders(owner, repo) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
            }
            
            const contents = await response.json();
            const folders = [];
            
            // Get all directories that contain markdown files
            for (const item of contents) {
                if (item.type === 'dir') {
                    try {
                        const dirResponse = await fetch(item.url);
                        if (dirResponse.ok) {
                            const dirContents = await dirResponse.json();
                            const hasMarkdown = dirContents.some(file => 
                                file.type === 'file' && file.name.endsWith('.md')
                            );
                            if (hasMarkdown) {
                                folders.push({ name: item.name, path: item.path });
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to check folder ${item.name}:`, e);
                    }
                }
            }

            return folders;
            
        } catch (error) {
            throw new Error(`리포지토리 폴더를 가져올 수 없습니다: ${error.message}`);
        }
    }

    populateFolderDropdown(folders) {
        const dropdown = document.getElementById('folder-dropdown');
        dropdown.innerHTML = '';
        
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.path;
            option.textContent = folder.name;
            dropdown.appendChild(option);
        });
    }

    setupKeyboardNavigation() {
        let keyboardIndicator = null;

        document.addEventListener('keydown', (e) => {
            // Debug mode: log all key events when in presentation mode
            if (this.slides.length > 0) {
                console.log('Key pressed:', {
                    key: e.key,
                    code: e.code,
                    keyCode: e.keyCode,
                    which: e.which,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                    location: e.location,
                    repeat: e.repeat
                });
            }
            
            // Only handle keyboard shortcuts in presentation mode
            if (this.slides.length === 0) return;
            
            let handled = false;

            // Handle presenter remote and navigation keys
            switch(e.key) {
                // Previous slide keys
                case 'PageUp':
                case 'ArrowLeft':
                case 'Backspace':
                    this.previousSlide();
                    handled = true;
                    break;
                
                // Next slide keys
                case 'PageDown':
                case 'ArrowRight':
                case ' ':  // Space bar
                case 'Enter':
                    this.nextSlide();
                    handled = true;
                    break;
                case 'ArrowUp':
                    // Smooth scroll up - try slide content first, then window
                    this.handleVerticalScroll(-50);
                    handled = true;
                    break;
                case 'ArrowDown':
                    // Smooth scroll down - try slide content first, then window
                    this.handleVerticalScroll(50);
                    handled = true;
                    break;
                case 'Home':
                    this.goToSlide(0);
                    handled = true;
                    break;
                case 'End':
                    this.goToSlide(this.slides.length - 1);
                    handled = true;
                    break;
                case 'F11':
                    this.toggleFullscreen();
                    handled = true;
                    break;
                case 'Escape':
                    if (this.isFullscreen) {
                        this.exitFullscreen();
                        handled = true;
                    }
                    break;
            }

            // If not handled by key names, try key codes for presenter compatibility
            if (!handled) {
                handled = this.handlePresenterKeyCodes(e);
            }

            if (handled) {
                e.preventDefault();
                this.showKeyboardIndicator();
            }
        });
    }

    handlePresenterKeyCodes(e) {
        // Handle key codes that some presenter remotes might send
        switch(e.keyCode || e.which) {
            // Common presenter key codes
            case 33: // Page Up
                this.previousSlide();
                return true;
            case 34: // Page Down
                this.nextSlide();
                return true;
            case 37: // Left Arrow
                this.previousSlide();
                return true;
            case 39: // Right Arrow
                this.nextSlide();
                return true;
            case 38: // Up Arrow
                this.handleVerticalScroll(-50);
                return true;
            case 40: // Down Arrow
                this.handleVerticalScroll(50);
                return true;
            case 32: // Space
                this.nextSlide();
                return true;
            case 13: // Enter
                this.nextSlide();
                return true;
            case 8: // Backspace
                this.previousSlide();
                return true;
            case 27: // Escape
                if (this.isFullscreen) {
                    this.exitFullscreen();
                    return true;
                }
                break;
            case 122: // F11
                this.toggleFullscreen();
                return true;
            case 36: // Home
                this.goToSlide(0);
                return true;
            case 35: // End
                this.goToSlide(this.slides.length - 1);
                return true;
            
            // Some Logitech presenter specific codes (may vary by model)
            case 116: // F5 - often used for presentation mode
                this.toggleFullscreen();
                return true;
            case 66: // B key - black screen (some presenters)
                this.toggleBlackScreen();
                return true;
            case 87: // W key - white screen (some presenters)
                this.toggleWhiteScreen();
                return true;
            case 190: // Period - sometimes used for laser pointer simulation
                this.showLaserPointer(e);
                return true;
        }
        return false;
    }

    toggleBlackScreen() {
        let blackScreen = document.getElementById('black-screen');
        if (!blackScreen) {
            blackScreen = document.createElement('div');
            blackScreen.id = 'black-screen';
            blackScreen.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: black;
                z-index: 10000;
                display: none;
            `;
            document.body.appendChild(blackScreen);
        }
        
        const isVisible = blackScreen.style.display === 'block';
        blackScreen.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            setTimeout(() => {
                blackScreen.style.display = 'none';
            }, 3000); // Auto hide after 3 seconds
        }
    }

    toggleWhiteScreen() {
        let whiteScreen = document.getElementById('white-screen');
        if (!whiteScreen) {
            whiteScreen = document.createElement('div');
            whiteScreen.id = 'white-screen';
            whiteScreen.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: white;
                z-index: 10000;
                display: none;
            `;
            document.body.appendChild(whiteScreen);
        }
        
        const isVisible = whiteScreen.style.display === 'block';
        whiteScreen.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            setTimeout(() => {
                whiteScreen.style.display = 'none';
            }, 3000); // Auto hide after 3 seconds
        }
    }

    showLaserPointer(e) {
        // Simple laser pointer simulation
        let pointer = document.getElementById('laser-pointer');
        if (!pointer) {
            pointer = document.createElement('div');
            pointer.id = 'laser-pointer';
            pointer.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, red 30%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                opacity: 0.8;
                display: none;
            `;
            document.body.appendChild(pointer);
        }
        
        // Show pointer at mouse position or center of screen
        const x = e.clientX || window.innerWidth / 2;
        const y = e.clientY || window.innerHeight / 2;
        pointer.style.left = (x - 10) + 'px';
        pointer.style.top = (y - 10) + 'px';
        pointer.style.display = 'block';
        
        setTimeout(() => {
            pointer.style.display = 'none';
        }, 1000);
    }

    handleVerticalScroll(scrollAmount) {
        // Get the slide content element
        const slideContent = document.getElementById('slide-content');
        const slideContainer = document.getElementById('slide-container');
        const presentationSection = document.getElementById('presentation-section');
        
        if (!slideContent || !slideContainer) {
            // Fallback to window scroll if elements not found
            window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            return;
        }
        
        // Check if we're in presentation mode
        const inPresentationMode = presentationSection && !presentationSection.classList.contains('hidden');
        
        if (!inPresentationMode) {
            // Not in presentation mode, scroll the window
            window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            return;
        }
        
        // We're in presentation mode - determine the best scroll target
        if (this.isFullscreen) {
            // In fullscreen mode, always scroll the container
            slideContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            return;
        }
        
        // Normal presentation mode - check if content needs scrolling
        const containerRect = slideContainer.getBoundingClientRect();
        const contentRect = slideContent.getBoundingClientRect();
        
        // Check if content extends beyond the visible container area
        const contentOverflowsTop = contentRect.top < containerRect.top;
        const contentOverflowsBottom = contentRect.bottom > containerRect.bottom;
        const needsScrolling = contentOverflowsTop || contentOverflowsBottom || 
                              slideContent.scrollHeight > slideContainer.clientHeight;
        
        if (needsScrolling) {
            // Content needs scrolling within the container
            slideContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            
            // Also provide visual feedback
            this.showScrollIndicator();
        } else {
            // Content fits entirely - scroll the page instead for better UX
            window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
    }

    showScrollIndicator() {
        // Show a brief visual indicator that scrolling occurred
        let indicator = document.querySelector('.scroll-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '↕ 스크롤 중';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        clearTimeout(this.scrollIndicatorTimeout);
        this.scrollIndicatorTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1000);
    }

    showKeyboardIndicator() {
        let indicator = document.querySelector('.keyboard-navigation');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'keyboard-navigation';
            indicator.innerHTML = '← → 슬라이드 이동 | 스페이스바 다음 슬라이드 | ↑ ↓ 스크롤 | F11 전체화면 | ESC 나가기';
            document.body.appendChild(indicator);
        }

        indicator.classList.add('show');
        clearTimeout(this.keyboardTimeout);
        this.keyboardTimeout = setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    async loadPresentation() {
        const selectedSource = document.querySelector('input[name="repo-source"]:checked').value;
        
        // Handle local files - redirect to loadLocalFiles
        if (selectedSource === 'local') {
            await this.loadLocalFiles();
            return;
        }
        
        // Handle direct input - redirect to loadDirectInput
        if (selectedSource === 'direct') {
            await this.loadDirectInput();
            return;
        }
        
        // Handle GitHub repository sources
        const folderPath = document.getElementById('folder-dropdown').value;
        
        if (!document.getElementById('folder-selection').classList.contains('hidden') && !folderPath && folderPath !== '') {
            alert('폴더를 선택해주세요.');
            return;
        }
        
        let owner, repo;
        
        if (selectedSource === 'current') {
            if (!this.currentRepo) {
                alert('현재 GitHub Pages 리포지토리를 감지할 수 없습니다.');
                return;
            }
            owner = this.currentRepo.owner;
            repo = this.currentRepo.repo;
        } else if (selectedSource === 'custom') {
            const repoUrl = document.getElementById('repo-url').value.trim();
            if (!repoUrl) {
                alert('GitHub 리포지토리 URL을 입력해주세요.');
                return;
            }
            try {
                const parsed = this.parseGitHubUrl(repoUrl);
                owner = parsed.owner;
                repo = parsed.repo;
            } catch (error) {
                alert(error.message);
                return;
            }
        } else {
            alert('올바른 소스를 선택해주세요.');
            return;
        }

        await this.loadPresentationFromRepo(owner, repo, folderPath);
    }

    async loadPresentationFromRepo(owner, repo, folderName) {
        try {
            this.showLoading(true);
            
            // Fetch repository contents
            const files = await this.fetchRepositoryFiles(owner, repo, folderName);
            
            // Load markdown files and convert to slides
            await this.loadMarkdownFiles(owner, repo, files);
            
            if (this.slides.length === 0) {
                throw new Error('마크다운 파일을 찾을 수 없습니다.');
            }

            // Try to load logo
            await this.loadPresentationLogo(owner, repo, folderName);

            // Add to recent items
            this.addToRecentItems({
                type: 'repo',
                owner: owner,
                repo: repo,
                folder: folderName
            });

            // Show presentation
            this.showPresentation();
            
        } catch (error) {
            console.error('프레젠테이션 로드 실패:', error);
            alert(`프레젠테이션을 로드할 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    parseGitHubUrl(url) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('올바른 GitHub URL 형식이 아닙니다.');
        }
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }

    async fetchRepositoryFiles(owner, repo, folderName = '') {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
            }
            
            const contents = await response.json();
            let markdownFiles = [];

            for (const item of contents) {
                if (item.type === 'file' && item.name.endsWith('.md')) {
                    // If no folder name specified, include all markdown files
                    if (!folderName) {
                        markdownFiles.push(item);
                    }
                } else if (item.type === 'dir' && folderName && 
                          item.name.toLowerCase() === folderName.toLowerCase()) {
                    // Check inside exact folder name match
                    const dirResponse = await fetch(item.url);
                    if (dirResponse.ok) {
                        const dirContents = await dirResponse.json();
                        const dirMarkdownFiles = dirContents.filter(file => 
                            file.type === 'file' && file.name.endsWith('.md')
                        );
                        markdownFiles.push(...dirMarkdownFiles);
                    }
                }
            }

            return markdownFiles.sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            throw new Error(`리포지토리 파일을 가져올 수 없습니다: ${error.message}`);
        }
    }

    async loadMarkdownFiles(owner, repo, files) {
        this.slides = [];
        this.fileSlideMap = [];
        this.originalMarkdownContent = '';
        this.currentFileName = '';
        
        for (const file of files) {
            try {
                const response = await fetch(file.download_url);
                if (response.ok) {
                    const content = await response.text();
                    
                    // Store the markdown content
                    if (this.originalMarkdownContent.length > 0) {
                        this.originalMarkdownContent += '\n\n---\n\n';
                    }
                    this.originalMarkdownContent += content;
                    
                    // Store the first file name
                    if (!this.currentFileName) {
                        this.currentFileName = file.name;
                    }
                    
                    // Get the folder path from the file path
                    const folderPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
                    const slides = this.parseMarkdownToSlides(content, owner, repo, folderPath);
                    
                    // Track file information
                    const fileInfo = {
                        name: file.name,
                        path: file.path,
                        startSlide: this.slides.length,
                        slideCount: slides.length
                    };
                    this.fileSlideMap.push(fileInfo);
                    
                    this.slides.push(...slides);
                }
            } catch (error) {
                console.warn(`파일 로드 실패: ${file.name}`, error);
            }
        }
    }

    parseMarkdownToSlides(markdown, owner, repo, folderPath = '') {
        // Split by slide separator (---)
        const slideContents = markdown.split(/^---\s*$/m).filter(content => content.trim());
        
        return slideContents.map((content, index) => {
            // Process images to use GitHub raw URLs
            let processedContent = this.processImageUrls(content.trim(), owner, repo, folderPath);
            
            // Process LaTeX expressions before markdown parsing
            processedContent = this.processLatexExpressions(processedContent);
            
            // Configure marked with breaks option for line breaks
            const markedOptions = {
                breaks: true,  // Enable line breaks
                gfm: true      // GitHub Flavored Markdown
            };
            
            // First parse markdown to HTML with line break support
            let htmlContent = marked.parse(processedContent, markedOptions);
            
            // Then process custom text formatting syntax on HTML
            htmlContent = this.processCustomSyntax(htmlContent);
            
            return {
                content: processedContent,
                html: htmlContent
            };
        });
    }

    processImageUrls(content, owner, repo, folderPath = '') {
        // First, protect code blocks from processing
        const codeBlocks = [];
        let codeBlockIndex = 0;
        
        // Replace code blocks with placeholders
        content = content.replace(/```[\s\S]*?```/g, (match) => {
            const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
            codeBlocks[codeBlockIndex] = match;
            codeBlockIndex++;
            return placeholder;
        });
        
        // Also protect inline code
        const inlineCode = [];
        let inlineCodeIndex = 0;
        content = content.replace(/`[^`]+`/g, (match) => {
            const placeholder = `__INLINE_CODE_${inlineCodeIndex}__`;
            inlineCode[inlineCodeIndex] = match;
            inlineCodeIndex++;
            return placeholder;
        });
        
        // Convert relative image paths to GitHub raw URLs for markdown images
        content = content.replace(
            /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
            (match, alt, imagePath) => {
                // If folderPath exists, prepend it to the image path
                const fullPath = folderPath ? `${folderPath}/${imagePath}` : imagePath;
                return `![${alt}](https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${fullPath})`;
            }
        );
        
        // Convert relative image paths to GitHub raw URLs for HTML img tags
        content = content.replace(
            /<img([^>]*)\ssrc=["'](?!https?:\/\/)([^"']+)["']([^>]*)>/g,
            (match, beforeSrc, imagePath, afterSrc) => {
                // If folderPath exists, prepend it to the image path
                const fullPath = folderPath ? `${folderPath}/${imagePath}` : imagePath;
                const newSrc = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${fullPath}`;
                return `<img${beforeSrc} src="${newSrc}"${afterSrc}>`;
            }
        );
        
        // Restore inline code
        inlineCode.forEach((code, index) => {
            content = content.replace(`__INLINE_CODE_${index}__`, code);
        });
        
        // Restore code blocks
        codeBlocks.forEach((block, index) => {
            content = content.replace(`__CODE_BLOCK_${index}__`, block);
        });
        
        return content;
    }

    processCustomSyntax(htmlContent) {
        // Process {center}text{/center} - text centering
        htmlContent = htmlContent.replace(
            /\{center\}([\s\S]*?)\{\/center\}/g,
            (match, content) => {
                // Remove leading and trailing <br> tags and whitespace
                let cleanContent = content
                    .replace(/^(\s*<br\s*\/?>)*\s*/, '') // Remove leading br tags and whitespace
                    .replace(/\s*(\s*<br\s*\/?>)*\s*$/, ''); // Remove trailing br tags and whitespace
                
                // Convert multiple br tags to paragraph breaks for better PDF handling
                cleanContent = cleanContent.replace(/\s*<br\s*\/?>\s*<br\s*\/?>\s*/g, '</p><p>');
                
                // If content has paragraph breaks, wrap in paragraphs
                if (cleanContent.includes('</p><p>')) {
                    cleanContent = '<p>' + cleanContent + '</p>';
                }
                
                return `<div class="text-center">${cleanContent}</div>`;
            }
        );
        
        // Process {large}text{/large} - ignore this syntax as it's no longer needed
        htmlContent = htmlContent.replace(
            /\{large\}([\s\S]*?)\{\/large\}/g,
            (match, content) => {
                // Remove leading <br> tags and return content without wrapper
                const cleanContent = content.replace(/^(\s*<br\s*\/?>)*\s*/, '');
                return cleanContent; // 기본 폰트 크기가 이미 효과를 제공하므로 무시
            }
        );
        
        // Process {small}text{/small} - small text (기존 기본 폰트 크기 사용)
        htmlContent = htmlContent.replace(
            /\{small\}([\s\S]*?)\{\/small\}/g,
            (match, content) => {
                // Remove leading <br> tags and whitespace from the beginning
                const cleanContent = content.replace(/^(\s*<br\s*\/?>)*\s*/, '');
                return `<div class="text-small">${cleanContent}</div>`;
            }
        );
        
        // Process {xlarge}text{/xlarge} - extra large text
        htmlContent = htmlContent.replace(
            /\{xlarge\}([\s\S]*?)\{\/xlarge\}/g,
            (match, content) => {
                // Remove heading tags (h1-h6) and keep only the text content
                let cleanContent = content.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '$1');
                // Remove leading <br> tags and whitespace from the beginning
                cleanContent = cleanContent.replace(/^(\s*<br\s*\/?>)*\s*/, '');
                return `<div class="text-xlarge">${cleanContent}</div>`;
            }
        );
        
        // Process {highlight}text{/highlight} - highlighted text
        htmlContent = htmlContent.replace(
            /\{highlight\}([\s\S]*?)\{\/highlight\}/g,
            '<span class="text-highlight">$1</span>'
        );
        
        // Process {bold}text{/bold} - bold text
        htmlContent = htmlContent.replace(
            /\{bold\}([\s\S]*?)\{\/bold\}/g,
            '<strong class="text-bold">$1</strong>'
        );
        
        // Clean up br tags between nested divs in text-center blocks
        htmlContent = htmlContent.replace(
            /<div class="text-center">([\s\S]*?)<\/div>/g,
            (match, content) => {
                // Remove br tags between opening and closing of nested divs
                const cleanContent = content
                    .replace(/(<br\s*\/?>|\s)+$/g, '') // Remove all trailing br tags and whitespace
                    .replace(/(<\/div>)\s*<br\s*\/?>/g, '$1') // Remove br tags right after closing divs
                    .replace(/>(\s*<br\s*\/?>)+\s*<div/g, '><div') // Remove br tags between div tags
                    .replace(/<\/div>(\s*<br\s*\/?>)+\s*$/g, '</div>'); // Remove br tags after last closing div
                return `<div class="text-center">${cleanContent}</div>`;
            }
        );
        
        return htmlContent;
    }

    showPresentation() {
        document.getElementById('repo-input-section').classList.add('hidden');
        document.getElementById('presentation-section').classList.remove('hidden');
        
        // Hide footer in presentation mode
        const footer = document.querySelector('.footer-container');
        if (footer) {
            footer.style.display = 'none';
        }
        
        this.currentSlide = 0;
        this.renderSlide();
        this.updateNavigation();
        
        // Removed auto fullscreen for better UX
    }

    renderSlide() {
        if (this.slides.length === 0) return;

        const slideContent = document.getElementById('slide-content');
        const slide = this.slides[this.currentSlide];
        
        // Add slide transition effect
        slideContent.style.opacity = '0';
        slideContent.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            // Preserve logo element
            const logoElement = document.getElementById('presentation-logo');
            const logoParent = logoElement ? logoElement.parentNode : null;
            
            // Update content
            slideContent.innerHTML = slide.html;
            
            // Re-add logo element if it existed
            if (logoElement && logoParent === slideContent) {
                slideContent.appendChild(logoElement);
            }
            
            this.applySyntaxHighlighting();
            this.renderMathExpressions(); // Render LaTeX expressions
            this.applySettings(); // Apply font settings after content update
            
            // Add a delay for Mermaid to ensure DOM is fully ready
            setTimeout(() => {
                this.renderMermaidDiagrams(); // Render Mermaid diagrams
            }, 300);
            
            slideContent.style.opacity = '1';
            slideContent.style.transform = 'translateX(0)';
        }, 150);
    }

    applySyntaxHighlighting() {
        // Apply Prism.js syntax highlighting
        if (window.Prism) {
            Prism.highlightAll();
        }
    }

    processLatexExpressions(content) {
        // Process LaTeX expressions in markdown content
        // First, protect code blocks from LaTeX processing
        const codeBlockRegex = /```[\s\S]*?```|`[^`]*`/g;
        const codeBlocks = [];
        let protectedContent = content.replace(codeBlockRegex, (match) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push(match);
            return placeholder;
        });
        
        // Handle block math ($$...$$) - convert to KaTeX displaymath
        protectedContent = protectedContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            // Escape math expression to prevent conflicts
            const escapedMath = math.trim();
            return `<div class="math-display" data-math="${this.escapeMath(escapedMath)}"></div>`;
        });
        
        // Handle inline math ($...$) - convert to KaTeX inline
        // Use a more compatible regex that avoids lookbehind assertions
        protectedContent = protectedContent.replace(/\$([^$\n\r]+?)\$/g, (match, math) => {
            // Avoid matching if it's already part of a code block or escaped
            const escapedMath = math.trim();
            return `<span class="math-inline" data-math="${this.escapeMath(escapedMath)}"></span>`;
        });
        
        // Restore code blocks
        protectedContent = protectedContent.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
            return codeBlocks[parseInt(index)];
        });
        
        return protectedContent;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    unescapeHtml(text) {
        const map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'"
        };
        return text.replace(/&(amp|lt|gt|quot|#039);/g, (m) => map[m]);
    }

    escapeMath(text) {
        // Preserve backslashes and other special characters for LaTeX
        return text.replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    unescapeMath(text) {
        // Restore backslashes and other special characters for LaTeX
        return text.replace(/\\\\/g, '\\').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
    }

    renderMathExpressions() {
        // Render LaTeX expressions using KaTeX
        // Add a small delay to ensure DOM is updated and KaTeX is loaded
        setTimeout(() => {
            if (typeof katex !== 'undefined') {
                const slideContent = document.getElementById('slide-content');
                if (slideContent) {
                    this.renderMathInElement(slideContent);
                }
            } else {
                // If KaTeX is not loaded yet, try again after a longer delay
                setTimeout(() => {
                    if (typeof katex !== 'undefined') {
                        const slideContent = document.getElementById('slide-content');
                        if (slideContent) {
                            this.renderMathInElement(slideContent);
                        }
                    } else {
                        console.warn('KaTeX library not loaded. Math expressions will not be rendered.');
                    }
                }, 500);
            }
        }, 100);
    }

    renderMathForPDF(element) {
        // Render LaTeX expressions for PDF export
        // Use a synchronous approach for PDF rendering
        if (typeof katex !== 'undefined') {
            this.renderMathInElement(element);
        } else {
            // If KaTeX is not available, show the raw LaTeX
            const mathElements = element.querySelectorAll('.math-display, .math-inline');
            mathElements.forEach(el => {
                const mathContent = this.unescapeMath(el.getAttribute('data-math'));
                if (el.classList.contains('math-display')) {
                    el.textContent = `$$${mathContent}$$`;
                } else {
                    el.textContent = `$${mathContent}$`;
                }
                el.classList.add('math-error');
            });
        }
    }

    renderMathInElement(container) {
        // Process display math
        const displayMathElements = container.querySelectorAll('.math-display');
        console.log(`Found ${displayMathElements.length} display math elements`);
        
        displayMathElements.forEach((el, index) => {
            const mathContent = this.unescapeMath(el.getAttribute('data-math'));
            console.log(`Rendering display math ${index + 1}:`, mathContent);
            
            try {
                katex.render(mathContent, el, {
                    displayMode: true,
                    throwOnError: false,
                    trust: true
                });
                console.log(`Successfully rendered display math ${index + 1}`);
            } catch (e) {
                console.warn('KaTeX display math render error:', e);
                console.log('Failed math content:', mathContent);
                el.textContent = `$$${mathContent}$$`;
                el.classList.add('math-error');
            }
        });

        // Process inline math
        const inlineMathElements = container.querySelectorAll('.math-inline');
        console.log(`Found ${inlineMathElements.length} inline math elements`);
        
        inlineMathElements.forEach((el, index) => {
            const mathContent = this.unescapeMath(el.getAttribute('data-math'));
            console.log(`Rendering inline math ${index + 1}:`, mathContent);
            
            try {
                katex.render(mathContent, el, {
                    displayMode: false,
                    throwOnError: false,
                    trust: true
                });
                console.log(`Successfully rendered inline math ${index + 1}`);
            } catch (e) {
                console.warn('KaTeX inline math render error:', e);
                console.log('Failed math content:', mathContent);
                el.textContent = `$${mathContent}$`;
                el.classList.add('math-error');
            }
        });
    }

    renderMermaidDiagrams() {
        // Check if Mermaid is available
        if (typeof mermaid !== 'undefined') {
            // Find and render all mermaid blocks
            const slideContent = document.getElementById('slide-content');
            if (slideContent) {
                // Look for code blocks with language-mermaid class
                const mermaidBlocks = slideContent.querySelectorAll('code.language-mermaid');
                console.log(`Found ${mermaidBlocks.length} mermaid blocks`);
                
                mermaidBlocks.forEach((block, index) => {
                    try {
                        // Get the mermaid code
                        const mermaidCode = block.textContent;
                        
                        // Create a unique ID for this diagram
                        const mermaidId = `mermaid-diagram-${Date.now()}-${index}`;
                        
                        // Create a container for the diagram
                        const container = document.createElement('div');
                        container.className = 'mermaid-container';
                        
                        // Create inner div for mermaid content
                        const mermaidDiv = document.createElement('div');
                        mermaidDiv.className = 'mermaid';
                        mermaidDiv.textContent = mermaidCode;
                        container.appendChild(mermaidDiv);
                        
                        // Find the parent pre element
                        const preElement = block.parentElement;
                        let targetElement = preElement && preElement.tagName === 'PRE' ? preElement : block;
                        
                        // Check if the parent has text-center class (from {center} syntax)
                        let parentWithCenter = targetElement.parentElement;
                        console.log(`Checking for text-center class. Starting from:`, targetElement.parentElement);
                        
                        while (parentWithCenter && !parentWithCenter.classList.contains('text-center') && parentWithCenter.id !== 'slide-content') {
                            console.log(`Checking parent:`, parentWithCenter.tagName, parentWithCenter.className);
                            parentWithCenter = parentWithCenter.parentElement;
                        }
                        
                        if (parentWithCenter && parentWithCenter.classList.contains('text-center')) {
                            console.log(`Found text-center class on:`, parentWithCenter.tagName);
                            // Add inline styles for centering only when inside {center}
                            container.style.display = 'flex';
                            container.style.justifyContent = 'center';
                            container.style.alignItems = 'center';
                            container.style.width = '100%';
                            console.log(`Applied center alignment to mermaid container`);
                        } else {
                            console.log(`No text-center class found in parent hierarchy`);
                            // Default styles for non-centered mermaid
                            container.style.display = 'block';
                            container.style.width = '100%';
                        }
                        
                        // Replace the code block with the container
                        targetElement.parentNode.replaceChild(container, targetElement);
                        
                        // Use mermaid.init to render
                        console.log(`Attempting to render mermaid diagram ${index + 1} with code:`, mermaidCode);
                        try {
                            mermaid.init(undefined, mermaidDiv);
                            console.log(`Successfully initialized mermaid diagram ${index + 1}`);
                        } catch (error) {
                            console.error('Mermaid init error:', error);
                            container.innerHTML = `<div class="mermaid-error">Mermaid 다이어그램 렌더링 오류: ${error.message || error}</div>`;
                        }
                    } catch (e) {
                        console.error('Mermaid processing error:', e);
                    }
                });
            }
        } else {
            console.warn('Mermaid library not loaded. Diagrams will not be rendered.');
        }
    }

    updateNavigation() {
        const pageInput = document.getElementById('page-input');
        const totalPages = document.getElementById('total-pages');
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        // Update page input and total pages
        pageInput.value = this.currentSlide + 1;
        pageInput.max = this.slides.length;
        totalPages.textContent = this.slides.length;
        
        prevBtn.disabled = this.currentSlide === 0;
        nextBtn.disabled = this.currentSlide === this.slides.length - 1;
        
        prevBtn.classList.toggle('opacity-50', this.currentSlide === 0);
        nextBtn.classList.toggle('opacity-50', this.currentSlide === this.slides.length - 1);
        
        // Update file navigation highlighting
        this.updateFileNavigationHighlight();
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.renderSlide();
            this.updateNavigation();
        }
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderSlide();
            this.updateNavigation();
        }
    }

    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.renderSlide();
            this.updateNavigation();
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        const container = document.getElementById('slide-container');
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        } else {
            // Fallback for browsers that don't support fullscreen API
            // Add fullscreen classes with proper theme handling
            container.classList.add('fixed', 'inset-0', 'z-[9999]', 'p-8', 'overflow-auto', 'flex', 'items-center', 'justify-center');
            // Add specific fullscreen background class
            container.classList.add('fullscreen-fallback');
            this.isFullscreen = true;
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else {
            // Fallback
            const container = document.getElementById('slide-container');
            // Remove all fullscreen classes
            container.classList.remove('fixed', 'inset-0', 'z-[9999]', 'bg-white', 'bg-gray-900', 'p-8', 'overflow-auto', 'flex', 'items-center', 'justify-center', 'fullscreen-fallback');
            this.isFullscreen = false;
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
        } else {
            html.classList.add('dark');
        }
        
        // Fullscreen background will be handled automatically by CSS classes
    }

    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        
        // Update form values (keep for compatibility)
        const oldFontFamily = document.getElementById('font-family');
        if (oldFontFamily) {
            oldFontFamily.value = this.settings.headingFont; // Use heading font as fallback
        }
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    toggleSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        if (dropdown.classList.contains('hidden')) {
            // Update dropdown values with current settings
            document.getElementById('heading-font-dropdown').value = this.settings.headingFont;
            document.getElementById('body-font-dropdown').value = this.settings.bodyFont;
            document.getElementById('code-font-dropdown').value = this.settings.codeFont;
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    }

    closeSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        dropdown.classList.add('hidden');
    }

    toggleFileListPopup() {
        const popup = document.getElementById('file-list-popup');
        const content = document.getElementById('file-list-content');
        
        if (popup.classList.contains('hidden')) {
            // Show popup and populate with file list
            this.populateFileListPopup(content);
            popup.classList.remove('hidden');
        } else {
            popup.classList.add('hidden');
        }
    }

    populateFileListPopup(content) {
        content.innerHTML = '';
        
        if (this.fileSlideMap.length === 0) {
            content.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 text-sm">파일이 없습니다</div>';
            return;
        }

        this.fileSlideMap.forEach((fileInfo, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm';
            fileItem.innerHTML = `
                <div class="font-medium text-gray-900 dark:text-white">${fileInfo.name}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">슬라이드 ${fileInfo.startSlide + 1}-${fileInfo.startSlide + fileInfo.slideCount}</div>
            `;
            
            fileItem.addEventListener('click', () => {
                this.goToSlide(fileInfo.startSlide);
                document.getElementById('file-list-popup').classList.add('hidden');
            });
            
            content.appendChild(fileItem);
        });
    }

    getFontFamily(fontKey) {
        const fontMap = {
            'default': 'inherit',
            'bmjua': 'BMJUA, sans-serif',
            'bmhanna': 'BMHANNA, sans-serif',
            'bmhannapro': 'BMHANNAPro, sans-serif',
            'bmhanna11yrs': 'BMHANNA11yrs, sans-serif',
            'bmdohyeon': 'BMDOHYEON, sans-serif',
            'bmyeonsung': 'BMYEONSUNG, sans-serif',
            'bmeuljirot': 'BMEULJIROT, sans-serif',
            'bmeuljirobold': 'BMEuljiro10yearslater, sans-serif',
            'bmeuljirovintage': 'BMEuljirooraeorae, sans-serif',
            'bmkiranghaerang': 'BMKIRANGHAERANG, sans-serif',
            'maruburi': 'MaruBuri, sans-serif',
            'd2coding': 'D2Coding, monospace',
            'nanumbarungothic': 'NanumBarunGothic, sans-serif',
            'nanumbarunpen': 'NanumBarunpen, sans-serif',
            'nanumgothic': 'NanumGothic, sans-serif',
            'nanumsquare': 'NanumSquare, sans-serif'
        };
        return fontMap[fontKey] || fontMap['default'];
    }

    applyFontsToElement(element) {
        // Apply heading fonts (H1-H6) with !important for PDF
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            const fontFamily = this.getFontFamily(this.settings.headingFont);
            heading.style.setProperty('font-family', fontFamily, 'important');
        });

        // Apply body font to paragraphs, lists, and general text with !important for PDF
        const bodyElements = element.querySelectorAll('p, li, ul, ol, div:not(.highlight), span:not(.token)');
        bodyElements.forEach(el => {
            const fontFamily = this.getFontFamily(this.settings.bodyFont);
            el.style.setProperty('font-family', fontFamily, 'important');
        });

        // Apply code font to code blocks (pre elements and code inside pre) with !important for PDF
        const preElements = element.querySelectorAll('pre');
        preElements.forEach(el => {
            const fontFamily = this.getFontFamily(this.settings.codeFont);
            el.style.setProperty('font-family', fontFamily, 'important');
            // Also apply to code elements inside pre
            const innerCode = el.querySelectorAll('code');
            innerCode.forEach(code => {
                code.style.setProperty('font-family', fontFamily, 'important');
            });
        });
        
        // Apply body font to inline code (code elements NOT inside pre) with !important for PDF
        const allCodeElements = element.querySelectorAll('code');
        allCodeElements.forEach(el => {
            // Check if this code element is NOT inside a pre element
            if (!el.closest('pre')) {
                const fontFamily = this.getFontFamily(this.settings.bodyFont);
                el.style.setProperty('font-family', fontFamily, 'important');
            }
        });
        
        // Apply code font to syntax highlighted tokens
        const tokenElements = element.querySelectorAll('.token');
        tokenElements.forEach(el => {
            const fontFamily = this.getFontFamily(this.settings.codeFont);
            el.style.setProperty('font-family', fontFamily, 'important');
        });
    }

    applySettings() {
        const slideContent = document.getElementById('slide-content');
        if (!slideContent) return;
        
        this.applyFontsToElement(slideContent);
    }

    saveSettings() {
        localStorage.setItem('github-presenter-settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('github-presenter-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }

    resetFontSettings() {
        // Reset to default values
        this.settings.headingFont = 'bmjua';
        this.settings.bodyFont = 'bmjua';
        this.settings.codeFont = 'd2coding';
        
        // Update UI
        if (!document.getElementById('settings-dropdown').classList.contains('hidden')) {
            document.getElementById('heading-font-dropdown').value = this.settings.headingFont;
            document.getElementById('body-font-dropdown').value = this.settings.bodyFont;
            document.getElementById('code-font-dropdown').value = this.settings.codeFont;
        }
        
        // Apply and save settings
        this.applySettings();
        this.saveSettings();
    }

    goHome() {
        // Reset to input section
        document.getElementById('presentation-section').classList.add('hidden');
        document.getElementById('repo-input-section').classList.remove('hidden');
        
        // Exit fullscreen if active
        if (this.isFullscreen) {
            this.exitFullscreen();
        }
        
        // Reset slides
        this.slides = [];
        this.currentSlide = 0;
        this.fileSlideMap = [];
        
        // Hide logo
        document.getElementById('presentation-logo').classList.add('hidden');
    }

    async loadPresentationLogo(owner, repo, folderName) {
        const logoNames = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.gif'];
        const logoContainer = document.getElementById('presentation-logo');
        const logoImage = document.getElementById('logo-image');
        
        // Reset logo state
        logoContainer.classList.add('hidden');
        logoImage.src = '';
        
        try {
            // Try to find logo in the specified folder or root
            const apiUrl = folderName ? 
                `https://api.github.com/repos/${owner}/${repo}/contents/${folderName}` :
                `https://api.github.com/repos/${owner}/${repo}/contents`;
            
            console.log('Searching for logo in:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.warn('Failed to fetch repository contents:', response.status);
                return;
            }
            
            const contents = await response.json();
            console.log('Repository contents:', contents.map(item => item.name));
            
            // Look for logo files
            for (const logoName of logoNames) {
                const logoFile = contents.find(item => 
                    item.type === 'file' && item.name.toLowerCase() === logoName
                );
                
                if (logoFile) {
                    console.log('Found logo file:', logoFile.name);
                    // Test if the image loads successfully
                    const logoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${logoFile.path}`;
                    console.log('Logo URL:', logoUrl);
                    
                    const img = new Image();
                    
                    img.onload = () => {
                        console.log('Logo loaded successfully');
                        logoImage.src = logoUrl;
                        logoContainer.classList.remove('hidden');
                        // Force a layout update
                        logoContainer.style.display = 'block';
                    };
                    
                    img.onerror = () => {
                        console.warn(`Logo file found but failed to load: ${logoUrl}`);
                    };
                    
                    img.src = logoUrl;
                    break; // Use the first logo found
                }
            }
            
            if (!contents.some(item => logoNames.includes(item.name.toLowerCase()))) {
                console.log('No logo files found in repository');
            }
        } catch (error) {
            console.warn('Logo loading failed:', error);
        }
    }

    async loadLocalLogo(files) {
        const logoNames = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.gif'];
        const logoContainer = document.getElementById('presentation-logo');
        const logoImage = document.getElementById('logo-image');
        
        // Look for logo files in the uploaded files
        for (const logoName of logoNames) {
            const logoFile = Array.from(files).find(file => 
                file.name.toLowerCase() === logoName
            );
            
            if (logoFile) {
                try {
                    const logoUrl = URL.createObjectURL(logoFile);
                    logoImage.src = logoUrl;
                    logoContainer.classList.remove('hidden');
                    break; // Use the first logo found
                } catch (error) {
                    console.warn(`Failed to load local logo: ${logoFile.name}`, error);
                }
            }
        }
    }

    goToFirstSlide() {
        if (this.slides.length > 0) {
            this.goToSlide(0);
        } else {
            this.goHome();
        }
    }

    goToPageInput(pageNumber) {
        const page = parseInt(pageNumber);
        if (page >= 1 && page <= this.slides.length) {
            this.goToSlide(page - 1);
        } else {
            // Reset to current page if invalid
            document.getElementById('page-input').value = this.currentSlide + 1;
        }
    }

    toggleFileNavigation() {
        const sidebar = document.getElementById('file-nav-sidebar');
        if (sidebar.classList.contains('hidden')) {
            this.showFileNavigation();
        } else {
            this.closeFileNavigation();
        }
    }

    showFileNavigation() {
        const sidebar = document.getElementById('file-nav-sidebar');
        sidebar.classList.remove('hidden');
        this.populateFileNavigation();
    }

    closeFileNavigation() {
        const sidebar = document.getElementById('file-nav-sidebar');
        sidebar.classList.add('hidden');
    }

    populateFileNavigation() {
        const fileNavList = document.getElementById('file-nav-list');
        fileNavList.innerHTML = '';
        
        this.fileSlideMap.forEach((fileInfo, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-nav-item cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            fileItem.innerHTML = `
                <div class="text-sm font-medium text-gray-900 dark:text-white">${fileInfo.name}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">슬라이드 ${fileInfo.startSlide + 1}-${fileInfo.startSlide + fileInfo.slideCount}</div>
            `;
            
            fileItem.addEventListener('click', () => {
                this.goToSlide(fileInfo.startSlide);
                this.closeFileNavigation();
            });
            
            fileNavList.appendChild(fileItem);
        });
    }

    updateFileNavigationHighlight() {
        const fileNavItems = document.querySelectorAll('.file-nav-item');
        fileNavItems.forEach((item, index) => {
            const fileInfo = this.fileSlideMap[index];
            if (fileInfo && this.currentSlide >= fileInfo.startSlide && 
                this.currentSlide < fileInfo.startSlide + fileInfo.slideCount) {
                item.classList.add('bg-blue-100', 'dark:bg-blue-900');
            } else {
                item.classList.remove('bg-blue-100', 'dark:bg-blue-900');
            }
        });
    }

    handleFileUpload() {
        const fileInput = document.getElementById('file-upload');
        const loadLocalBtn = document.getElementById('load-local-files-btn');
        
        if (fileInput.files.length > 0) {
            loadLocalBtn.classList.remove('hidden');
            this.displayUploadedFiles(fileInput.files);
        } else {
            loadLocalBtn.classList.add('hidden');
            this.hideUploadedFiles();
        }
    }

    async updateFilePreview() {
        const fileInput = document.getElementById('file-upload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            this.clearPreview();
            return;
        }
        
        try {
            // Check for markdown files
            const markdownFiles = Array.from(files).filter(file => 
                file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md')
            );
            
            // Check for ZIP files
            const zipFiles = Array.from(files).filter(file => 
                file.name.toLowerCase().endsWith('.zip')
            );
            
            if (markdownFiles.length > 0) {
                // Read and combine all markdown files for preview
                let combinedMarkdown = '';
                
                for (const file of markdownFiles) {
                    const content = await this.readFileContent(file);
                    if (combinedMarkdown.length > 0) {
                        combinedMarkdown += '\n\n---\n\n'; // Add slide separator between files
                    }
                    combinedMarkdown += content;
                }
                
                // Parse and render preview
                this.previewSlides = this.parseLocalMarkdownToSlides(combinedMarkdown, true);
                this.currentPreviewSlide = 0;
                this.renderSlideThumbnails();
            } else if (zipFiles.length > 0) {
                // Process ZIP files for preview
                this.showPreviewLoading('ZIP 파일 처리 중...');
                
                let combinedMarkdown = '';
                for (const zipFile of zipFiles) {
                    try {
                        const markdownContent = await this.processZipFile(zipFile, true); // true for preview mode
                        if (combinedMarkdown.length > 0) {
                            combinedMarkdown += '\n\n---\n\n';
                        }
                        combinedMarkdown += markdownContent;
                    } catch (error) {
                        console.warn(`ZIP 파일 미리보기 실패: ${zipFile.name}`, error);
                    }
                }
                
                if (combinedMarkdown) {
                    // Parse and render preview
                    this.previewSlides = this.parseLocalMarkdownToSlides(combinedMarkdown, true);
                    this.currentPreviewSlide = 0;
                    this.renderSlideThumbnails();
                } else {
                    this.showPreviewError('ZIP 파일에서 마크다운을 찾을 수 없습니다');
                }
            } else {
                // Show message for other file types
                const slideThumbnails = document.getElementById('slide-thumbnails');
                slideThumbnails.innerHTML = `
                    <div class="text-center text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
                        <div>
                            <svg class="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-sm">지원하지 않는 파일 형식입니다</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('File preview error:', error);
            this.showPreviewError('파일 미리보기 중 오류가 발생했습니다: ' + error.message);
        }
    }

    displayUploadedFiles(files) {
        const filesList = document.getElementById('uploaded-files-list');
        const fileItems = document.getElementById('file-items');
        
        if (!filesList || !fileItems) return;
        
        // Clear existing items
        fileItems.innerHTML = '';
        
        // Show the files list
        filesList.classList.remove('hidden');
        
        // Add each file to the list
        Array.from(files).forEach((file, index) => {
            const fileItem = this.createFileItem(file, index);
            fileItems.appendChild(fileItem);
        });
    }

    createFileItem(file, index) {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600';
        
        const fileSize = this.formatFileSize(file.size);
        const fileType = this.getFileTypeDisplay(file.name);
        
        fileItem.innerHTML = `
            <div class="flex items-center space-x-3">
                ${this.getFileIcon(file.name)}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate" title="${file.name}">
                        ${file.name}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${fileType} • ${fileSize}
                    </p>
                </div>
            </div>
            <button class="file-remove-btn ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors" data-index="${index}" title="파일 제거">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        // Add remove button event listener
        const removeBtn = fileItem.querySelector('.file-remove-btn');
        removeBtn.addEventListener('click', () => this.removeFile(index));
        
        return fileItem;
    }

    getFileIcon(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        
        if (extension === 'zip') {
            return `
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
            `;
        } else if (extension === 'md') {
            return `
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            `;
        } else {
            return `
                <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            `;
        }
    }

    getFileTypeDisplay(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'zip':
                return 'Notion 내보내기';
            case 'md':
                return '마크다운 파일';
            default:
                return extension.toUpperCase() + ' 파일';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        const fileInput = document.getElementById('file-upload');
        if (!fileInput.files) return;
        
        // Prevent any form submission during file removal
        const form = document.getElementById('repo-form');
        const tempHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        if (form) {
            form.addEventListener('submit', tempHandler, true);
        }
        
        try {
            // Create a new FileList without the removed file
            const dt = new DataTransfer();
            const files = Array.from(fileInput.files);
            
            files.forEach((file, i) => {
                if (i !== index) {
                    dt.items.add(file);
                }
            });
            
            fileInput.files = dt.files;
            
            // Update the display and preview
            if (fileInput.files.length > 0) {
                this.displayUploadedFiles(fileInput.files);
                this.updateFilePreview(); // Update preview after file removal
            } else {
                this.hideUploadedFiles();
                this.clearPreview(); // Clear preview when no files
                const loadLocalBtn = document.getElementById('load-local-files-btn');
                if (loadLocalBtn) {
                    loadLocalBtn.classList.add('hidden');
                }
            }
        } catch (error) {
            console.warn('파일 제거 중 오류:', error);
        } finally {
            // Remove the temporary form submission handler
            if (form) {
                setTimeout(() => {
                    form.removeEventListener('submit', tempHandler, true);
                }, 100);
            }
        }
    }

    hideUploadedFiles() {
        const filesList = document.getElementById('uploaded-files-list');
        if (filesList) {
            filesList.classList.add('hidden');
        }
    }

    async loadLocalFiles() {
        // Check if we're loading from recent items
        if (this.loadingFromRecentItem && this.recentItemData) {
            try {
                this.showLoading(true);
                
                // Use stored data
                this.slides = this.recentItemData.slides || [];
                this.fileSlideMap = this.recentItemData.fileSlideMap || [];
                
                // Restore logo if available
                if (this.recentItemData.logo) {
                    const logoElement = document.getElementById('presentation-logo');
                    logoElement.src = this.recentItemData.logo;
                    logoElement.classList.remove('hidden');
                }
                
                // Reset flags
                this.loadingFromRecentItem = false;
                this.recentItemData = null;
                
                // Show presentation
                this.showPresentation();
                return;
            } catch (error) {
                console.error('Failed to load from recent item:', error);
                this.loadingFromRecentItem = false;
                this.recentItemData = null;
            } finally {
                this.showLoading(false);
            }
        }
        
        // Normal file upload flow
        const fileInput = document.getElementById('file-upload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            alert('파일을 선택해주세요.');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // Check if there are ZIP files
            const zipFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.zip'));
            const markdownFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.md'));
            
            if (zipFiles.length > 0) {
                // Process ZIP files (Notion exports)
                await this.loadZipFiles(zipFiles);
            } else if (markdownFiles.length > 0) {
                // Process regular markdown files
                await this.loadLocalMarkdownFiles(files);
            } else {
                throw new Error('마크다운 파일(.md) 또는 ZIP 파일을 선택해주세요.');
            }
            
            if (this.slides.length === 0) {
                throw new Error('유효한 마크다운 슬라이드를 찾을 수 없습니다.');
            }
            
            // Try to load logo from local files (only for non-ZIP uploads)
            if (zipFiles.length === 0) {
                await this.loadLocalLogo(files);
            }
            
            // Add to recent items with content
            const fileNames = Array.from(files).map(f => f.name).join(', ');
            
            // Try to store the content in localStorage
            let contentToStore = null;
            try {
                // For simplicity, store the current slides as content
                const dataToStore = JSON.stringify({
                    slides: this.slides,
                    fileSlideMap: this.fileSlideMap,
                    logo: document.getElementById('presentation-logo').src || null
                });
                
                // Compress the data if LZString is available
                if (typeof LZString !== 'undefined') {
                    contentToStore = LZString.compressToUTF16(dataToStore);
                    const originalSize = new Blob([dataToStore]).size;
                    const compressedSize = new Blob([contentToStore]).size;
                    console.log(`Compressed local file content: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${Math.round(compressedSize / originalSize * 100)}%)`);
                } else {
                    contentToStore = dataToStore;
                    console.log('LZString not available, storing uncompressed. Size:', new Blob([contentToStore]).size);
                }
            } catch (e) {
                console.warn('Could not serialize content for storage:', e);
            }
            
            this.addToRecentItems({
                type: 'local',
                fileName: fileNames,
                content: contentToStore
            });
            
            this.showPresentation();
            
        } catch (error) {
            console.error('로컬 파일 로드 실패:', error);
            alert(`파일을 로드할 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async loadZipFiles(zipFiles) {
        this.slides = [];
        this.fileSlideMap = [];
        
        for (const zipFile of zipFiles) {
            try {
                const markdownContent = await this.processZipFile(zipFile);
                const slides = this.parseLocalMarkdownToSlides(markdownContent);
                
                // Track file information
                const fileInfo = {
                    name: zipFile.name,
                    path: zipFile.name,
                    startSlide: this.slides.length,
                    slideCount: slides.length
                };
                this.fileSlideMap.push(fileInfo);
                
                this.slides.push(...slides);
                
            } catch (error) {
                console.warn(`ZIP 파일 처리 실패: ${zipFile.name}`, error);
                // Continue processing other files instead of stopping
            }
        }
        
        // Hide logo for ZIP imports (Notion exports typically don't need logos)
        document.getElementById('presentation-logo').classList.add('hidden');
    }

    async loadDirectInput() {
        const directInputTextarea = document.getElementById('markdown-textarea');
        const markdown = directInputTextarea.value.trim();
        
        if (!markdown) {
            alert('마크다운 내용을 입력해주세요.');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // Parse the markdown content using the local parsing method
            const slides = this.parseLocalMarkdownToSlides(markdown);
            
            if (slides.length === 0) {
                throw new Error('유효한 마크다운 슬라이드를 찾을 수 없습니다.');
            }
            
            // Store the original markdown content
            this.originalMarkdownContent = markdown;
            this.currentFileName = 'direct_input';
            
            // Reset slides and file mapping
            this.slides = slides;
            this.fileSlideMap = [{
                name: '직접 입력',
                path: 'direct-input',
                startSlide: 0,
                slideCount: slides.length
            }];
            
            // Hide logo for direct input
            document.getElementById('presentation-logo').classList.add('hidden');
            
            // Add to recent items with compression if available
            let contentToStore = markdown;
            if (typeof LZString !== 'undefined' && markdown.length > 1024) {
                // Compress if content is larger than 1KB
                contentToStore = LZString.compressToUTF16(markdown);
                console.log(`Compressed direct input: ${(markdown.length / 1024).toFixed(1)}KB → ${(contentToStore.length / 1024).toFixed(1)}KB`);
            }
            
            this.addToRecentItems({
                type: 'direct',
                content: contentToStore,
                compressed: typeof LZString !== 'undefined' && markdown.length > 1024
            });
            
            // Show the presentation
            this.showPresentation();
            
        } catch (error) {
            console.error('직접 입력 로드 실패:', error);
            alert(`마크다운을 로드할 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    goToHome() {
        // Hide presentation section and show repository input section
        document.getElementById('presentation-section').classList.add('hidden');
        document.getElementById('repo-input-section').classList.remove('hidden');
        
        // Show footer again when leaving presentation mode (desktop only)
        const footer = document.querySelector('.footer-container');
        if (footer && window.innerWidth > 640) {
            footer.style.display = '';
        }
        
        // Reset slides and file mapping
        this.slides = [];
        this.fileSlideMap = [];
        this.currentSlide = 0;
        
        // Show logo if it was hidden
        document.getElementById('presentation-logo').classList.remove('hidden');
        
        // Focus on the first input field if available
        const firstInput = document.querySelector('input[type="url"], textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }

    async loadLocalMarkdownFiles(files) {
        this.slides = [];
        this.fileSlideMap = [];
        this.originalMarkdownContent = '';
        
        const fileArray = Array.from(files);
        // Sort files by name
        fileArray.sort((a, b) => a.name.localeCompare(b.name));
        
        let isFirstFile = true;
        
        for (const file of fileArray) {
            if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                try {
                    const content = await this.readFileContent(file);
                    
                    // Store the combined markdown content
                    if (!isFirstFile) {
                        this.originalMarkdownContent += '\n\n---\n\n';
                    }
                    this.originalMarkdownContent += content;
                    isFirstFile = false;
                    
                    // Store the first markdown file name
                    if (!this.currentFileName) {
                        this.currentFileName = file.name;
                    }
                    
                    // For local files, we need to handle image paths differently
                    const slides = this.parseLocalMarkdownToSlides(content);
                    
                    // Track file information
                    const fileInfo = {
                        name: file.name,
                        path: file.name,
                        startSlide: this.slides.length,
                        slideCount: slides.length
                    };
                    this.fileSlideMap.push(fileInfo);
                    
                    this.slides.push(...slides);
                } catch (error) {
                    console.warn(`파일 읽기 실패: ${file.name}`, error);
                }
            }
        }
    }

    parseLocalMarkdownToSlides(markdown, trackPosition = false) {
        const slides = [];
        
        if (trackPosition) {
            // Track position of each slide in the original markdown
            const separator = /^---\s*$/m;
            let currentPosition = 0;
            let match;
            let lastIndex = 0;
            
            // Use a regex to find all separator positions
            const regex = new RegExp(separator.source, 'gm');
            const positions = [];
            
            while ((match = regex.exec(markdown)) !== null) {
                positions.push(match.index);
            }
            
            // Add the end position
            positions.push(markdown.length);
            
            // Extract slides with their positions
            for (let i = 0; i < positions.length; i++) {
                const start = i === 0 ? 0 : positions[i - 1] + 3; // +3 to skip the "---"
                const end = positions[i];
                const rawContent = markdown.substring(start, end);
                const content = rawContent.trim();
                
                if (content) {
                    slides.push({
                        rawMarkdown: rawContent,
                        startPosition: start,
                        endPosition: end,
                        content: content,
                        index: slides.length
                    });
                }
            }
            
            // If no slides found, treat entire content as one slide
            if (slides.length === 0 && markdown.trim()) {
                slides.push({
                    rawMarkdown: markdown,
                    startPosition: 0,
                    endPosition: markdown.length,
                    content: markdown.trim(),
                    index: 0
                });
            }
        } else {
            // Original behavior without position tracking
            const slideContents = markdown.split(/^---\s*$/m).filter(content => content.trim());
            
            // If no slides found, treat entire content as one slide
            if (slideContents.length === 0) {
                slideContents.push(markdown);
            }
            
            slideContents.forEach((content, index) => {
                slides.push({
                    content: content.trim(),
                    index: index
                });
            });
        }
        
        // Process each slide to generate HTML
        return slides.map((slide) => {
            let htmlContent;
            
            // Try to use marked.js if available, otherwise fallback to basic processing
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                try {
                    // Process LaTeX expressions first if function exists
                    let contentForParsing = slide.content;
                    if (typeof this.processLatexExpressions === 'function') {
                        contentForParsing = this.processLatexExpressions(contentForParsing);
                    }
                    
                    // Configure marked with breaks option for line breaks
                    const markedOptions = {
                        breaks: true,  // Enable line breaks
                        gfm: true      // GitHub Flavored Markdown
                    };
                    
                    htmlContent = marked.parse(contentForParsing, markedOptions);
                    
                    // Process custom syntax if function exists
                    if (typeof this.processCustomSyntax === 'function') {
                        htmlContent = this.processCustomSyntax(htmlContent);
                    }
                } catch (error) {
                    console.warn('Marked.js parsing failed, using basic parser:', error);
                    htmlContent = this.basicMarkdownToHtml(slide.content);
                }
            } else {
                // Fallback to basic markdown processing
                htmlContent = this.basicMarkdownToHtml(slide.content);
            }
            
            // Return slide object with all information
            return {
                ...slide,
                html: htmlContent
            };
        });
    }
    
    basicMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Headers (with proper spacing)
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Lists
        html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```[\s\S]*?```/g, '<pre><code>$&</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Split into paragraphs
        const paragraphs = html.split(/\n\s*\n/);
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            
            // Don't wrap headers, lists, or code blocks in paragraphs
            if (p.match(/^<(h[1-6]|ul|pre)/)) {
                return p;
            }
            
            // Replace single line breaks with <br>
            p = p.replace(/\n/g, '<br>');
            return `<p>${p}</p>`;
        }).filter(p => p).join('');
        
        return html;
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error(`파일 읽기 실패: ${file.name}`));
            reader.readAsText(file, 'UTF-8');
        });
    }

    showLoading(show, message = '프레젠테이션을 로드하는 중...') {
        const loading = document.getElementById('loading');
        const loadingText = document.getElementById('loading-text');
        if (show) {
            loadingText.textContent = message;
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    openFileDialog() {
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.click();
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileUpload = document.getElementById('file-upload');
        const localFileFields = document.getElementById('local-file-fields');

        if (!dropZone || !fileUpload) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                if (!localFileFields.classList.contains('hidden')) {
                    dropZone.classList.add('border-blue-500', 'bg-blue-100', 'dark:bg-blue-900');
                    dropZone.classList.remove('border-gray-300', 'dark:border-gray-600');
                }
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-blue-500', 'bg-blue-100', 'dark:bg-blue-900');
                dropZone.classList.add('border-gray-300', 'dark:border-gray-600');
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileUpload.files = files;
                this.handleFileUpload();
                this.updateFilePreview();
                this.showDropSuccessMessage(files.length);
            }
        }, false);

        // Also make the drop zone clickable for better UX
        dropZone.addEventListener('click', (e) => {
            // Don't trigger if clicking on the file select button
            if (!e.target.closest('#file-select-btn')) {
                this.openFileDialog();
            }
        });
    }

    showDropSuccessMessage(fileCount) {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        // Temporarily show success message
        const originalContent = dropZone.innerHTML;
        dropZone.innerHTML = `
            <div class="space-y-3">
                <svg class="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                    <p class="text-lg font-medium text-green-700 dark:text-green-300">${fileCount}개 파일이 업로드되었습니다</p>
                    <p class="text-sm text-green-600 dark:text-green-400">아래에서 파일 목록을 확인하세요</p>
                </div>
            </div>
        `;
        
        dropZone.classList.add('border-green-500', 'bg-green-100', 'dark:bg-green-900');
        dropZone.classList.remove('border-gray-300', 'dark:border-gray-600');

        setTimeout(() => {
            dropZone.innerHTML = originalContent;
            dropZone.classList.remove('border-green-500', 'bg-green-100', 'dark:bg-green-900');
            dropZone.classList.add('border-gray-300', 'dark:border-gray-600');
            // Re-bind the click event to the new content
            this.bindDropZoneClick();
        }, 2000);
    }

    bindDropZoneClick() {
        const dropZone = document.getElementById('drop-zone');
        const fileSelectBtn = document.getElementById('file-select-btn');
        
        if (dropZone && fileSelectBtn) {
            // Re-bind file select button
            fileSelectBtn.addEventListener('click', () => this.openFileDialog());
            
            // Re-bind drop zone click
            dropZone.addEventListener('click', (e) => {
                if (!e.target.closest('#file-select-btn')) {
                    this.openFileDialog();
                }
            });
        }
    }

    async processZipFile(file, forPreview = false) {
        try {
            if (!forPreview) {
                this.showLoading(true, 'Notion zip 파일을 처리하는 중...');
            }
            
            if (!window.JSZip) {
                throw new Error('JSZip 라이브러리가 로드되지 않았습니다.');
            }

            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            let markdownContent = '';
            const imageMap = new Map();
            
            console.log('ZIP 파일 내용 분석 중...');
            
            // Extract markdown files and images
            for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
                if (!zipEntry.dir) {
                    const fileName = relativePath.split('/').pop();
                    console.log('처리 중인 파일:', relativePath, '파일명:', fileName);
                    
                    if (fileName.endsWith('.md')) {
                        // Extract markdown content
                        const content = await zipEntry.async('text');
                        console.log('마크다운 파일 발견:', fileName);
                        console.log('마크다운 내용 미리보기:', content.substring(0, 200));
                        markdownContent += content + '\n\n---\n\n';
                    } else if (this.isImageFile(fileName)) {
                        // Extract image as base64
                        console.log('이미지 파일 발견:', fileName, '경로:', relativePath);
                        const imageData = await zipEntry.async('base64');
                        const mimeType = this.getMimeType(fileName);
                        const base64Url = `data:${mimeType};base64,${imageData}`;
                        
                        // Store multiple variations of the image path for matching
                        imageMap.set(fileName, base64Url);
                        imageMap.set(relativePath, base64Url);
                        
                        // Also store URL-encoded versions (Notion sometimes uses these)
                        const encodedFileName = encodeURIComponent(fileName);
                        const encodedRelativePath = encodeURIComponent(relativePath);
                        imageMap.set(encodedFileName, base64Url);
                        imageMap.set(encodedRelativePath, base64Url);
                        
                        // Store without spaces (sometimes Notion replaces spaces)
                        const fileNameNoSpaces = fileName.replace(/\s+/g, '%20');
                        const relativePathNoSpaces = relativePath.replace(/\s+/g, '%20');
                        imageMap.set(fileNameNoSpaces, base64Url);
                        imageMap.set(relativePathNoSpaces, base64Url);
                        
                        // Store decoded versions (in case the zip path is encoded)
                        try {
                            const decodedFileName = decodeURIComponent(fileName);
                            const decodedRelativePath = decodeURIComponent(relativePath);
                            imageMap.set(decodedFileName, base64Url);
                            imageMap.set(decodedRelativePath, base64Url);
                        } catch (e) {
                            // Ignore decode errors
                        }
                        
                        // Store normalized versions (lowercase, no special chars)
                        const normalizedFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '');
                        const normalizedRelativePath = relativePath.toLowerCase().replace(/[^a-z0-9.-/]/g, '');
                        if (normalizedFileName) imageMap.set(normalizedFileName, base64Url);
                        if (normalizedRelativePath) imageMap.set(normalizedRelativePath, base64Url);
                        
                        console.log('이미지 맵에 추가됨:', {
                            fileName,
                            relativePath,
                            encodedFileName,
                            fileNameNoSpaces
                        });
                    }
                }
            }

            if (!markdownContent.trim()) {
                throw new Error('zip 파일에서 마크다운 파일을 찾을 수 없습니다.');
            }

            console.log('이미지 맵 총 개수:', imageMap.size);
            console.log('이미지 맵 키들:', Array.from(imageMap.keys()));

            // Process image references in markdown
            markdownContent = this.processZipImageReferences(markdownContent, imageMap);

            return markdownContent;

        } catch (error) {
            console.error('ZIP 파일 처리 실패:', error);
            throw new Error(`ZIP 파일을 처리할 수 없습니다: ${error.message}`);
        } finally {
            if (!forPreview) {
                this.showLoading(false);
            }
        }
    }

    isImageFile(fileName) {
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return imageExtensions.includes(extension);
    }

    getMimeType(fileName) {
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp'
        };
        return mimeTypes[extension] || 'image/png';
    }

    processZipImageReferences(markdownContent, imageMap) {
        console.log('이미지 참조 처리 시작');
        console.log('원본 마크다운 내용:', markdownContent.substring(0, 500));
        
        let processedContent = markdownContent;
        
        // Find all image references in the markdown
        const imageRefPatterns = [
            // ![alt](path) format
            /!\[([^\]]*)\]\(([^)]+)\)/g,
            // <img src="path"> format
            /<img[^>]*src=["']([^"']+)["'][^>]*>/g
        ];
        
        imageRefPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(markdownContent)) !== null) {
                const fullMatch = match[0];
                let imagePath = match[2] || match[1]; // Get the path from either format
                
                console.log('이미지 참조 발견:', fullMatch);
                console.log('추출된 이미지 경로:', imagePath);
                
                // Try to find matching image in our imageMap
                let base64Url = this.findImageInMap(imagePath, imageMap);
                
                if (base64Url) {
                    console.log('매칭된 이미지 발견, 교체 중:', imagePath);
                    
                    // Replace the image reference with base64 URL
                    if (fullMatch.startsWith('![')) {
                        // Markdown format
                        const altText = match[1] || '';
                        const replacement = `![${altText}](${base64Url})`;
                        processedContent = processedContent.replace(fullMatch, replacement);
                        console.log('마크다운 형식으로 교체:', replacement);
                    } else {
                        // HTML img tag format
                        const replacement = fullMatch.replace(/src=["'][^"']+["']/, `src="${base64Url}"`);
                        processedContent = processedContent.replace(fullMatch, replacement);
                        console.log('HTML 형식으로 교체:', replacement);
                    }
                } else {
                    console.log('매칭되는 이미지를 찾을 수 없음:', imagePath);
                    console.log('사용 가능한 이미지 경로들:', Array.from(imageMap.keys()));
                }
            }
            pattern.lastIndex = 0; // Reset regex
        });
        
        console.log('처리된 마크다운 내용:', processedContent.substring(0, 500));
        return processedContent;
    }

    findImageInMap(imagePath, imageMap) {
        // Clean the image path
        const cleanPath = imagePath.trim();
        
        console.log('이미지 경로 매칭 시도:', cleanPath);
        
        // Direct match
        if (imageMap.has(cleanPath)) {
            console.log('직접 매칭 성공:', cleanPath);
            return imageMap.get(cleanPath);
        }
        
        // Try removing leading ./ 
        const withoutDotSlash = cleanPath.replace(/^\.\//, '');
        if (imageMap.has(withoutDotSlash)) {
            console.log('상대경로 제거 후 매칭 성공:', withoutDotSlash);
            return imageMap.get(withoutDotSlash);
        }
        
        // Try just the filename
        const fileName = cleanPath.split('/').pop();
        if (imageMap.has(fileName)) {
            console.log('파일명만으로 매칭 성공:', fileName);
            return imageMap.get(fileName);
        }
        
        // Try URL encoded versions
        const encodedPath = encodeURIComponent(cleanPath);
        if (imageMap.has(encodedPath)) {
            console.log('인코딩된 경로로 매칭 성공:', encodedPath);
            return imageMap.get(encodedPath);
        }
        
        const encodedFileName = encodeURIComponent(fileName);
        if (imageMap.has(encodedFileName)) {
            console.log('인코딩된 파일명으로 매칭 성공:', encodedFileName);
            return imageMap.get(encodedFileName);
        }
        
        // Try with spaces converted to %20
        const pathWithSpaces = cleanPath.replace(/\s+/g, '%20');
        if (imageMap.has(pathWithSpaces)) {
            console.log('공백 변환 후 매칭 성공:', pathWithSpaces);
            return imageMap.get(pathWithSpaces);
        }
        
        // Try decoding the path
        try {
            const decodedPath = decodeURIComponent(cleanPath);
            if (imageMap.has(decodedPath)) {
                console.log('디코딩된 경로로 매칭 성공:', decodedPath);
                return imageMap.get(decodedPath);
            }
            
            const decodedFileName = decodeURIComponent(fileName);
            if (imageMap.has(decodedFileName)) {
                console.log('디코딩된 파일명으로 매칭 성공:', decodedFileName);
                return imageMap.get(decodedFileName);
            }
        } catch (e) {
            // Ignore decode errors
        }
        
        // Try normalized matching (case insensitive, no special chars)
        const normalizedPath = cleanPath.toLowerCase().replace(/[^a-z0-9.-]/g, '');
        const normalizedFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '');
        
        if (normalizedPath && imageMap.has(normalizedPath)) {
            console.log('정규화된 경로로 매칭 성공:', normalizedPath);
            return imageMap.get(normalizedPath);
        }
        
        if (normalizedFileName && imageMap.has(normalizedFileName)) {
            console.log('정규화된 파일명으로 매칭 성공:', normalizedFileName);
            return imageMap.get(normalizedFileName);
        }
        
        // Try partial matching (case insensitive)
        for (const [mapKey, mapValue] of imageMap) {
            if (mapKey.toLowerCase().includes(fileName.toLowerCase()) || 
                fileName.toLowerCase().includes(mapKey.toLowerCase())) {
                console.log('부분 매칭 성공:', mapKey, '<->', fileName);
                return mapValue;
            }
        }
        
        // Last resort: try fuzzy matching by comparing file extensions and similar names
        const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        for (const [mapKey, mapValue] of imageMap) {
            const mapKeyExt = mapKey.toLowerCase().substring(mapKey.lastIndexOf('.'));
            const mapKeyName = mapKey.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fileNameNormalized = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (fileExt === mapKeyExt && mapKeyName.includes(fileNameNormalized.substring(0, 5))) {
                console.log('퍼지 매칭 성공:', mapKey, '<->', fileName);
                return mapValue;
            }
        }
        
        console.log('매칭 실패 - 모든 시도 완료');
        return null;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    exportToPDF() {
        if (this.slides.length === 0) {
            alert('먼저 슬라이드를 로드해주세요.');
            return;
        }

        // 현재 슬라이드 인덱스 저장
        const currentSlideIndex = this.currentSlide;
        
        // PDF 생성을 위한 임시 컨테이너 생성
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.top = '0';
        pdfContainer.style.width = '100vw';
        pdfContainer.style.background = 'white';
        pdfContainer.style.color = 'black'; // 텍스트 색상 검정으로 강제 설정
        
        // 현재 폰트 설정 가져오기
        const slideContent = document.getElementById('slide-content');
        
        // 로고 정보 가져오기
        const logoContainer = document.getElementById('presentation-logo');
        const logoImage = document.getElementById('logo-image');
        const hasLogo = logoContainer && !logoContainer.classList.contains('hidden') && logoImage.src;
        
        // 모든 슬라이드를 PDF용 포맷으로 생성 (첫 번째 슬라이드 제외)
        this.slides.slice(1).forEach((slide, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'pdf-slide';
            
            // 실제로는 두 번째 슬라이드부터이지만 첫 번째로 처리
            if (index === 0) {
                slideDiv.classList.add('pdf-slide-first');
            }
            
            // Font settings will be applied after HTML insertion
            
            // 마크다운 원본에서 직접 HTML 생성 (로고 없는 순수 콘텐츠)
            let cleanHTML;
            if (slide.content) {
                const markedOptions = {
                    breaks: true,
                    gfm: true
                };
                cleanHTML = marked.parse(slide.content, markedOptions);
                cleanHTML = this.processCustomSyntax(cleanHTML);
            } else {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = slide.html;
                
                // 로고 제거
                const logoSelectors = [
                    '#presentation-logo',
                    '.presentation-logo', 
                    '#logo-image',
                    '[alt*="logo"]', 
                    '[alt*="Logo"]',
                    '[alt*="LOGO"]',
                    '[src*="logo"]',
                    '[class*="logo"]',
                    'img[src*="logo."]'
                ];
                
                logoSelectors.forEach(selector => {
                    const elements = tempDiv.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });
                
                cleanHTML = tempDiv.innerHTML;
            }
            
            slideDiv.innerHTML = cleanHTML;
            
            // PDF용 코드 하이라이팅 적용
            if (window.Prism) {
                const codeBlocks = slideDiv.querySelectorAll('pre code, code[class*="language-"]');
                codeBlocks.forEach(block => {
                    Prism.highlightElement(block);
                });
            }
            
            // PDF용 LaTeX 수식 렌더링
            this.renderMathForPDF(slideDiv);
            
            // HTML 삽입 후 폰트 설정 적용
            this.applyFontsToElement(slideDiv);
            
            // 각 슬라이드에 동일한 크기의 로고 추가
            if (hasLogo) {
                const logoClone = document.createElement('div');
                logoClone.className = 'pdf-logo';
                logoClone.innerHTML = `<img src="${logoImage.src}" alt="Presentation Logo" class="pdf-logo-image">`;
                slideDiv.appendChild(logoClone);
            }
            
            pdfContainer.appendChild(slideDiv);
        });
        
        // 임시로 body에 추가
        document.body.appendChild(pdfContainer);
        
        // 기존 슬라이드 컨테이너 숨기기
        const slideContainer = document.getElementById('slide-container');
        const originalDisplay = slideContainer.style.display;
        slideContainer.style.display = 'none';
        
        // PDF 컨테이너를 메인 위치로 이동
        pdfContainer.style.position = 'static';
        pdfContainer.style.left = 'auto';
        
        // PDF 전체에서 폰트 재적용 (최종 보장)
        const pdfSlides = pdfContainer.querySelectorAll('.pdf-slide');
        pdfSlides.forEach(slide => {
            this.applyFontsToElement(slide);
        });
        
        // 다크모드 상태 저장 및 임시로 비활성화
        const isDarkMode = document.documentElement.classList.contains('dark');
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
        }
        
        // 짧은 지연 후 인쇄 다이얼로그 열기
        setTimeout(() => {
            const originalTitle = document.title;
            document.title = `${originalTitle} - 슬라이드 PDF`;
            
            // 인쇄 실행
            window.print();
            
            // 인쇄 완료 후 정리
            const cleanup = () => {
                document.title = originalTitle;
                slideContainer.style.display = originalDisplay;
                document.body.removeChild(pdfContainer);
                
                // 다크모드 복원
                if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                }
                
                // 원래 슬라이드로 복원
                this.currentSlide = currentSlideIndex;
                this.renderSlide();
                this.updateNavigation();
            };
            
            // 인쇄 다이얼로그가 닫힌 후 정리
            const checkPrintDialog = () => {
                if (window.matchMedia('print').matches) {
                    // 아직 인쇄 중
                    setTimeout(checkPrintDialog, 100);
                } else {
                    // 인쇄 완료
                    cleanup();
                }
            };
            
            // 약간의 지연 후 확인 시작
            setTimeout(checkPrintDialog, 500);
            
        }, 300);
    }

    exportToMarkdown() {
        if (this.slides.length === 0) {
            alert('먼저 슬라이드를 로드해주세요.');
            return;
        }

        let markdownContent = '';
        
        // Check if we have the original markdown content stored
        if (this.originalMarkdownContent) {
            markdownContent = this.originalMarkdownContent;
        } else {
            // Reconstruct markdown from slides if original content is not available
            this.slides.forEach((slide, index) => {
                if (index > 0) {
                    markdownContent += '\n\n---\n\n';
                }
                
                // Get the slide content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = slide.html || slide;
                
                // Convert HTML back to markdown (basic conversion)
                let slideMarkdown = tempDiv.innerText || tempDiv.textContent || '';
                
                // Preserve some formatting
                slideMarkdown = slideMarkdown.replace(/\n{3,}/g, '\n\n');
                
                markdownContent += slideMarkdown;
            });
        }

        // Create a Blob with the markdown content
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Use current file name if available
        const baseName = this.currentFileName ? this.currentFileName.replace(/\.[^/.]+$/, '') : 'presentation';
        link.download = `${baseName}_${timestamp}.md`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }

    // Preview functionality methods
    updatePreview() {
        const textarea = document.getElementById('markdown-textarea');
        const markdown = textarea.value.trim();
        
        if (!markdown) {
            this.clearPreview();
            return;
        }
        
        try {
            // Parse markdown to slides with position tracking
            this.previewSlides = this.parseLocalMarkdownToSlides(markdown, true);
            this.currentPreviewSlide = 0;
            
            // Update preview content
            this.renderSlideThumbnails();
        } catch (error) {
            console.error('Preview parsing error:', error);
            this.showPreviewError('마크다운 파싱 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    clearPreview() {
        const slideThumbnails = document.getElementById('slide-thumbnails');
        
        // Remove overflow-y-auto class when clearing
        slideThumbnails.classList.remove('overflow-y-auto');
        
        slideThumbnails.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
                <div>
                    <svg class="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-sm">마크다운을 입력하면<br>여기에 슬라이드가 표시됩니다</p>
                </div>
            </div>
        `;
        
        this.previewSlides = [];
        this.currentPreviewSlide = 0;
        this.updateSlideCounter();
    }
    
    showPreviewError(message) {
        const slideThumbnails = document.getElementById('slide-thumbnails');
        
        // Remove overflow-y-auto class for error state
        slideThumbnails.classList.remove('overflow-y-auto');
        
        slideThumbnails.innerHTML = `
            <div class="text-center text-red-500 dark:text-red-400 flex items-center justify-center h-full">
                <div>
                    <svg class="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.232 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        `;
    }
    
    showPreviewLoading(message) {
        const slideThumbnails = document.getElementById('slide-thumbnails');
        
        // Remove overflow-y-auto class for loading state
        slideThumbnails.classList.remove('overflow-y-auto');
        
        slideThumbnails.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
                <div>
                    <svg class="animate-spin h-12 w-12 mb-3 mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        `;
    }
    
    renderSlideThumbnails() {
        if (this.previewSlides.length === 0) {
            this.clearPreview();
            return;
        }
        
        const slideThumbnails = document.getElementById('slide-thumbnails');
        slideThumbnails.innerHTML = '';
        
        // Add overflow-y-auto class when there are slides
        slideThumbnails.classList.add('overflow-y-auto');
        
        this.previewSlides.forEach((slide, index) => {
            const slideHtml = slide.html || slide;
            
            const thumbnailElement = document.createElement('div');
            thumbnailElement.className = `slide-thumbnail ${index === this.currentPreviewSlide ? 'active' : ''}`;
            
            // Create the inner container with actual HTML content
            const innerDiv = document.createElement('div');
            innerDiv.className = 'slide-thumbnail-inner';
            
            // Create content container
            const contentDiv = document.createElement('div');
            contentDiv.className = 'slide-thumbnail-content';
            
            // Process custom syntax for the thumbnail
            let processedHtml = slideHtml;
            if (typeof this.processCustomSyntax === 'function') {
                processedHtml = this.processCustomSyntax(processedHtml);
            }
            contentDiv.innerHTML = processedHtml;
            
            // Apply font settings to thumbnail content
            this.applyFontsToThumbnail(contentDiv);
            
            // Add slide number
            const numberDiv = document.createElement('div');
            numberDiv.className = 'slide-thumbnail-number';
            numberDiv.textContent = index + 1;
            
            innerDiv.appendChild(contentDiv);
            thumbnailElement.appendChild(numberDiv);
            thumbnailElement.appendChild(innerDiv);
            
            // Add click event to select slide
            thumbnailElement.addEventListener('click', () => {
                this.selectSlide(index);
            });
            
            slideThumbnails.appendChild(thumbnailElement);
        });
        
        this.updateSlideCounter();
    }
    
    applyFontsToThumbnail(element) {
        // Apply body font to the element
        element.style.fontFamily = `'${this.settings.bodyFont}', sans-serif`;
        
        // Apply heading fonts
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.fontFamily = `'${this.settings.headingFont}', sans-serif`;
        });
        
        // Apply code font to code blocks (pre elements)
        const preElements = element.querySelectorAll('pre');
        preElements.forEach(pre => {
            pre.style.fontFamily = `'${this.settings.codeFont}', monospace`;
            // Also apply to code elements inside pre
            const innerCode = pre.querySelectorAll('code');
            innerCode.forEach(code => {
                code.style.fontFamily = `'${this.settings.codeFont}', monospace`;
            });
        });
        
        // Apply body font to inline code (code elements NOT inside pre)
        const allCodeElements = element.querySelectorAll('code');
        allCodeElements.forEach(code => {
            // Check if this code element is NOT inside a pre element
            if (!code.closest('pre')) {
                code.style.fontFamily = `'${this.settings.bodyFont}', sans-serif`;
            }
        });
        
        // Skip KaTeX processing for thumbnails to avoid complexity
        
        // Syntax highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(element);
        }
    }
    
    selectSlide(index) {
        if (index >= 0 && index < this.previewSlides.length) {
            this.currentPreviewSlide = index;
            
            // Update active state
            const thumbnails = document.querySelectorAll('.slide-thumbnail');
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            this.updateSlideCounter();
            
            // Navigate to the corresponding position in the markdown textarea
            this.navigateToSlideInMarkdown(index);
        }
    }
    
    navigateToSlideInMarkdown(slideIndex) {
        const textarea = document.getElementById('markdown-textarea');
        
        // Check if we have position information for this slide
        if (this.previewSlides[slideIndex] && this.previewSlides[slideIndex].startPosition !== undefined) {
            const slide = this.previewSlides[slideIndex];
            const targetPosition = slide.startPosition;
            
            // Set cursor position to the start of the slide content
            textarea.focus();
            textarea.setSelectionRange(targetPosition, targetPosition);
            
            // Scroll the textarea to make the cursor visible
            const markdown = textarea.value;
            const textBeforeCursor = markdown.substring(0, targetPosition);
            const linesBeforeCursor = textBeforeCursor.split('\n').length;
            const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
            const scrollPosition = Math.max(0, (linesBeforeCursor - 5) * lineHeight); // -5 to show some context
            
            textarea.scrollTop = scrollPosition;
        }
    }
    
    updateSlideCounter() {
        const counter = document.getElementById('preview-slide-counter');
        const totalSlides = this.previewSlides.length;
        
        if (totalSlides === 0) {
            counter.textContent = '슬라이드 0개';
        } else {
            counter.textContent = `슬라이드 ${totalSlides}개`;
        }
    }
    
    saveMarkdown() {
        const textarea = document.getElementById('markdown-textarea');
        const markdown = textarea.value.trim();
        
        if (!markdown) {
            alert('저장할 마크다운 내용이 없습니다.');
            return;
        }
        
        // Create a blob with the markdown content
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        link.download = `presentation_${timestamp}.md`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('마크다운 파일이 저장되었습니다.');
    }

    // WYSIWYG functionality methods
    insertMarkdown(before, after, placeholder) {
        const textarea = document.getElementById('markdown-textarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let newText;
        if (selectedText) {
            newText = before + selectedText + after;
        } else {
            newText = before + placeholder + after;
        }
        
        // document.execCommand를 사용하여 브라우저의 실행 취소 스택에 기록
        textarea.focus();
        document.execCommand('insertText', false, newText);
        
        // Update preview
        this.updatePreview();
    }
    
    insertNewSlide() {
        const textarea = document.getElementById('markdown-textarea');
        const currentValue = textarea.value;
        const cursorPosition = textarea.selectionStart;
        
        // Ensure we have proper spacing before the new slide
        let slideTemplate = '';
        
        // Check if we need to add newlines before the slide separator
        if (currentValue.length > 0) {
            // Check how many newlines are before the cursor position
            let newlinesBefore = 0;
            let checkPos = cursorPosition - 1;
            while (checkPos >= 0 && currentValue[checkPos] === '\n') {
                newlinesBefore++;
                checkPos--;
            }
            
            // Add newlines if needed to ensure proper spacing
            if (newlinesBefore < 2) {
                slideTemplate = '\n'.repeat(2 - newlinesBefore);
            }
        }
        
        // Add the slide content
        slideTemplate += '---\n\n## 새 슬라이드\n\n내용을 입력하세요\n\n';
        
        // document.execCommand를 사용하여 브라우저의 실행 취소 스택에 기록
        textarea.focus();
        document.execCommand('insertText', false, slideTemplate);
        
        // Move cursor to the end of the inserted content
        const newCursorPosition = cursorPosition + slideTemplate.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // Update preview
        this.updatePreview();
    }
    
    insertLink() {
        const url = prompt('링크 URL을 입력하세요:');
        if (url) {
            this.insertMarkdown('[', '](' + url + ')', '링크 텍스트');
        }
    }
    
    insertImage() {
        const url = prompt('이미지 URL을 입력하세요:');
        if (url) {
            this.insertMarkdown('![', '](' + url + ')', '이미지 설명');
        }
    }
    
    insertCodeBlock() {
        const textarea = document.getElementById('markdown-textarea');
        const cursorPosition = textarea.selectionStart;
        const currentValue = textarea.value;
        
        // Check if we're at the start of a line
        let needNewlineBefore = cursorPosition > 0 && currentValue[cursorPosition - 1] !== '\n';
        
        const codeTemplate = (needNewlineBefore ? '\n' : '') + '```\n코드를 입력하세요\n```\n';
        
        // document.execCommand를 사용하여 브라우저의 실행 취소 스택에 기록
        textarea.focus();
        document.execCommand('insertText', false, codeTemplate);
        
        // Position cursor inside the code block after insertion
        const insertedLength = codeTemplate.length;
        const codeStartPos = cursorPosition + (needNewlineBefore ? 1 : 0) + 4; // After ```\n
        const codeEndPos = codeStartPos + '코드를 입력하세요'.length;
        textarea.setSelectionRange(codeStartPos, codeEndPos);
        
        // Update preview
        this.updatePreview();
    }
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.insertMarkdown('**', '**', '굵은 텍스트');
                    break;
                case 'i':
                    e.preventDefault();
                    this.insertMarkdown('*', '*', '기울임 텍스트');
                    break;
                case 's':
                    e.preventDefault();
                    this.saveMarkdown();
                    break;
                case 'u':
                    e.preventDefault();
                    this.insertMarkdown('<u>', '</u>', '밑줄 텍스트');
                    break;
                case 'z':
                    // Ctrl+Z 실행 취소 기능 - 기본 브라우저 동작을 사용
                    // preventDefault()를 호출하지 않아 브라우저의 기본 실행 취소 기능이 작동하도록 함
                    break;
            }
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.presenter = new GitHubMarkdownPresenter();
});

// Handle click outside settings modal and file navigation
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const fileNavSidebar = document.getElementById('file-nav-sidebar');
    const fileNavToggle = document.getElementById('file-nav-toggle');
    const fileListPopup = document.getElementById('file-list-popup');
    
    if (!modal.classList.contains('hidden') && 
        !modal.contains(e.target) && 
        !settingsBtn.contains(e.target)) {
        modal.classList.add('hidden');
    }
    
    // Close settings dropdown when clicking outside
    if (!settingsDropdown.classList.contains('hidden') && 
        !settingsDropdown.contains(e.target) && 
        !settingsBtn.contains(e.target)) {
        settingsDropdown.classList.add('hidden');
    }
    
    if (!fileNavSidebar.classList.contains('hidden') && 
        !fileNavSidebar.contains(e.target) && 
        !fileNavToggle.contains(e.target)) {
        fileNavSidebar.classList.add('hidden');
    }
    
    // Close file list popup when clicking outside
    if (!fileListPopup.classList.contains('hidden') && 
        !fileListPopup.contains(e.target) && 
        !fileNavToggle.contains(e.target)) {
        fileListPopup.classList.add('hidden');
    }
});

// Prevent default behavior for certain keys (except arrows for scrolling in presentation mode)
document.addEventListener('keydown', (e) => {
    if (['Space'].includes(e.code)) {
        if (e.target === document.body || e.target.tagName === 'BUTTON') {
            e.preventDefault();
        }
    }
});

// Help modal methods (add to GitHubMarkdownPresenter class)
GitHubMarkdownPresenter.prototype.openHelpModal = function() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.remove('hidden');
    
    // Setup accordion functionality
    this.setupHelpAccordion();
    
    // Focus management for accessibility
    const closeButton = document.getElementById('close-help-modal');
    setTimeout(() => closeButton.focus(), 100);
};

GitHubMarkdownPresenter.prototype.closeHelpModal = function() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.add('hidden');
    
    // Return focus to settings button
    document.getElementById('settings-btn').focus();
};

GitHubMarkdownPresenter.prototype.setupHelpAccordion = function() {
    const accordionButtons = document.querySelectorAll('.help-accordion-btn');
    
    accordionButtons.forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.replaceWith(button.cloneNode(true));
    });
    
    // Re-attach event listeners
    document.querySelectorAll('.help-accordion-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = button.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const icon = button.querySelector('.help-accordion-icon');
            
            // Toggle current section
            const isOpen = !content.classList.contains('hidden');
            
            if (isOpen) {
                content.classList.add('hidden');
                content.classList.remove('open');
                icon.classList.remove('rotated');
            } else {
                content.classList.remove('hidden');
                content.classList.add('open');
                icon.classList.add('rotated');
            }
        });
    });
};

// ESC key handler for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const helpModal = document.getElementById('help-modal');
        const settingsDropdown = document.getElementById('settings-dropdown');
        
        // Close help modal if open
        if (!helpModal.classList.contains('hidden')) {
            const presenter = window.presenter || new GitHubMarkdownPresenter();
            presenter.closeHelpModal();
            return;
        }
        
        // Close settings dropdown if open
        if (!settingsDropdown.classList.contains('hidden')) {
            const presenter = window.presenter || new GitHubMarkdownPresenter();
            presenter.closeSettingsDropdown();
            return;
        }
    }
});