// ==UserScript==
// @name         Iframe Source Scanner
// @namespace    Violentmonkey Scripts
// @version      2.0
// @description  Scans the webpage for all iframe sources.
// @author       DARKIE
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    class IframeScanner {
        constructor() {
            this.initUI();
            this.scanIframes();
        }

        createStyles() {
            const styles = `
                .scanner-popup {
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

                .scanner-content {
                    margin-top: 10px;
                }

                .scanner-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .scanner-item {
                    padding: 8px;
                    margin: 5px 0;
                    background-color: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    word-break: break-all;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .scanner-item:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .scanner-empty {
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                    font-size: 12px;
                    text-align: center;
                    padding: 20px;
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

        initUI() {
            this.createStyles();

            // Create main container
            this.popup = document.createElement('div');
            this.popup.className = 'scanner-popup';

            // Create toggle button
            this.createToggleButton();

            document.body.appendChild(this.popup);
        }

        createToggleButton() {
            const button = document.createElement('button');
            button.className = 'scanner-button';
            button.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 999998;
                padding: 8px 15px;
                background-color: rgba(28, 28, 35, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            `;
            button.textContent = '🔍 Iframe Scanner';
            button.addEventListener('click', () => this.toggle());
            document.body.appendChild(button);
            this.toggleButton = button;
        }

        scanIframes() {
            const iframes = document.getElementsByTagName('iframe');
            const sources = Array.from(iframes).map(iframe => iframe.src);

            let content;
            if (sources.length > 0) {
                content = `
                    <div class="scanner-header">
                        <h2 class="scanner-title">Found ${sources.length} iframe(s)</h2>
                        <div class="scanner-controls">
                            <button class="scanner-button" id="scanner-close">✕</button>
                        </div>
                    </div>
                    <div class="scanner-content">
                        <ul class="scanner-list">
                            ${sources.map(src => `
                                <li class="scanner-item" title="Click to copy">${src}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            } else {
                content = `
                    <div class="scanner-header">
                        <h2 class="scanner-title">Iframe Scanner</h2>
                        <div class="scanner-controls">
                            <button class="scanner-button" id="scanner-close">✕</button>
                        </div>
                    </div>
                    <div class="scanner-empty">
                        No iframes found on this page
                    </div>
                `;
            }

            this.popup.innerHTML = content;

            // Add event listeners
            this.popup.querySelector('#scanner-close').addEventListener('click', () => this.hide());

            // Add click-to-copy functionality for iframe sources
            this.popup.querySelectorAll('.scanner-item').forEach(item => {
                item.addEventListener('click', () => {
                    navigator.clipboard.writeText(item.textContent);
                    item.style.backgroundColor = 'rgba(50, 205, 50, 0.2)';
                    setTimeout(() => {
                        item.style.backgroundColor = '';
                    }, 500);
                });
            });
        }

        show() {
            this.popup.style.display = 'block';
            this.toggleButton.style.display = 'none';
        }

        hide() {
            this.popup.style.display = 'none';
            this.toggleButton.style.display = 'block';
        }

        toggle() {
            if (this.popup.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    // Initialize scanner when page loads
    window.addEventListener('load', () => {
        new IframeScanner();
    });
})();
