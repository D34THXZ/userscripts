// ==UserScript==
// @name         StreamScanner (SubStream)
// @namespace    Violentmonkey Scripts
// @version      3.0
// @description  Scan for VTT/SRT and M3U8/MP4 links on any website.
// @author       DARKIE
// @homepageURL  https://d34thxz.github.io/substream-viewer
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    class StreamScanner {
        constructor() {
            this.urlSet = new Set(); // Track found URLs to prevent duplicates
            this.config = {
                ui: {
                    popup: {
                        width: '350px',
                        maxHeight: '500px'
                    }
                },
                selectors: {
                    vtt: '#vtt-content',
                    srt: '#srt-content',
                    m3u8: '#m3u8-content',
                    mp4: '#mp4-content'
                },
                linkTypes: ['vtt', 'srt', 'm3u8', 'mp4']
            };

            this.initUI();
            this.setupNetworkMonitoring();
            this.scanForVideoSources();
            this.observeDOMChanges();
        }

        /* UI Initialization and Styling */
        initUI() {
            this.createStyles();
            this.createPopup();
            this.createToggleButton();
            this.cacheDOMElements();
            this.addEventListeners();
        }

        createStyles() {
            const styles = `
                .scanner-popup {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: ${this.config.ui.popup.width};
                    max-height: ${this.config.ui.popup.maxHeight};
                    background-color: rgba(28, 28, 35, 0.95);
                    color: #f0f0f0;
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    z-index: 999999;
                    display: none;
                    overflow-y: auto;
                    backdrop-filter: blur(5px);
                }

                .scanner-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .scanner-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }

                .scanner-controls {
                    display: flex;
                    gap: 8px;
                }

                .scanner-button {
                    background-color: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                    padding: 5px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background-color 0.2s;
                }

                .scanner-button:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }

                .scanner-section {
                    margin-bottom: 15px;
                }

                .scanner-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    padding-bottom: 5px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .scanner-link {
                    padding: 8px;
                    margin: 5px 0;
                    background-color: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    word-break: break-all;
                    font-size: 12px;
                    cursor: pointer;
                    position: relative;
                }

                .scanner-link:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .scanner-link .timestamp {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 4px;
                }

                .scanner-empty {
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                    font-size: 12px;
                }

                /* Scrollbar styles */
                .scanner-popup::-webkit-scrollbar {
                    width: 8px;
                }
                .scanner-popup::-webkit-scrollbar-track {
                    background: #444;
                    border-radius: 10px;
                }
                .scanner-popup::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .scanner-popup::-webkit-scrollbar-thumb:hover {
                    background: #aaa;
                }
            `;
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        createPopup() {
            this.popup = document.createElement('div');
            this.popup.className = 'scanner-popup';
            this.popup.innerHTML = `
                <div class="scanner-header">
                    <h2 class="scanner-title">Stream Scanner</h2>
                    <div class="scanner-controls">
                        <button class="scanner-button" id="scanner-clear">Clear</button>
                        <button class="scanner-button" id="scanner-close">✕</button>
                    </div>
                </div>
                ${this.config.linkTypes.map(type => `
                    <div class="scanner-section" id="${type}-section">
                        <h3 class="scanner-section-title">${type.toUpperCase()} Files</h3>
                        <div class="scanner-content" id="${type}-content">
                            <div class="scanner-empty">No ${type.toUpperCase()} files detected yet...</div>
                        </div>
                    </div>
                `).join('')}
            `;
            document.body.appendChild(this.popup);
        }

        createToggleButton() {
            this.toggleButton = document.createElement('button');
            this.toggleButton.className = 'scanner-button';
            this.toggleButton.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999998;
                padding: 8px 15px;
                background-color: rgba(28, 28, 35, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            `;
            this.toggleButton.textContent = '🔍 Scanner';
            document.body.appendChild(this.toggleButton);
        }

        cacheDOMElements() {
            this.clearButton = this.popup.querySelector('#scanner-clear');
            this.closeButton = this.popup.querySelector('#scanner-close');
        }

        addEventListeners() {
            this.closeButton.addEventListener('click', () => this.hidePopup());
            this.clearButton.addEventListener('click', () => this.clearLinks());
            this.toggleButton.addEventListener('click', () => this.togglePopup());
        }

        /* Enhanced URL Pattern Matching */
        cleanUrl(url) {
            return url.split('?')[0]; // Remove query parameters
        }

        isSupportedVideoUrl(url) {
            const cleanedUrl = this.cleanUrl(url);
            const videoExtensions = /\.(mp4|m3u8|vtt|srt)$/i;
            return videoExtensions.test(cleanedUrl);
        }

        handleUrl(url) {
            if (typeof url !== 'string' || this.urlSet.has(url)) return;

            const type = this.config.linkTypes.find(ext => url.endsWith(`.${ext}`));
            if (type) {
                const cleanedUrl = this.cleanUrl(url);
                this.urlSet.add(cleanedUrl);
                this.addLink(type, cleanedUrl);
            }
        }

        /* Comprehensive Video Source Detection */
        scanForVideoSources() {
            document.querySelectorAll('video, source, object, embed, a').forEach(element => {
                const url = element.currentSrc || element.src || element.data || element.href;
                if (url && this.isSupportedVideoUrl(url)) this.handleUrl(url);
            });

            document.querySelectorAll('[data-src], [data-url]').forEach(element => {
                const url = element.dataset.src || element.dataset.url;
                if (url && this.isSupportedVideoUrl(url)) this.handleUrl(url);
            });
        }

        /* Dynamic Content Monitoring */
        observeDOMChanges() {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) this.scanForVideoSources();
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.domObserver = observer;
        }

        /* Cross-Frame Support */
        scanIframes() {
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.querySelectorAll('video, source').forEach(({ src }) => {
                        if (src && this.isSupportedVideoUrl(src)) this.handleUrl(src);
                    });
                } catch (e) {
                    console.warn('Cross-origin restriction prevents scanning iframe:', e);
                }
            });
        }

        /* Additional Source Types */
        monitorSetAttribute() {
            const originalSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function(name, value) {
                if (name === 'src' && typeof value === 'string' && value.endsWith('.mp4')) {
                    window.streamScanner.handleUrl(value);
                }
                return originalSetAttribute.apply(this, arguments);
            };
        }

        /* Network Monitoring */
        setupNetworkMonitoring() {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const { url } = args[0] instanceof Request ? args[0] : { url: args[0] };
                if (url) this.handleUrl(url);
                return originalFetch.apply(window, args);
            };

            const originalXhrOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(...args) {
                const url = args[1];
                if (typeof url === 'string') window.streamScanner.handleUrl(url);
                return originalXhrOpen.apply(this, args);
            };

            window.streamScanner = this;
        }

        /* Link Management and Display */
        async addLink(type, url) {
            const container = document.querySelector(this.config.selectors[type]);
            if (!container) return;

            if (container.querySelector('.scanner-empty')) container.innerHTML = '';

            const linkElement = document.createElement('div');
            linkElement.className = 'scanner-link';
            linkElement.innerHTML = `
                ${url}
                <div class="timestamp">Detected at ${new Date().toLocaleTimeString()}</div>
            `;

            linkElement.addEventListener('click', () => this.copyToClipboard(url, linkElement));
            container.prepend(linkElement);
            this.showPopup();
        }

        async copyToClipboard(text, linkElement) {
            try {
                await navigator.clipboard.writeText(text);
                this.flashCopyFeedback(linkElement);
            } catch (err) {
                this.copyFallback(text, linkElement);
            }
        }

        copyFallback(text, linkElement) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.flashCopyFeedback(linkElement);
            } catch (err) {
                console.error('Copy failed:', err);
            }
            document.body.removeChild(textarea);
        }

        flashCopyFeedback(linkElement) {
            linkElement.style.backgroundColor = 'rgba(50, 205, 50, 0.2)';
            setTimeout(() => { linkElement.style.backgroundColor = ''; }, 500);
        }

        /* UI Control and Cleanup */
        clearLinks() {
            this.config.linkTypes.forEach(type => {
                const container = document.querySelector(this.config.selectors[type]);
                if (container) {
                    container.innerHTML = `<div class="scanner-empty">No ${type.toUpperCase()} files detected yet...</div>`;
                }
            });
            this.urlSet.clear();
        }

        togglePopup() {
            this.popup.style.display = this.popup.style.display === 'none' ? 'block' : 'none';
            this.toggleButton.style.display = this.popup.style.display === 'none' ? 'block' : 'none';
        }

        showPopup() {
            this.popup.style.display = 'block';
            this.toggleButton.style.display = 'none';
        }

        hidePopup() {
            this.popup.style.display = 'none';
            this.toggleButton.style.display = 'block';
        }
    }

    window.addEventListener('load', () => {
        const scanner = new StreamScanner();
        scanner.scanIframes();
        scanner.monitorSetAttribute();
    });
})();
