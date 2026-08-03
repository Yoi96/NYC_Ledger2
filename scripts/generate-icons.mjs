import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = './src/assets/images/nyc_ledger_icon_1785774555453.jpg';

const sizes = [48, 72, 96, 144, 192, 512];

const outputDirs = [
  './public/assets/icons',
  './public/icons',
  './assets/icons'
];

outputDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function generateIcons() {
  console.log('Generating PNG icons from:', sourceImage);

  for (const size of sizes) {
    const filename = `icon_${size}.png`;
    const imageBuffer = await sharp(sourceImage)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 100 })
      .toBuffer();

    for (const dir of outputDirs) {
      const targetPath = path.join(dir, filename);
      fs.writeFileSync(targetPath, imageBuffer);
      console.log(`Saved ${targetPath} (${imageBuffer.length} bytes)`);
    }
  }

  // Also create dummy screenshots as valid PNGs so manifest references don't 404
  const screenshotDir = './public/screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const widgetPreview = await sharp({
    create: {
      width: 600,
      height: 400,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  }).png().toBuffer();
  fs.writeFileSync(path.join(screenshotDir, 'widget-preview.png'), widgetPreview);

  const mobilePreview = await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  }).png().toBuffer();
  fs.writeFileSync(path.join(screenshotDir, 'mobile-screen.png'), mobilePreview);

  const desktopPreview = await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  }).png().toBuffer();
  fs.writeFileSync(path.join(screenshotDir, 'desktop-screen.png'), desktopPreview);

  console.log('Successfully generated all icons and screenshots!');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
