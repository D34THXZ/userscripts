// ==UserScript==
// @name         Hanime.tv M3U8 Scanner
// @namespace    Violentmonkey Scripts
// @version      1.5
// @description  Fetch and display the video stream URL.
// @match        https://hanime.tv/videos/hentai/*
// @author       DARKIE
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const videoId = window.location.pathname.split("/").pop();
    const apiUrl = `https://hanime.tv/api/v8/video?id=${videoId}`;

    function createPopup(streamUrl) {
        const popup = document.createElement('div');
        Object.assign(popup.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '280px', padding: '10px', color: '#f0f0f0', backgroundColor: 'rgba(28, 28, 35, 0.95)',
            borderRadius: '10px', boxShadow: '0 3px 15px rgba(0, 0, 0, 0.3)', zIndex: '999999',
            fontFamily: 'Arial, sans-serif', fontSize: '13px', textAlign: 'center', lineHeight: '1.4'
        });

        popup.innerHTML = `
            <h2 style="font-size: 14px; font-weight: 600; margin: 5px 0;">Stream URL</h2>
            <a id="streamUrl" style="color: yellow; cursor: pointer; text-decoration: underline; word-break: break-all;">${streamUrl}</a>
            <p id="copyMessage" style="font-size: 0.85em; color: green; display: none; margin-top: 8px;">Copied to clipboard!</p>
            <button id="closePopup" style="
                margin-top: 10px; padding: 4px 8px; cursor: pointer;
                background: rgba(255, 255, 255, 0.1); border: none; color: #fff;
                border-radius: 5px; font-size: 12px; transition: background-color 0.2s;
            ">Close</button>
        `;

        document.body.appendChild(popup);

        document.getElementById('streamUrl').addEventListener('click', () => {
            navigator.clipboard.writeText(streamUrl).then(() => {
                const copyMessage = document.getElementById('copyMessage');
                copyMessage.style.display = 'block';
                setTimeout(() => copyMessage.style.display = 'none', 1500);
            });
        });

        document.getElementById('closePopup').addEventListener('click', () => document.body.removeChild(popup));
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
