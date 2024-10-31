// ==UserScript==
// @name         Iframe Source Scanner
// @namespace    Violentmonkey Scripts
// @version      1.0
// @description  Scans the webpage for all iframe sources.
// @author       DARKIE
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const popupContainer = document.createElement('div');
    popupContainer.style.position = 'fixed';
    popupContainer.style.bottom = '20px';
    popupContainer.style.right = '20px';
    popupContainer.style.width = '400px';
    popupContainer.style.maxHeight = '400px';
    popupContainer.style.overflowY = 'auto';
    popupContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.9)'; 
    popupContainer.style.color = '#f0f0f0'; 
    popupContainer.style.padding = '10px';
    popupContainer.style.borderRadius = '10px';
    popupContainer.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
    popupContainer.style.zIndex = '9999';
    popupContainer.style.display = 'none'; /
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

    function showPopup(content) {
        popupContainer.innerHTML = content; 
        popupContainer.appendChild(closeButton);
        popupContainer.style.display = 'block'; 
    }

    function scanIframes() {
        const iframes = document.getElementsByTagName('iframe');
        const sources = [];

        for (const iframe of iframes) {
            sources.push(iframe.src);
        }

        if (sources.length > 0) {
            const content = `<h3 style="margin: 0;">Found ${sources.length} iframe(s):</h3>` +
                            '<ul style="padding: 0; margin: 10px 0 0; list-style: none;">' +
                            sources.map(src => `<li style="margin-bottom: 5px; word-wrap: break-word;">${src}</li>`).join('') +
                            '</ul>';
            showPopup(content);
        } else {
            showPopup('No iframes found on this page.');
        }
    }

    window.addEventListener('load', scanIframes);
})();
