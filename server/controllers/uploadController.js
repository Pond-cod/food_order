const { uploadImageToDrive } = require('../services/driveService');

/**
 * POST /api/upload
 * อัปโหลดรูปภาพ Base64 ไปยังโฟลเดอร์ Google Drive 1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR
 */
async function uploadImage(req, res, next) {
  try {
    const { imageBase64, fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        status: 'error',
        message: 'กรุณาส่งข้อมูลรูปภาพ (imageBase64)',
      });
    }

    const imageUrl = await uploadImageToDrive(imageBase64, fileName || 'menu_image.jpg');

    res.json({
      status: 'success',
      imageUrl,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadImage,
};
