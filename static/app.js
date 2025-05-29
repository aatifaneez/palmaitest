class PalmDiseaseDetector {
    constructor() {
        this.selectedFile = null;
        this.currentAnalysis = null;
        this.initializeTheme();
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadPrompt = document.getElementById('upload-prompt');
        this.uploadPreview = document.getElementById('upload-preview');
        this.previewImage = document.getElementById('preview-image');
        this.fileName = document.getElementById('file-name');
        this.browseBtn = document.getElementById('browse-btn');
        this.changeImageBtn = document.getElementById('change-image');

        this.analyzeBtn = document.getElementById('analyze-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.helpBtn = document.getElementById('help-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.newAnalysisBtn = document.getElementById('new-analysis');
        this.downloadReportBtn = document.getElementById('download-report');
        this.themeToggle = document.getElementById('theme-toggle');

        this.infoPanel = document.getElementById('info-panel');
        this.loadingPanel = document.getElementById('loading-panel');
        this.resultsSection = document.getElementById('results-section');
        this.errorSection = document.getElementById('error-section');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');

        this.resultImage = document.getElementById('result-image');
        this.diseaseName = document.getElementById('disease-name');
        this.confidenceScore = document.getElementById('confidence-score');
        this.diseaseDescription = document.getElementById('disease-description');
        this.symptomsList = document.getElementById('symptoms-list');
        this.treatmentRecommendations = document.getElementById('treatment-recommendations');
        this.alternativeDiseases = document.getElementById('alternative-diseases');
        this.primaryResult = document.getElementById('primary-result');
        this.errorMessage = document.getElementById('error-message');
    }

    attachEventListeners() {
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.changeImageBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('click', () => {
            if (!this.selectedFile) this.fileInput.click();
        });

        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        this.clearBtn.addEventListener('click', () => this.clearSelection());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        this.retryBtn.addEventListener('click', () => this.hideError());
        this.newAnalysisBtn.addEventListener('click', () => this.resetForNewAnalysis());
        this.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Unsupported format. Please upload a JPG or PNG image.');
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File too large. Maximum allowed size is 10MB.');
            return;
        }

        this.selectedFile = file;
        this.displayPreview(file);
        this.analyzeBtn.disabled = false;
        this.clearBtn.classList.remove('hidden');
    }

    displayPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.fileName.textContent = file.name;
            this.uploadPrompt.classList.add('hidden');
            this.uploadPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    clearSelection() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.uploadPrompt.classList.remove('hidden');
        this.uploadPreview.classList.add('hidden');
        this.analyzeBtn.disabled = true;
        this.clearBtn.classList.add('hidden');
        this.hideResults();
        this.hideError();
        this.showInfoPanel();
    }

    async analyzeImage() {
        if (!this.selectedFile) return;

        this.showLoadingPanel();
        this.hideResults();
        this.hideError();

        try {
            const formData = new FormData();
            formData.append('image', this.selectedFile);

            this.updateProgress(0, 'Uploading...');
            await this.delay(500);

            this.updateProgress(30, 'Preparing analysis...');
            await this.delay(500);

            this.updateProgress(60, 'Detecting disease...');
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            this.updateProgress(90, 'Finalizing...');
            await this.delay(300);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed.');
            }

            const result = await response.json();
            this.updateProgress(100, 'Done!');
            await this.delay(500);

            this.currentAnalysis = result;
            this.displayResults(result);

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Something went wrong. Please try again.');
        } finally {
            this.hideLoadingPanel();
        }
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    displayResults(result) {
        const diseaseInfo = result.disease_info;

        this.resultImage.src = this.previewImage.src;
        this.diseaseName.textContent = diseaseInfo.name;

        const confidence = Math.round(result.confidence * 100);
        this.confidenceScore.textContent = `${confidence}% Confidence`;
        this.confidenceScore.className = this.getConfidenceClass(confidence);

        this.diseaseDescription.textContent = diseaseInfo.description;
        this.primaryResult.className = `mb-6 p-4 rounded-lg ${this.getSeverityClass(diseaseInfo.severity)}`;

        this.populateList(this.symptomsList, diseaseInfo.symptoms);
        this.populateList(this.treatmentRecommendations, diseaseInfo.treatment);
        this.populateAlternatives(result.alternatives);

        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('fade-in');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    populateList(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex items-start';
            li.innerHTML = `
                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                <span class="text-gray-700 dark:text-gray-300">${item}</span>
            `;
            container.appendChild(li);
        });
    }

    populateAlternatives(alternatives) {
        this.alternativeDiseases.innerHTML = '';
        alternatives.slice(1, 4).forEach(alt => {
            const confidence = Math.round(alt.confidence * 100);
            const div = document.createElement('div');
            div.className = 'alternative-disease-card';
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-900 dark:text-gray-100">${this.formatDiseaseName(alt.disease)}</span>
                    <span class="text-xs px-2 py-1 rounded-full ${this.getConfidenceClass(confidence)}">${confidence}%</span>
                </div>
            `;
            this.alternativeDiseases.appendChild(div);
        });
    }

    formatDiseaseName(disease) {
        return disease.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getConfidenceClass(confidence) {
        if (confidence >= 80) return 'confidence-high bg-green-600 text-white text-sm px-3 py-1 rounded-full';
        if (confidence >= 60) return 'confidence-medium bg-yellow-500 text-black text-sm px-3 py-1 rounded-full';
        return 'confidence-low bg-red-600 text-white text-sm px-3 py-1 rounded-full';
    }

    getSeverityClass(severity) {
        switch (severity.toLowerCase()) {
            case 'none': return 'severity-none bg-green-50 border border-green-200';
            case 'moderate': return 'severity-moderate bg-yellow-50 border border-yellow-200';
            case 'severe': return 'severity-severe bg-red-50 border border-red-200';
            default: return 'severity-unknown bg-gray-50 border border-gray-200';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
        this.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorSection.classList.add('hidden');
        this.errorMessage.textContent = '';
    }

    showLoadingPanel() {
        this.loadingPanel.classList.remove('hidden');
        this.infoPanel.classList.add('hidden');
    }

    hideLoadingPanel() {
        this.loadingPanel.classList.add('hidden');
    }

    hideResults() {
        this.resultsSection.classList.add('hidden');
    }

    showInfoPanel() {
        this.infoPanel.classList.remove('hidden');
    }

    resetForNewAnalysis() {
        this.clearSelection();
    }

    downloadReport() {
        const blob = new Blob([JSON.stringify(this.currentAnalysis, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'palm_disease_report.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showHelp() {
        alert("To detect palm diseases:\n\n1. Upload a clear photo of a palm leaf.\n2. Click 'Analyze'.\n3. Get instant results and treatment advice.");
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.currentTheme = newTheme;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
