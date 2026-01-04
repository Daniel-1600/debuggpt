/**
 * DebugGPT - AI Code Debugger
 * Frontend JavaScript
 */

// DOM Elements
const codeInput = document.getElementById('codeInput');
const questionInput = document.getElementById('questionInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsDiv = document.getElementById('results');

// API Configuration
const API_URL = '/api/analyze';

/**
 * Initialize the application
 */
function init() {
    analyzeBtn.addEventListener('click', handleAnalyze);
    
    // Allow Ctrl+Enter to submit
    codeInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleAnalyze();
        }
    });
    
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    });
}

/**
 * Handle the analyze button click
 */
async function handleAnalyze() {
    const code = codeInput.value.trim();
    const question = questionInput.value.trim();
    
    if (!code) {
        showError('Please paste some code to analyze.');
        codeInput.focus();
        return;
    }
    
    setLoadingState(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, question }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze code');
        }
        
        if (data.success && data.analysis) {
            showAnalysis(data.analysis);
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'An error occurred while analyzing your code. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Set the loading state of the button
 */
function setLoadingState(isLoading) {
    analyzeBtn.disabled = isLoading;
    
    if (isLoading) {
        analyzeBtn.classList.add('loading');
        analyzeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>Analyzing...</span>
        `;
    } else {
        analyzeBtn.classList.remove('loading');
        analyzeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Analyze Code</span>
        `;
    }
}

/**
 * Display the analysis results
 */
function showAnalysis(analysis) {
    const formattedHTML = formatMarkdown(analysis);
    resultsDiv.innerHTML = `<div class="analysis-content">${formattedHTML}</div>`;
    
    // Scroll to results on mobile
    if (window.innerWidth <= 1024) {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Display an error message
 */
function showError(message) {
    resultsDiv.innerHTML = `
        <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
                <strong>Error</strong>
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;
}

/**
 * Format markdown to HTML
 * Simple markdown parser for common patterns
 */
function formatMarkdown(text) {
    // Escape HTML first
    let html = escapeHtml(text);
    
    // Code blocks (```code```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Unordered lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
    
    // Paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Single newlines to <br> (except in pre/code blocks)
    html = html.replace(/(?<!<\/pre>|<\/code>)\n(?!<pre|<code)/g, '<br>');
    
    // Wrap in paragraph
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    
    return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
