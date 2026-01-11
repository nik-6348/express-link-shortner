# ShortLink API Documentation

Base URL: `http://localhost:3000`

## 1. Create or Update Link (`POST /api/links`)
Create a new short link or update an existing one if the `customAlias` matches.

**Endpoint:** `POST /api/links`

**Request Body (JSON):**
| Field | Type | Required | Description |
|---|---|---|---|
| `originalUrl` | String | Yes | The destination URL (e.g., `https://google.com`). |
| `customAlias` | String | No | Custom short code (e.g., `goo`). If it exists, the URL is updated. |

**Example Request:**
```json
{
  "originalUrl": "https://www.github.com",
  "customAlias": "git"
}
```

**Response (201 Created / 200 OK):**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://www.github.com",
    "shortCode": "git",
    "title": "GitHub: Let's build from here",
    "favicon": "https://github.githubassets.com/favicons/favicon.svg",
    "clicks": 0,
    "isActive": true,
    "_id": "...",
    "createdAt": "..."
  },
  "message": "Link created"
}
```

---

## 2. Get All Links (`GET /api/links`)
Retrieve a list of all created short links, sorted by newest first.

**Endpoint:** `GET /api/links`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "originalUrl": "https://google.com",
      "shortCode": "goo",
      "clicks": 15,
      "title": "Google",
      "favicon": "...",
      "isActive": true
    }
  ]
}
```

---

## 3. Toggle Link Status (`PUT /api/links/:id/toggle`)
Enable or disable a link. Disabled links return a 410 Gone / Error page.

**Endpoint:** `PUT /api/links/:id/toggle`

**Path Parameters:**
*   `id`: The MongoDB `_id` of the link.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "isActive": false 
  }
}
```

---

## 4. Redirect (`GET /:code`)
Access the short link. This renders an HTML intermediate page before redirecting.

**Endpoint:** `GET /:code`

**Behavior:**
*   **Success**: Returns HTML page with "Redirecting..." animation, Target Title, and Icon. Auto-redirects after 2.5s.
*   **Not Found**: Returns 404 HTML page.
*   **Inactive**: Returns 410 "Link is inactive".

**Stats:**
*   Increments `clicks` count.
*   Updates `lastAccessed` timestamp.
