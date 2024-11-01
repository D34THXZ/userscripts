// ==UserScript==
// @name         Hanime.tv M3U8 Scanner
// @namespace    Violentmonkey Scripts
// @version      1.3
// @description  Fetch and display the video stream URL.
// @match        https://hanime.tv/videos/hentai/*
// @author       DARKIE
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const videoId = window.location.pathname.split("/").pop();

    const apiUrl = `https://hanime.tv/api/v8/video?id=${videoId}`;

    function createPopup(streamUrl) {
        const popup = document.createElement('div');
        popup.id = 'streamPopup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.padding = '20px';
        popup.style.zIndex = '10000';
        popup.style.backgroundColor = '#fff';
        popup.style.border = '2px solid #333';
        popup.style.borderRadius = '8px';
        popup.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.3)';
        popup.innerHTML = `
            <h2>Stream URL</h2>
            <p id="streamUrl" style="color: blue; cursor: pointer; text-decoration: underline;">${streamUrl}</p>
            <p style="font-size: 0.9em; color: green; display: none;" id="copyMessage">Copied to clipboard!</p>
            <button id="closePopup" style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">Close</button>
        `;

        document.body.appendChild(popup);

        document.getElementById('streamUrl').addEventListener('click', () => {
            navigator.clipboard.writeText(streamUrl).then(() => {
                const copyMessage = document.getElementById('copyMessage');
                copyMessage.style.display = 'block';
                setTimeout(() => {
                    copyMessage.style.display = 'none';
                }, 2000);
            });
        });

        document.getElementById('closePopup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: apiUrl,
        onload: function(response) {
            try {
                const data = JSON.parse(response.responseText);

                const streamUrl = data.videos_manifest.servers[0].streams[1].url;

                createPopup(streamUrl);
            } catch (error) {
                console.error("Failed to fetch or parse video data:", error);
            }
        },
        onerror: function(error) {
            console.error("Request to API failed:", error);
        }
    });
})();
