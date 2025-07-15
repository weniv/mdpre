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
        this.repoHistory = [];
        this.fileSlideMap = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadRepoHistory();
        this.setupKeyboardNavigation();
        this.setupFullscreenHandling();
        this.getCurrentRepoInfo();
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

        // Logo button - go back to home
        document.getElementById('logo-btn').addEventListener('click', () => this.goToHome());

        // File upload change event
        document.getElementById('file-upload').addEventListener('change', () => this.handleFileUpload());

        // File select button event
        document.getElementById('file-select-btn').addEventListener('click', () => this.openFileDialog());

        // Drag and drop events
        this.setupDragAndDrop();

        // Repository form submission
        document.getElementById('repo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadPresentation();
        });

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
            label.innerHTML = `배포 repo에서 찾기 <span class="text-sm text-gray-500">(${this.currentRepo.owner}/${this.currentRepo.repo})</span>`;
        }
    }

    handleRepoSourceChange() {
        const selectedSource = document.querySelector('input[name="repo-source"]:checked').value;
        const customFields = document.getElementById('custom-repo-fields');
        const localFields = document.getElementById('local-file-fields');
        const directFields = document.getElementById('direct-input-fields');
        const repoUrlInput = document.getElementById('repo-url');
        const historySection = document.getElementById('repo-history');
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
        
        if (selectedSource === 'current') {
            customFields.style.display = 'none';
            localFields.classList.add('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.remove('hidden');
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
            if (this.repoHistory.length > 0) {
                historySection.classList.remove('hidden');
                this.renderRepoHistory();
            }
        } else if (selectedSource === 'custom') {
            customFields.style.display = 'block';
            localFields.classList.add('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.remove('hidden');
            repoUrlInput.disabled = false;
            repoUrlInput.required = true;
            historySection.classList.add('hidden');
        } else if (selectedSource === 'local') {
            customFields.style.display = 'none';
            localFields.classList.remove('hidden');
            directFields.classList.add('hidden');
            searchBtn.classList.add('hidden');
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
            historySection.classList.add('hidden');
        } else if (selectedSource === 'direct') {
            customFields.style.display = 'none';
            localFields.classList.add('hidden');
            directFields.classList.remove('hidden');
            searchBtn.classList.add('hidden');
            loadDirectBtn.classList.remove('hidden');
            repoUrlInput.disabled = true;
            repoUrlInput.required = false;
            historySection.classList.add('hidden');
        }
    }

    renderRepoHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.repoHistory.forEach((repo, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-info">
                    <div class="history-item-url">${repo.owner}/${repo.repo}</div>
                    <div class="history-item-folder">${repo.folder || '폴더 지정 없음'}</div>
                </div>
                <button class="history-item-delete" data-index="${index}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Add click handler for loading this repo
            historyItem.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete')) {
                    this.loadFromHistory(repo);
                }
            });
            
            // Add delete handler
            const deleteBtn = historyItem.querySelector('.history-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFromHistory(index);
            });
            
            historyList.appendChild(historyItem);
        });
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

    deleteFromHistory(index) {
        this.repoHistory.splice(index, 1);
        this.saveRepoHistory();
        this.renderRepoHistory();
        
        if (this.repoHistory.length === 0) {
            document.getElementById('repo-history').classList.add('hidden');
        }
    }

    addToHistory(owner, repo, folder) {
        // Remove if already exists
        this.repoHistory = this.repoHistory.filter(item => 
            !(item.owner === owner && item.repo === repo && item.folder === folder)
        );
        
        // Add to beginning
        this.repoHistory.unshift({ owner, repo, folder, timestamp: Date.now() });
        
        // Keep only last 5 items
        if (this.repoHistory.length > 5) {
            this.repoHistory = this.repoHistory.slice(0, 5);
        }
        
        this.saveRepoHistory();
    }

    saveRepoHistory() {
        localStorage.setItem('github-presenter-history', JSON.stringify(this.repoHistory));
    }

    loadRepoHistory() {
        const saved = localStorage.getItem('github-presenter-history');
        if (saved) {
            this.repoHistory = JSON.parse(saved);
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

            // Add to history
            this.addToHistory(owner, repo, folderName);

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
        
        for (const file of files) {
            try {
                const response = await fetch(file.download_url);
                if (response.ok) {
                    const content = await response.text();
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
        
        // Footer 숨기기
        const footer = document.querySelector('.footer-container');
        if (footer) {
            footer.style.display = 'none';
        }
        
        this.currentSlide = 0;
        this.renderSlide();
        this.updateNavigation();
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
            this.applySettings(); // Apply font settings after content update
            
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
            container.classList.add('fullscreen');
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
            document.getElementById('slide-container').classList.remove('fullscreen');
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
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                popup.classList.add('hidden');
            }, 3000);
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

        // Apply code font to code blocks and inline code with !important for PDF
        const codeElements = element.querySelectorAll('pre, code, .token');
        codeElements.forEach(el => {
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
        
        // Footer 다시 표시
        const footer = document.querySelector('.footer-container');
        if (footer) {
            footer.style.display = '';
        }
        
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
            
            // Update the display
            if (fileInput.files.length > 0) {
                this.displayUploadedFiles(fileInput.files);
            } else {
                this.hideUploadedFiles();
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
        
        // Footer 다시 표시
        const footer = document.querySelector('.footer-container');
        if (footer) {
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
        
        const fileArray = Array.from(files);
        // Sort files by name
        fileArray.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const file of fileArray) {
            if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                try {
                    const content = await this.readFileContent(file);
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

    parseLocalMarkdownToSlides(markdown) {
        // Split by slide separator (---)
        const slideContents = markdown.split(/^---\s*$/m).filter(content => content.trim());
        
        return slideContents.map((content, index) => {
            // For local files, keep relative paths as they are
            let processedContent = content.trim();
            
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

    async processZipFile(file) {
        try {
            this.showLoading(true, 'Notion zip 파일을 처리하는 중...');
            
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