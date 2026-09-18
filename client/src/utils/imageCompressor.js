/**
 * ย่อขนาดภาพผ่าน HTML5 Canvas เพื่อให้ไฟล์มีขนาดเล็ก (~50-80KB) โหลดไวและไม่ติดปัญหาลิมิตไฟล์
 * @param {File} file - ไฟล์รูปภาพจาก input
 * @param {number} maxWidth - ความกว้างสูงสุด
 * @param {number} maxHeight - ความสูงสูงสุด
 * @param {number} quality - คุณภาพของไฟล์ JPEG (0 - 1)
 * @returns {Promise<string>} Base64 Data URL
 */
export function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('ไม่มีไฟล์ที่เลือก'));

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
