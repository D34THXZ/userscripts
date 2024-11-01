// ==UserScript==
// @name         StreamScanner (SubStream)
// @namespace    Violentmonkey Scripts
// @version      2.5
// @description  Scan for VTT/SRT and M3U8/MP4 links on any website.
// @author       DARKIE
// @homepageURL  https://d34thxz.github.io/substream-viewer
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    class StreamScanner {
        constructor() {
            this.initUI();
            this.setupNetworkMonitoring();
            this.scanForVideoSources();
        }

        createStyles() {
            const styles = `
                .scanner-popup {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    max-height: 500px;
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

        initUI() {
            this.createStyles();

            // Create main container
            this.popup = document.createElement('div');
            this.popup.className = 'scanner-popup';

            // Create header
            const header = `
                <div class="scanner-header">
                    <h2 class="scanner-title">Stream Scanner</h2>
                    <div class="scanner-controls">
                        <button class="scanner-button" id="scanner-clear">Clear</button>
                        <button class="scanner-button" id="scanner-close">✕</button>
                    </div>
                </div>
            `;

            // Create sections
            const sections = `
                <div class="scanner-section" id="vtt-section">
                    <h3 class="scanner-section-title">Subtitles (VTT)</h3>
                    <div class="scanner-content" id="vtt-content">
                        <div class="scanner-empty">No VTT files detected yet...</div>
                    </div>
                </div>
                <div class="scanner-section" id="srt-section">
                    <h3 class="scanner-section-title">Subtitles (SRT)</h3>
                    <div class="scanner-content" id="srt-content">
                        <div class="scanner-empty">No SRT files detected yet...</div>
                    </div>
                </div>
                <div class="scanner-section" id="m3u8-section">
                    <h3 class="scanner-section-title">Streams (M3U8)</h3>
                    <div class="scanner-content" id="m3u8-content">
                        <div class="scanner-empty">No M3U8 streams detected yet...</div>
                    </div>
                </div>
                <div class="scanner-section" id="mp4-section">
                    <h3 class="scanner-section-title">Videos (MP4)</h3>
                    <div class="scanner-content" id="mp4-content">
                        <div class="scanner-empty">No MP4 videos detected yet...</div>
                    </div>
                </div>
            `;

            this.popup.innerHTML = header + sections;
            document.body.appendChild(this.popup);

            // Add event listeners
            document.getElementById('scanner-close').addEventListener('click', () => this.hide());
            document.getElementById('scanner-clear').addEventListener('click', () => this.clearLinks());

            // Create toggle button
            this.createToggleButton();
        }

        createToggleButton() {
            const button = document.createElement('button');
            button.className = 'scanner-button';
            button.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999998;
                padding: 8px 15px;
                background-color: rgba(28, 28, 35, 0.95);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            `;
            button.textContent = '🔍 Scanner';
            button.addEventListener('click', () => this.toggle());
            document.body.appendChild(button);
            this.toggleButton = button;
        }

        setupNetworkMonitoring() {
            // Monitor fetch requests
            const originalFetch = window.fetch;
            window.fetch = (...args) => {
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                this.checkUrl(url);
                return originalFetch.apply(window, args);
            };

            // Monitor XHR requests
            const originalXhrOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(...args) {
                const url = args[1];
                if (typeof url === 'string') {
                    window.streamScanner.checkUrl(url);
                }
                return originalXhrOpen.apply(this, args);
            };

            // Make scanner instance globally available for XHR monitoring
            window.streamScanner = this;
        }

        checkUrl(url) {
            if (typeof url === 'string') {
                if (url.endsWith('.vtt')) {
                    this.addLink('vtt', url);
                } else if (url.endsWith('.srt')) {
                    this.addLink('srt', url);
                } else if (url.endsWith('.m3u8')) {
                    this.addLink('m3u8', url);
                }
            }
        }

        scanForVideoSources() {
            // Select all <video> elements on the page
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                const src = video.src || video.getAttribute('src'); // Get src from video element
                if (src && src.endsWith('.mp4')) {
                    this.addLink('mp4', src);
                }
            });

            // Additionally, check <source> tags inside <video> elements
            const sources = document.querySelectorAll('source');
            sources.forEach(source => {
                const src = source.src || source.getAttribute('src'); // Get src from source element
                if (src && src.endsWith('.mp4')) {
                    this.addLink('mp4', src);
                }
            });
        }


        addLink(type, url) {
            const container = document.getElementById(`${type}-content`);

            // Check for duplicate
            if (Array.from(container.querySelectorAll('.scanner-link'))
                .some(link => link.textContent.includes(url))) {
                return;
            }

            // Clear "empty" message if it exists
            if (container.querySelector('.scanner-empty')) {
                container.innerHTML = '';
            }

            const linkElement = document.createElement('div');
            linkElement.className = 'scanner-link';
            linkElement.innerHTML = `
                ${url}
                <div class="timestamp">
                    Detected at ${new Date().toLocaleTimeString()}
                </div>
            `;

            // Add click-to-copy functionality with fallback
            linkElement.addEventListener('click', () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        // Indicate success
                        linkElement.style.backgroundColor = 'rgba(50, 205, 50, 0.2)';
                        setTimeout(() => {
                            linkElement.style.backgroundColor = '';
                        }, 500);
                    }).catch(err => {
                        console.error('Clipboard error:', err);
                        this.copyFallback(url, linkElement);
                    });
                } else {
                    this.copyFallback(url, linkElement);
                }
            });

            container.insertBefore(linkElement, container.firstChild);
            this.show();
        }

        // Fallback copy method
        copyFallback(text, linkElement) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Prevents scrolling to bottom
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
                linkElement.style.backgroundColor = 'rgba(50, 205, 50, 0.2)';
                setTimeout(() => {
                    linkElement.style.backgroundColor = '';
                }, 500);
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textarea);
        }


        clearLinks() {
            document.getElementById('vtt-content').innerHTML = '<div class="scanner-empty">No VTT files detected yet...</div>';
            document.getElementById('srt-content').innerHTML = '<div class="scanner-empty">No SRT files detected yet...</div>';
            document.getElementById('m3u8-content').innerHTML = '<div class="scanner-empty">No M3U8 streams detected yet...</div>';
            document.getElementById('mp4-content').innerHTML = '<div class="scanner-empty">No MP4 videos detected yet...</div>';
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
        new StreamScanner();
    });
})();
