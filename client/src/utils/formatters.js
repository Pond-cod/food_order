/**
 * ฟอร์แมตวันที่และเวลาเป็นภาษาไทย
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${hours}:${mins} น.`;
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * ฟอร์แมตตัวเลขราคา
 */
export function formatCurrency(num) {
  const val = Number(num) || 0;
  return `฿${val.toLocaleString()}`;
}

/**
 * ป้องกัน XSS
 */
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
