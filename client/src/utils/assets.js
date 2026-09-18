/**
 * Universal Fallback Assets (Data URIs)
 * ทำงานได้ 100% แบบ Offline / No Network Dependency
 * ป้องกันปัญหา net::ERR_CONNECTION_CLOSED จากเว็บ Placeholder ภายนอก
 */
export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f1f5f9"/><circle cx="40" cy="30" r="16" fill="%23cbd5e1"/><path d="M16 68c0-13.25 10.75-24 24-24s24 10.75 24 24" fill="%23cbd5e1"/></svg>`;

export const DEFAULT_FOOD_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f8fafc"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="48">🍲</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%2394a3b8" font-family="sans-serif">ไม่มีรูปภาพเมนู</text></svg>`;
