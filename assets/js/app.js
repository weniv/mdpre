class GitHubMarkdownPresenter {
    constructor() {
        this.slides = [];
        this.currentSlide = 0;
        this.isFullscreen = false;
        this.settings = {
            fontFamily: 'bmjua'
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

        // Settings dropdown
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettingsDropdown();
        });
        
        document.getElementById('close-settings-dropdown').addEventListener('click', () => {
            this.closeSettingsDropdown();
        });

        // Settings form - new dropdown
        document.getElementById('font-family-dropdown').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        // Settings form - old modal (keep for compatibility)
        const oldFontFamily = document.getElementById('font-family');
        if (oldFontFamily) {
            oldFontFamily.addEventListener('change', (e) => {
                this.settings.fontFamily = e.target.value;
                this.applySettings();
                this.saveSettings();
            });
        }
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
            // Only handle keyboard shortcuts in presentation mode
            if (this.slides.length === 0) return;
            
            let handled = false;

            switch(e.key) {
                case 'ArrowLeft':
                    this.previousSlide();
                    handled = true;
                    break;
                case 'ArrowRight':
                case ' ':  // Space bar
                    this.nextSlide();
                    handled = true;
                    break;
                case 'ArrowUp':
                    // Smooth scroll up - handle fullscreen vs normal mode
                    if (this.isFullscreen) {
                        const container = document.getElementById('slide-container');
                        if (container) {
                            container.scrollBy({ top: -50, behavior: 'smooth' });
                        }
                    } else {
                        window.scrollBy({ top: -50, behavior: 'smooth' });
                    }
                    handled = true;
                    break;
                case 'ArrowDown':
                    // Smooth scroll down - handle fullscreen vs normal mode
                    if (this.isFullscreen) {
                        const container = document.getElementById('slide-container');
                        if (container) {
                            container.scrollBy({ top: 50, behavior: 'smooth' });
                        }
                    } else {
                        window.scrollBy({ top: 50, behavior: 'smooth' });
                    }
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

            if (handled) {
                e.preventDefault();
                this.showKeyboardIndicator();
            }
        });
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
        
        // Update form values
        document.getElementById('font-family').value = this.settings.fontFamily;
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    toggleSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        if (dropdown.classList.contains('hidden')) {
            // Update dropdown form values
            document.getElementById('font-family-dropdown').value = this.settings.fontFamily;
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

    applySettings() {
        const slideContent = document.getElementById('slide-content');
        
        // Remove existing font family classes
        slideContent.classList.remove('font-family-default', 'font-family-bmjua', 'font-family-bmhanna', 'font-family-bmdohyeon', 'font-family-bmyeonsung', 'font-family-bmeuljirot', 'font-family-maruburi');
        
        // Apply font family
        slideContent.classList.add(`font-family-${this.settings.fontFamily}`);
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
        } else {
            loadLocalBtn.classList.add('hidden');
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
            await this.loadLocalMarkdownFiles(files);
            
            if (this.slides.length === 0) {
                throw new Error('유효한 마크다운 슬라이드를 찾을 수 없습니다.');
            }
            
            // Try to load logo from local files
            await this.loadLocalLogo(files);
            
            this.showPresentation();
            
        } catch (error) {
            console.error('로컬 파일 로드 실패:', error);
            alert(`파일을 로드할 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
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

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
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
        
        // 현재 슬라이드 컨테이너에서 폰트 클래스 가져오기
        const slideContent = document.getElementById('slide-content');
        const currentFontClass = Array.from(slideContent.classList).find(cls => cls.startsWith('font-family-'));
        
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
            
            if (currentFontClass) {
                slideDiv.classList.add(currentFontClass);
            }
            
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
    new GitHubMarkdownPresenter();
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