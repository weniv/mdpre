class GitHubMarkdownPresenter {
    constructor() {
        this.slides = [];
        this.currentSlide = 0;
        this.isFullscreen = false;
        this.settings = {
            fontSize: 'medium',
            theme: 'default',
            fontFamily: 'bmjua'
        };
        this.repoHistory = [];
        
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

        // Fullscreen toggle
        document.getElementById('fullscreen-toggle').addEventListener('click', () => this.toggleFullscreen());

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());

        // Settings form
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applySettings();
            this.saveSettings();
        });

        document.getElementById('font-family').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.applySettings();
            this.saveSettings();
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
        const slideNav = document.getElementById('slide-nav');
        const fullscreenToggle = document.getElementById('fullscreen-toggle');
        
        if (this.isFullscreen) {
            container.classList.add('fullscreen');
            // Ensure navigation controls are visible and properly positioned
            if (slideNav) slideNav.style.display = 'block';
            if (fullscreenToggle) fullscreenToggle.style.display = 'block';
        } else {
            container.classList.remove('fullscreen');
            // Reset any inline styles that might interfere
            if (slideNav) slideNav.style.display = '';
            if (fullscreenToggle) fullscreenToggle.style.display = '';
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
            label.innerHTML = `현재 배포 리포지토리에서 찾기 <span class="text-sm text-gray-500">(${this.currentRepo.owner}/${this.currentRepo.repo})</span>`;
        }
    }

    handleRepoSourceChange() {
        const selectedSource = document.querySelector('input[name="repo-source"]:checked').value;
        const customFields = document.getElementById('custom-repo-fields');
        const localFields = document.getElementById('local-file-fields');
        const repoUrlInput = document.getElementById('repo-url');
        const historySection = document.getElementById('repo-history');
        const folderSelection = document.getElementById('folder-selection');
        const loadBtn = document.getElementById('load-presentation-btn');
        const searchBtn = document.getElementById('search-folders-btn');
        const loadLocalBtn = document.getElementById('load-local-files-btn');
        
        // Reset all selections
        folderSelection.classList.add('hidden');
        loadBtn.classList.add('hidden');
        loadLocalBtn.classList.add('hidden');
        document.getElementById('folder-dropdown').innerHTML = '<option value="">폴더를 선택하세요...</option>';
        
        if (selectedSource === 'current') {
            customFields.style.display = 'none';
            localFields.classList.add('hidden');
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
            searchBtn.classList.remove('hidden');
            repoUrlInput.disabled = false;
            repoUrlInput.required = true;
            historySection.classList.add('hidden');
        } else if (selectedSource === 'local') {
            customFields.style.display = 'none';
            localFields.classList.remove('hidden');
            searchBtn.classList.add('hidden');
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
            
            // Add root folder option
            folders.push({ name: '루트 폴더', path: '' });
            
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

            // Check if root has markdown files
            const rootMarkdown = contents.filter(item => 
                item.type === 'file' && item.name.endsWith('.md')
            );
            
            if (rootMarkdown.length === 0 && folders.length === 1) {
                // Remove root folder option if no markdown in root
                folders.shift();
            }

            return folders;
            
        } catch (error) {
            throw new Error(`리포지토리 폴더를 가져올 수 없습니다: ${error.message}`);
        }
    }

    populateFolderDropdown(folders) {
        const dropdown = document.getElementById('folder-dropdown');
        dropdown.innerHTML = '<option value="">폴더를 선택하세요...</option>';
        
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
                        const container = document.querySelector('.fullscreen #slide-content');
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
                        const container = document.querySelector('.fullscreen #slide-content');
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
        
        for (const file of files) {
            try {
                const response = await fetch(file.download_url);
                if (response.ok) {
                    const content = await response.text();
                    // Get the folder path from the file path
                    const folderPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
                    const slides = this.parseMarkdownToSlides(content, owner, repo, folderPath);
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
            '<div class="text-center">$1</div>'
        );
        
        // Process {large}text{/large} - large text
        htmlContent = htmlContent.replace(
            /\{large\}([\s\S]*?)\{\/large\}/g,
            '<div class="text-large">$1</div>'
        );
        
        // Process {xlarge}text{/xlarge} - extra large text
        htmlContent = htmlContent.replace(
            /\{xlarge\}([\s\S]*?)\{\/xlarge\}/g,
            '<div class="text-xlarge">$1</div>'
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
            slideContent.innerHTML = slide.html;
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
        const counter = document.getElementById('slide-counter');
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        counter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        
        prevBtn.disabled = this.currentSlide === 0;
        nextBtn.disabled = this.currentSlide === this.slides.length - 1;
        
        prevBtn.classList.toggle('opacity-50', this.currentSlide === 0);
        nextBtn.classList.toggle('opacity-50', this.currentSlide === this.slides.length - 1);
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
        const currentTheme = this.settings.theme;
        const themes = ['default', 'dark', 'academic'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.settings.theme = themes[nextIndex];
        this.applySettings();
        this.saveSettings();
    }

    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        
        // Update form values
        document.getElementById('font-size').value = this.settings.fontSize;
        document.getElementById('theme-select').value = this.settings.theme;
        document.getElementById('font-family').value = this.settings.fontFamily;
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    applySettings() {
        const body = document.body;
        const slideContent = document.getElementById('slide-content');
        
        // Remove existing theme classes
        body.classList.remove('theme-default', 'theme-dark', 'theme-academic');
        slideContent.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge');
        slideContent.classList.remove('font-family-default', 'font-family-bmjua', 'font-family-bmhanna', 'font-family-bmdohyeon', 'font-family-bmyeonsung', 'font-family-bmeuljirot');
        
        // Apply new theme
        body.classList.add(`theme-${this.settings.theme}`);
        
        // Apply font size
        slideContent.classList.add(`font-size-${this.settings.fontSize}`);
        
        // Apply font family
        slideContent.classList.add(`font-family-${this.settings.fontFamily}`);
        
        // Handle dark mode class for Tailwind
        if (this.settings.theme === 'dark') {
            body.classList.add('dark');
        } else {
            body.classList.remove('dark');
        }
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
            
            this.showPresentation();
            
        } catch (error) {
            console.error('로컬 파일 로드 실패:', error);
            alert(`파일을 로드할 수 없습니다: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async loadLocalMarkdownFiles(files) {
        this.slides = [];
        
        const fileArray = Array.from(files);
        // Sort files by name
        fileArray.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const file of fileArray) {
            if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                try {
                    const content = await this.readFileContent(file);
                    // For local files, we need to handle image paths differently
                    const slides = this.parseLocalMarkdownToSlides(content);
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
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GitHubMarkdownPresenter();
});

// Handle click outside settings modal
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    
    if (!modal.classList.contains('hidden') && 
        !modal.contains(e.target) && 
        !settingsBtn.contains(e.target)) {
        modal.classList.add('hidden');
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