# Userscripts

Here’s a quick rundown of some useful userscripts to help with various web scraping and data extraction tasks. Remember, these scripts are intended for personal use only and should be used responsibly.

### 1. StreamScanner (Substream)
- **Description**: Scans for VTT/SRT and M3U8/MP4 links on any website.
- **Note**: This script works on most websites, making it handy for finding streaming links and subtitles directly on the page.

### 2. IframeScan
- **Description**: Scans the webpage for all iframe sources.
- **Note**: Great for locating embedded content or media on a webpage.

### 3. Hanime.tv Video Source Reader
- **Description**: Reads source URLs for streams (specifically HLS links).
- **Important**: Do not attempt to stream HLS links from a different host than the original. For the best results, download streams directly using `yt-dlp` with this command:
  ```bash
  yt-dlp --downloader ffmpeg --hls-use-mpegts <url>
