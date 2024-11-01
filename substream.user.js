// ==UserScript==
// @name         Subtitle and Stream Link Scanner
// @namespace    Violentmonkey Scripts
// @version      1.4
// @description  Scan for VTT and M3U8 links on any website.
// @author       DARKIE
// @homepageURL  https://d34thxz.github.io/substream-viewer
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.bottom = '20px';
    popupContainer.style.right = '20px';
    popupContainer.style.width = '300px';
    popupContainer.style.maxHeight = '400px';
    popupContainer.style.overflowY = 'auto';
    popupContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    popupContainer.style.color = '#f0f0f0';
    popupContainer.style.padding = '10px';
    popupContainer.style.borderRadius = '10px';
    popupContainer.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
    popupContainer.style.zIndex = '9999';
    popupContainer.style.display = 'none';
    popupContainer.style.fontFamily = 'Arial, sans-serif';
    popupContainer.style.fontSize = '14px';
    popupContainer.style.scrollbarWidth = 'thin';
    popupContainer.style.scrollbarColor = '#888 #444';

    const style = document.createElement('style');
    style.textContent = `
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
            width: 8px;  /* Width of the scrollbar */
        }
        ::-webkit-scrollbar-track {
            background: #444;  /* Background of the scrollbar track */
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
            background: #888;  /* Color of the scrollbar thumb */
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #aaa;  /* Color of the scrollbar thumb on hover */
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popupContainer);

    const closeButton = document.createElement('button');
    closeButton.textContent = '✖ Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#f0f0f0';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.addEventListener('click', () => {
        popupContainer.style.display = 'none';
    });
    popupContainer.appendChild(closeButton);

    const vttSection = document.createElement('div');
    const m3u8Section = document.createElement('div');

    const vttTitle = document.createElement('h3');
    vttTitle.textContent = 'VTT Links';
    vttTitle.style.margin = '0 0 10px 0';
    vttTitle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    vttTitle.style.fontSize = '16px';

    const m3u8Title = document.createElement('h3');
    m3u8Title.textContent = 'M3U8 Links';
    m3u8Title.style.margin = '10px 0 10px 0';
    m3u8Title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    m3u8Title.style.fontSize = '16px';

    vttSection.appendChild(vttTitle);
    m3u8Section.appendChild(m3u8Title);

    popupContainer.appendChild(vttSection);
    popupContainer.appendChild(m3u8Section);

    function showPopup() {
        popupContainer.style.display = 'block';
    }

    function addMessage(type, message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.padding = '5px 0';
        messageElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        messageElement.style.overflow = 'hidden';
        messageElement.style.maxWidth = '100%';

        messageElement.style.wordWrap = 'break-word';
        messageElement.style.whiteSpace = 'normal';

        if (type === 'vtt') {
            vttSection.appendChild(messageElement);
        } else if (type === 'm3u8') {
            m3u8Section.appendChild(messageElement);
        }

        showPopup();
    }

    function checkForLinks() {
        const originalFetch = window.fetch;
        const originalXhrOpen = XMLHttpRequest.prototype.open;

        window.fetch = function (...args) {
            const url = args[0];
            if (typeof url === 'string') {
                if (url.endsWith('.vtt')) {
                    console.log('VTT file requested:', url);
                    addMessage('vtt', `VTT file requested: ${url}`);
                } else if (url.endsWith('.m3u8')) {
                    console.log('M3U8 file requested:', url);
                    addMessage('m3u8', `M3U8 file requested: ${url}`);
                }
            }
            return originalFetch.apply(this, args);
        };

        XMLHttpRequest.prototype.open = function (method, url) {
            if (typeof url === 'string') {
                if (url.endsWith('.vtt')) {
                    console.log('VTT file requested:', url);
                    addMessage('vtt', `VTT file requested: ${url}`);
                } else if (url.endsWith('.m3u8')) {
                    console.log('M3U8 file requested:', url);
                    addMessage('m3u8', `M3U8 file requested: ${url}`);
                }
            }
            return originalXhrOpen.apply(this, arguments);
        };
    }

    window.addEventListener('load', () => {
        checkForLinks();
    });
})();
