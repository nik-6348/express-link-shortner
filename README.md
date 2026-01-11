# ShortLink - Premium URL Shortener

ShortLink is a modern, ES6-based Express.js application for managing and tracking short links. It features a premium glassmorphism dashboard, automatic metadata fetching (titles/favicons), and a secure intermediate redirection page.

## Features

- **🔗 Smart UI**: Glassmorphism design with responsive layout.
- **✨ Metadata Fetching**: Automatically scrapes the target website's Title and Favicon.
- **🛡️ Secure Redirection**: Shows an intermediate "Redirecting..." page with the target site's branding before redirecting.
- **📊 Stats**: Track total clicks and active status.
- **✏️ Upsert Logic**: Update existing aliases or create new ones seamlessly.
- **📱 QR Code**: Auto-generate QR codes for any short link.

## Tech Stack

- **Backend**: Node.js, Express.js (ES6 Modules)
- **Database**: MongoDB (Mongoose)
- **Frontend**: Vanilla JS, CSS3 (Glassmorphism), HTML5
- **Utilities**: `nanoid` (IDs), `cheerio` (Scraping), `axios` (HTTP Requests)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd redirect-shortlink
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    MONGO_URI=mongodb://127.0.0.1:27017/shortlink-app
    BASE_URL=http://localhost:3000
    ```

4.  Start the Server:
    ```bash
    # Development (with Nodemon)
    npm run dev

    # Production
    npm start
    ```

5.  Open your browser at `http://localhost:3000`.

## API Documentation

Base URL: `http://localhost:3000`

### 1. Create or Update Link (`POST /api/links`)
Create a new short link or update an existing one if the `customAlias` matches.

**Request Body (JSON):**
| Field | Type | Required | Description |
|---|---|---|---|
| `originalUrl` | String | Yes | The destination URL (e.g., `https://google.com`). |
| `customAlias` | String | No | Custom short code (e.g., `goo`). If it exists, the URL is updated. |

**Example:**
```json
{
  "originalUrl": "https://www.github.com",
  "customAlias": "git"
}
```

### 2. Get All Links (`GET /api/links`)
Retrieve a list of all created short links.

### 3. Toggle Link Status (`PUT /api/links/:id/toggle`)
Enable or disable a link.

### 4. Redirect (`GET /:code`)
Access the short link. This renders an HTML intermediate page before redirecting.

---
Built with ❤️ using Node.js & MongoDB.
