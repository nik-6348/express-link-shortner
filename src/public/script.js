const API_URL = '/api/links';

// DOM Elements
const form = document.getElementById('shorten-form');
const tableBody = document.getElementById('links-table-body');
const totalLinksEl = document.getElementById('total-links');
const totalClicksEl = document.getElementById('total-clicks');
const domainPrefixEl = document.getElementById('domain-prefix');
const refreshBtn = document.getElementById('refresh-btn');
const toast = document.getElementById('toast');
const logoutBtn = document.getElementById('logout-btn');

// --- AUTHENTICATION ---
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function checkAuth(res) {
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}
// -----------------------

// Set domain prefix
domainPrefixEl.textContent = window.location.host + '/';

// Fetch and Display Links
async function fetchLinks() {
    try {
        const res = await fetch(API_URL, { headers: getHeaders() });
        if (!checkAuth(res)) return;

        const data = await res.json();

        if (data.success) {
            renderTable(data.data);
            updateStats(data.data);
        }
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

function renderTable(links) {
    tableBody.innerHTML = '';

    if (links.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No links found. Create one!</td></tr>';
        return;
    }

    links.forEach(link => {
        const fullShortUrl = `${window.location.protocol}//${window.location.host}/${link.shortCode}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="short-link-cell">
                <div style="display:flex; align-items:center; gap:0.5rem">
                     ${link.favicon ? `<img src="${link.favicon}" style="width:20px; height:20px; border-radius:4px" onerror="this.style.display='none'">` : ''}
                     <a href="${fullShortUrl}" target="_blank">${link.shortCode}</a>
                </div>
                <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                <button class="btn-action" onclick="copyToClipboard('${fullShortUrl}')" title="Copy">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button class="btn-action" onclick="generateQR('${fullShortUrl}')" title="QR Code">
                     <i class="fa-solid fa-qrcode"></i>
                </button>
                </div>
            </td>
            <td class="dest-cell" title="${link.originalUrl}">
                <div>${link.originalUrl}</div>
                <div style="font-size:0.8em; color:var(--text-secondary); margin-top:0.25rem;">
                    <i class="fa-solid fa-heading"></i> ${link.title || 'No Title'}
                </div>
            </td>
            <td>${link.clicks}</td>
            <td>
                <span class="status-badge ${link.isActive ? 'status-active' : 'status-inactive'}">
                    ${link.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn-action" onclick="editLink('${link.shortCode}', '${link.originalUrl}', '${link.title || ''}', '${link.favicon || ''}')" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action" onclick="toggleStatus('${link._id}')" title="Toggle Status">
                    <i class="fa-solid ${link.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateStats(links) {
    totalLinksEl.textContent = links.length;
    const clicks = links.reduce((acc, curr) => acc + curr.clicks, 0);
    totalClicksEl.textContent = clicks;
}

// Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalUrl = document.getElementById('originalUrl').value;
    const customAlias = document.getElementById('customAlias').value;
    const title = document.getElementById('customTitle').value;
    const favicon = document.getElementById('customFavicon').value;

    try {
        const body = { originalUrl, customAlias };
        if (title) body.title = title;
        if (favicon) body.favicon = favicon;

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!checkAuth(res)) return;

        const data = await res.json();

        if (data.success) {
            showToast(data.message || 'Link processed successfully!');
            form.reset();
            // Reset hidden fields toggling if needed, or just clear values
            fetchLinks();
        } else {
            showToast(data.message || 'Error occurred', true);
        }
    } catch (error) {
        showToast('Network error', true);
    }
});

// Actions
window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
};

window.toggleStatus = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}/toggle`, { method: 'PUT', headers: getHeaders() });
        if (!checkAuth(res)) return;
        fetchLinks();
        showToast('Status updated');
    } catch (error) {
        console.error(error);
    }
};

window.editLink = (shortCode, originalUrl, title, favicon) => {
    document.getElementById('originalUrl').value = originalUrl;
    document.getElementById('customAlias').value = shortCode;

    // Expand advanced fields if they exist
    document.getElementById('customTitle').value = title;
    document.getElementById('customFavicon').value = favicon;

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    showToast('Loaded into form for editing');
};

window.generateQR = (url) => {
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
    window.open(qrApi, '_blank');
};

function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.borderColor = isError ? 'var(--danger-color)' : 'var(--success-color)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initial Load
fetchLinks();
refreshBtn.addEventListener('click', fetchLinks);
