// ==UserScript==
// @name         Iframe Source Scanner
// @namespace    Violentmonkey Scripts
// @version      3.0
// @description  Scans the webpage for all iframe sources.
// @author       DARKIE
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    class IframeScanner {
        #popup;
        #toggleButton;
        #styles = `
            .scanneri-popup {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 400px;
                max-height: 400px;
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
                cursor: pointer;
                transition: background-color 0.2s, transform 0.2s;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .scanneri-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
                transform: translateX(5px);
            }
            .scanneri-item-source {
                color: #fff;
            }
            .scanneri-item-info {
                color: rgba(255, 255, 255, 0.6);
                font-size: 10px;
                display: flex;
                gap: 8px;
            }
            .scanneri-item-tag {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 9px;
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
            this.scanIframes();
        }

        #initializeUI() {
            this.#createStyles();
            this.#createPopup();
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
            this.#toggleButton.textContent = '🔍 Iframe Scanner';
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
                const hasNewIframes = mutations.some(mutation =>
                    Array.from(mutation.addedNodes).some(node =>
                        node.nodeName === 'IFRAME' ||
                        (node.nodeType === 1 && node.querySelector('iframe'))
                    )
                );

                if (hasNewIframes && this.#popup.style.display === 'block') {
                    this.scanIframes();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        #extractIframeInfo(iframe) {
            const info = {
                src: '',
                type: 'unknown',
                attributes: []
            };

            // Check for src attribute
            if (iframe.src) {
                info.src = iframe.src;
                info.type = 'direct';
            }
            // Check for data-src attribute (lazy loading)
            else if (iframe.dataset.src) {
                info.src = iframe.dataset.src;
                info.type = 'lazy-load';
            }
            // Check for srcDoc
            else if (iframe.srcdoc) {
                info.src = iframe.srcdoc.substring(0, 100) + '...';
                info.type = 'srcdoc';
            }

            // Extract additional attributes
            if (iframe.allow) info.attributes.push('allow: ' + iframe.allow);
            if (iframe.sandbox) info.attributes.push('sandbox: ' + iframe.sandbox);
            if (iframe.loading) info.attributes.push('loading: ' + iframe.loading);
            if (iframe.name) info.attributes.push('name: ' + iframe.name);
            if (iframe.width) info.attributes.push(`${iframe.width}x${iframe.height}`);

            return info;
        }

        async scanIframes() {
            const iframes = Array.from(document.getElementsByTagName('iframe'));
            const iframeInfos = iframes.map(iframe => this.#extractIframeInfo(iframe));

            // Also scan for embedded content
            const embeds = Array.from(document.getElementsByTagName('embed'));
            const objects = Array.from(document.getElementsByTagName('object'));
            const frames = Array.from(document.getElementsByTagName('frame'));

            const additionalSources = [...embeds, ...objects, ...frames]
                .filter(el => el.src || el.data)
                .map(el => ({
                    src: el.src || el.data,
                    type: el.tagName.toLowerCase(),
                    attributes: []
                }));

            const allSources = [...iframeInfos, ...additionalSources]
                .filter(info => info.src && !info.src.startsWith('about:blank'));

            const content = allSources.length > 0
                ? this.#generateSourcesList(allSources)
                : this.#generateEmptyState();

            this.#popup.innerHTML = content;
            this.#setupEventListeners();
        }

        #generateSourcesList(sources) {
            return `
                <div class="scanneri-header">
                    <h2 class="scanneri-title">Found ${sources.length} embedded content source(s)</h2>
                    <div class="scanneri-controls">
                        <button class="scanneri-button" id="scanneri-refresh">🔄</button>
                        <button class="scanneri-button" id="scanneri-close">✕</button>
                    </div>
                </div>
                <div class="scanneri-content">
                    <ul class="scanneri-list">
                        ${sources.map(info => `
                            <li class="scanneri-item" title="Click to copy source">
                                <div class="scanneri-item-source">${info.src}</div>
                                <div class="scanneri-item-info">
                                    <span class="scanneri-item-tag">${info.type}</span>
                                    ${info.attributes.map(attr =>
                                        `<span class="scanneri-item-tag">${attr}</span>`
                                    ).join('')}
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
                    <h2 class="scanneri-title">Iframe Scanner</h2>
                    <div class="scanner-controls">
                        <button class="scanneri-button" id="scanneri-refresh">🔄</button>
                        <button class="scanneri-button" id="scanneri-close">✕</button>
                    </div>
                </div>
                <div class="scanner-empty">
                    No embedded content found on this page
                </div>
            `;
        }

        #setupEventListeners() {
            this.#popup.querySelector('#scanneri-close')?.addEventListener('click', () => this.hide());
            this.#popup.querySelector('#scanneri-refresh')?.addEventListener('click', () => this.scanIframes());

            this.#popup.querySelectorAll('.scanneri-item').forEach(item => {
                item.addEventListener('click', async () => {
                    try {
                        const source = item.querySelector('.scanneri-item-source').textContent;
                        await navigator.clipboard.writeText(source);
                        item.style.backgroundColor = 'rgba(50, 205, 50, 0.2)';
                        setTimeout(() => {
                            item.style.backgroundColor = '';
                        }, 500);
                    } catch (error) {
                        console.error('Failed to copy:', error);
                        item.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                        setTimeout(() => {
                            item.style.backgroundColor = '';
                        }, 500);
                    }
                });
            });
        }

        show() {
            this.#popup.style.display = 'block';
            this.#toggleButton.style.display = 'none';
            this.scanIframes();
        }

        hide() {
            this.#popup.style.display = 'none';
            this.#toggleButton.style.display = 'block';
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
        document.addEventListener('DOMContentLoaded', () => new IframeScanner());
    } else {
        new IframeScanner();
    }
})();
