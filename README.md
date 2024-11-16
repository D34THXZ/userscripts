# Userscripts

Here’s a quick rundown of some useful userscripts to help with various web scraping and data extraction tasks. Remember, these scripts are intended for personal use only and should be used responsibly.

### 1. StreamScanner (Substream)
- **Description**: Scans for VTT/SRT and M3U8/MP4 links on any website.
- **Note**: This script works on most websites, making it handy for finding streaming links and subtitles directly on the page.

### 2. IframeScan
- **Description**: Scans the webpage for all iframe sources.
- **Note**: Great for locating embedded content or media on a webpage.

### 3. ImageScan
- **Description**: Scans the webpage for all image sources.

### 3. Hanime.tv Video Source Reader (Note: This will no longer be updated as of 11-2-24, as StreamScanner 3.0 has been updated to do this.)
- **Description**: Reads source URLs for streams (specifically HLS links).
- **Important**: Do not attempt to stream HLS links from a different host than the original. For the best results, download streams directly using `yt-dlp` with this command:
  ```bash
  yt-dlp --downloader ffmpeg --hls-use-mpegts <url>
