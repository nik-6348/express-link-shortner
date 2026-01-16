import Link from '../models/Link.js';
import { nanoid } from 'nanoid';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper: Scrape Metadata
const getMetadata = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);

        const title = $('title').text() || new URL(url).hostname;
        let favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';

        // Handle relative favicon URLs
        if (favicon && !favicon.startsWith('http')) {
            const origin = new URL(url).origin;
            favicon = origin + (favicon.startsWith('/') ? '' : '/') + favicon;
        }

        // Fallback to Google Favicon API if none found
        if (!favicon) {
            favicon = `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
        }

        return { title, favicon };
    } catch (error) {
        console.error('Metadata scrape error:', error.message);
        return {
            title: new URL(url).hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${url}&sz=128`
        };
    }
};

// @desc    Create or Update Link
// @route   POST /api/links
export const upsertLink = async (req, res) => {
    try {
        // Strategy: Check existence FIRST.
        const { originalUrl, customAlias, title: manualTitle, favicon: manualFavicon } = req.body;

        let link = null;
        if (customAlias) {
            link = await Link.findOne({ shortCode: customAlias });
        }

        if (link) {
            // --- UPDATE EXISTING ---
            link.originalUrl = originalUrl;
            link.isActive = true; // Reactivate

            // Only update metadata if explicitly provided in request
            // This preserves the old "Jio TV" title even if URL changes, unless user manually edits it
            if (manualTitle) link.title = manualTitle;
            if (manualFavicon) link.favicon = manualFavicon;

            await link.save();
            return res.status(200).json({ success: true, data: link, message: 'Link updated' });

        } else {
            // --- CREATE NEW ---
            let title = manualTitle;
            let favicon = manualFavicon;

            // Only scrape if we don't have manual values
            if (!title || !favicon) {
                const scraped = await getMetadata(originalUrl);
                if (!title) title = scraped.title;
                if (!favicon) favicon = scraped.favicon;
            }

            link = await Link.create({
                originalUrl,
                shortCode: customAlias,
                title,
                favicon
            });
            return res.status(201).json({ success: true, data: link, message: 'Link created' });
        }

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Short code already in use' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get All Links (for Dashboard)
// @route   GET /api/links
export const getLinks = async (req, res) => {
    try {
        const links = await Link.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: links });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Redirect to Original URL with Loading Page
// @route   GET /:code
export const redirectLink = async (req, res) => {
    try {
        const { code } = req.params;
        const link = await Link.findOne({ shortCode: code });

        // Common CSS/HTML for consistent attractive pages
        const renderPage = (title, icon, message, subtext, color = '#ef4444') => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #0f172a; color: #f8fafc; font-family: 'Outfit', sans-serif; overflow: hidden; }
                    .container { text-align: center; animation: fadeIn 0.8s ease-out; max-width: 600px; padding: 2rem; }
                    .icon-wrapper { color: ${color}; margin-bottom: 2rem; animation: pulse 2s infinite; }
                    h1 { font-weight: 600; margin-bottom: 0.5rem; font-size: 2rem; }
                    .sub-text { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon-wrapper">
                         ${icon.startsWith('fa-') ? `<i class="${icon} fa-5x"></i>` : `<img src="${icon}" style="width:100px; height:100px; border-radius:50%">`}
                    </div>
                    <h1>${message}</h1>
                    <p class="sub-text">${subtext}</p>
                </div>
            </body>
            </html>
        `;

        // 1. Check if Link Exists
        if (!link) {
            return res.status(404).send(renderPage('Link Not Found', 'fa-solid fa-link-slash', 'Link Not Found', 'The link you are looking for does not exist or has been removed.'));
        }

    
        // 2. Serve Redirect Loading Page
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${link.title}</title>
    <link rel="icon" href="${link.favicon}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #0f172a; color: #f8fafc; font-family: 'Outfit', sans-serif; overflow: hidden; }
        .container { text-align: center; animation: fadeIn 0.8s ease-out; }
        .logo-wrapper { width: 120px; height: 120px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem; box-shadow: 0 0 30px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); }
        .site-icon { width: 60px; height: 60px; object-fit: contain; }
        h1 { font-weight: 600; margin-bottom: 0.5rem; font-size: 1.5rem; }
        .loader { width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; margin: 2rem auto; position: relative; overflow: hidden; }
        .loader::after { content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 50%; background: #3b82f6; border-radius: 2px; animation: load 1.5s infinite ease-in-out; }
        @keyframes load { 0% { left: -50%; } 100% { left: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .sub-text { color: #94a3b8; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-wrapper">
             ${link.favicon ? `<img src="${link.favicon}" class="site-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"> <i class="fa-solid fa-link fa-3x" style="color:#3b82f6; display:none"></i>` : '<i class="fa-solid fa-link fa-3x" style="color:#3b82f6"></i>'}
        </div>
        <h1>Wait securely..</h1>
        <p class="sub-text">Redirecting to ${link.title}...</p>
        <div class="loader"></div>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = "${link.originalUrl}";
        }, 2200);
    </script>
</body>
</html>
        `;

        return res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send(renderPage('Server Error', 'fa-solid fa-bug', 'Internal Server Error', 'Something went wrong on our end.'));
    }
};

// @desc    Toggle Active Status
// @route   PUT /api/links/:id/toggle
export const toggleLinkStatus = async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);
        if (!link) return res.status(404).json({ message: 'Not found' });

        link.isActive = !link.isActive;
        await link.save();
        res.json({ success: true, data: link });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
