// ==UserScript==
// @name         Image Source Scanner
// @namespace    Violentmonkey Scripts
// @version      1.2
// @description  Scans the webpage for all image sources with preview functionality.
// @author       DARKIE
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    class ImageScanner {
        #popup;
        #toggleButton;
        #previewPopup;
        #styles = `
            .scanneri-popup {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 400px;
                max-height: 80vh;
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
            .scanneri-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .scanneri-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }
            .scanneri-controls {
                display: flex;
                gap: 8px;
            }
            .scanneri-button {
                background-color: rgba(255, 255, 255, 0.1);
                border: none;
                color: #fff;
                padding: 5px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
            }
            .scanneri-button:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            .scanneri-content {
                margin-top: 10px;
            }
            .scanneri-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .scanneri-item {
                padding: 8px;
                margin: 5px 0;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                word-break: break-all;
                font-size: 12px;
                transition: background-color 0.2s;
                display: flex;
                flex-direction: column;
                gap: 4px;
                position: relative;
            }
            .scanneri-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            .scanneri-item-source {
                color: #fff;
            }
            .scanneri-item-info {
                color: rgba(255, 255, 255, 0.6);
                font-size: 10px;
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .scanneri-item-tag {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 9px;
            }
            .scanneri-button-group {
                margin-left: auto;
                display: flex;
                gap: 4px;
            }
            .scanneri-view {
                background-color: rgba(64, 156, 255, 0.2);
                border: none;
                color: #fff;
                padding: 3px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            }
            .scanneri-view:hover {
                background-color: rgba(64, 156, 255, 0.4);
            }
            .scanneri-download {
                background-color: rgba(50, 205, 50, 0.2);
                border: none;
                color: #fff;
                padding: 3px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            }
            .scanneri-download:hover {
                background-color: rgba(50, 205, 50, 0.4);
            }
            .scanneri-preview {
                position: fixed;
                padding: 10px;
                background-color: rgba(28, 28, 35, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                z-index: 1000000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                max-width: 300px;
                max-height: 300px;
            }
            .scanneri-preview img {
                max-width: 100%;
                max-height: 280px;
                border-radius: 4px;
            }
            .scanneri-empty {
                color: rgba(255, 255, 255, 0.5);
                font-style: italic;
                font-size: 12px;
                text-align: center;
                padding: 20px;
            }


            .scanneri-popup::-webkit-scrollbar {
                width: 8px;
            }
            .scanneri-popup::-webkit-scrollbar-track {
                background: #444;
                border-radius: 10px;
            }
            .scanneri-popup::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 10px;
            }
            .scanneri-popup::-webkit-scrollbar-thumb:hover {
                background: #aaa;
            }`;

        constructor() {
            this.#initializeUI();
            this.#setupMutationObserver();
            this.scanImages();
        }

        #initializeUI() {
            this.#createStyles();
            this.#createPopup();
            this.#createPreviewPopup();
            this.#createToggleButton();
            this.#setupKeyboardShortcut();
        }

        #createStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = this.#styles;
            document.head.appendChild(styleSheet);
        }

        #createPopup() {
            this.#popup = document.createElement('div');
            this.#popup.className = 'scanneri-popup';
            document.body.appendChild(this.#popup);
        }

        #createPreviewPopup() {
            this.#previewPopup = document.createElement('div');
            this.#previewPopup.className = 'scanneri-preview';
            this.#previewPopup.innerHTML = '<img src="" alt="Preview">';
            document.body.appendChild(this.#previewPopup);
        }

        #createToggleButton() {
            this.#toggleButton = document.createElement('button');
            this.#toggleButton.className = 'scanneri-button';
            this.#toggleButton.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 999998;
                padding: 8px 15px;
                background-color: rgba(28, 28, 35, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            `;
            this.#toggleButton.textContent = '🖼️ Image Scanner';
            this.#toggleButton.addEventListener('click', () => this.toggle());
            document.body.appendChild(this.#toggleButton);
        }

        #setupKeyboardShortcut() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                    this.toggle();
                }
            });
        }

        #setupMutationObserver() {
            const observer = new MutationObserver((mutations) => {
                const hasNewImages = mutations.some(mutation =>
                    Array.from(mutation.addedNodes).some(node =>
                        node.nodeName === 'IMG' ||
                        (node.nodeType === 1 && node.querySelector('img'))
                    )
                );

                if (hasNewImages && this.#popup.style.display === 'block') {
                    this.scanImages();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        async downloadImage(url, filename) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename || 'image';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error('Failed to download image:', error);
            }
        }

        #extractImageInfo(img) {
            const info = {
                src: img.src || img.currentSrc,
                type: 'image',
                attributes: []
            };

            if (img.alt) info.attributes.push(`alt: ${img.alt}`);
            if (img.width) info.attributes.push(`${img.width}x${img.height}`);
            if (img.loading) info.attributes.push(`loading: ${img.loading}`);

            return info;
        }

        async scanImages() {
            // Get all images from img tags
            const images = Array.from(document.getElementsByTagName('img'));
            const imageInfos = images
                .filter(img => img.src && !img.src.startsWith('data:'))
                .map(img => this.#extractImageInfo(img));

            // Get background images from CSS
            const elements = document.getElementsByTagName('*');
            const backgroundImages = Array.from(elements)
                .map(el => {
                    const style = window.getComputedStyle(el);
                    const bgImage = style.backgroundImage;
                    if (bgImage && bgImage !== 'none') {
                        const url = bgImage.replace(/url\(['"]?(.*?)['"]?\)/g, '$1');
                        if (!url.startsWith('data:')) {
                            return {
                                src: url,
                                type: 'background',
                                attributes: [`element: ${el.tagName.toLowerCase()}`]
                            };
                        }
                    }
                    return null;
                })
                .filter(Boolean);

            const allSources = [...imageInfos, ...backgroundImages];

            const content = allSources.length > 0
                ? this.#generateSourcesList(allSources)
                : this.#generateEmptyState();

            this.#popup.innerHTML = content;
            this.#setupEventListeners();
        }

        #generateSourcesList(sources) {
            return `
                <div class="scanneri-header">
                    <h2 class="scanneri-title">Found ${sources.length} image source(s)</h2>
                    <div class="scanneri-controls">
                        <button class="scanneri-button" id="scanneri-refresh">🔄</button>
                        <button class="scanneri-button" id="scanneri-close">✕</button>
                    </div>
                </div>
                <div class="scanneri-content">
                    <ul class="scanneri-list">
                        ${sources.map((info, index) => `
                            <li class="scanneri-item" data-src="${info.src}">
                                <div class="scanneri-item-source">${info.src}</div>
                                <div class="scanneri-item-info">
                                    <span class="scanneri-item-tag">${info.type}</span>
                                    ${info.attributes.map(attr =>
                                        `<span class="scanneri-item-tag">${attr}</span>`
                                    ).join('')}
                                    <div class="scanneri-button-group">
                                        <button class="scanneri-view" data-index="${index}">View</button>
                                        <button class="scanneri-download" data-index="${index}">Download</button>
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        #generateEmptyState() {
            return `
                <div class="scanneri-header">
                    <h2 class="scanneri-title">Image Scanner</h2>
                    <div class="scanner-controls">
                        <button class="scanneri-button" id="scanneri-refresh">🔄</button>
                        <button class="scanneri-button" id="scanneri-close">✕</button>
                    </div>
                </div>
                <div class="scanner-empty">
                    No images found on this page
                </div>
            `;
        }

        #setupEventListeners() {
            this.#popup.querySelector('#scanneri-close')?.addEventListener('click', () => this.hide());
            this.#popup.querySelector('#scanneri-refresh')?.addEventListener('click', () => this.scanImages());

            this.#popup.querySelectorAll('.scanneri-item').forEach(item => {
                const src = item.dataset.src;

                // Preview handling
                item.addEventListener('mouseenter', (e) => {
                    const preview = this.#previewPopup;
                    const img = preview.querySelector('img');
                    img.src = src;

                    const rect = item.getBoundingClientRect();
                    preview.style.left = `${rect.right + 10}px`;
                    preview.style.top = `${rect.top}px`;
                    preview.style.opacity = '1';
                });

                item.addEventListener('mouseleave', () => {
                    this.#previewPopup.style.opacity = '0';
                });

                // View button handling
                item.querySelector('.scanneri-view').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open(src, '_blank');
                });

                // Download button handling
                item.querySelector('.scanneri-download').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filename = src.split('/').pop();
                    this.downloadImage(src, filename);
                });
            });
        }

        show() {
            this.#popup.style.display = 'block';
            this.#toggleButton.style.display = 'none';
            this.scanImages();
        }

        hide() {
            this.#popup.style.display = 'none';
            this.#toggleButton.style.display = 'block';
            this.#previewPopup.style.opacity = '0';
        }

        toggle() {
            if (this.#popup.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    // Initialize scanner when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ImageScanner());
    } else {
        new ImageScanner();
    }
})();
