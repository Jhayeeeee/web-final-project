// Backend URL sa Render (walang slash sa dulo)
const API_BASE = "https://lostfound-api-n29y.onrender.com";

// Kung buong URL na (Cloudinary), gamitin as-is.
// Kung lumang /uploads/... path, idugtong ang API_BASE.
function imgSrc(url) {
    if (!url) return '';
    return url.startsWith('http') ? url : API_BASE + url;
}