const fs = require('fs');
const { PNG } = require('pngjs');

// 1. Read the input image
fs.createReadStream('assets/kivquo-logo.png')
  .pipe(new PNG())
  .on('parsed', function() {
    const src = this;
    
    // 2. Find bounding box of letters (ignore right border > 940)
    let minX = src.width, maxX = 0, minY = src.height, maxY = 0;
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        if (x > 940) continue;
        const idx = (src.width * y + x) << 2;
        const r = src.data[idx];
        const g = src.data[idx+1];
        const b = src.data[idx+2];
        
        const isDark = (r < 120 && g < 120 && b < 120);
        const isYellow = (r > 180 && g > 130 && (r - b > 35));
        
        if (isDark || isYellow) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    console.log('Bounding Box:', { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });
    
    const pad = 8;
    const cropX1 = Math.max(0, minX - pad);
    const cropX2 = Math.min(src.width - 1, maxX + pad);
    const cropY1 = Math.max(0, minY - pad);
    const cropY2 = Math.min(src.height - 1, maxY + pad);
    
    const outWidth = cropX2 - cropX1 + 1;
    const outHeight = cropY2 - cropY1 + 1;
    
    const out = new PNG({ width: outWidth, height: outHeight });
    
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        const srcX = cropX1 + x;
        const srcY = cropY1 + y;
        const srcIdx = (src.width * srcY + srcX) << 2;
        const outIdx = (outWidth * y + x) << 2;
        
        const r = src.data[srcIdx];
        const g = src.data[srcIdx+1];
        const b = src.data[srcIdx+2];
        
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const isYellow = (r > 170 && g > 120 && (r - b > 35));
        
        if (isYellow) {
          // Yellow accent on Q
          // Foreground yellow is approx [248, 196, 40]
          // The difference (252 - b) determines alpha
          const alphaFactor = Math.min(1, Math.max(0, (250 - b) / 160));
          const alpha = Math.round(alphaFactor * 255);
          
          out.data[outIdx] = r;
          out.data[outIdx+1] = g;
          out.data[outIdx+2] = b;
          out.data[outIdx+3] = alpha > 15 ? alpha : 0;
        } else {
          // Black / Dark text with antialiasing
          // Background is lum >= 244
          // Black text is lum <= 30
          if (lum >= 244) {
            // Completely transparent background
            out.data[outIdx] = 0;
            out.data[outIdx+1] = 0;
            out.data[outIdx+2] = 0;
            out.data[outIdx+3] = 0;
          } else if (lum <= 32) {
            // Pure opaque black text
            out.data[outIdx] = 18;
            out.data[outIdx+1] = 18;
            out.data[outIdx+2] = 18;
            out.data[outIdx+3] = 255;
          } else {
            // Edge antialiasing: map lum 32..244 to alpha 255..0
            const alphaFactor = (244 - lum) / (244 - 32);
            const alpha = Math.round(Math.min(1, Math.max(0, alphaFactor)) * 255);
            
            // Defringe: set color to dark black so no white halo appears
            out.data[outIdx] = 18;
            out.data[outIdx+1] = 18;
            out.data[outIdx+2] = 18;
            out.data[outIdx+3] = alpha;
          }
        }
      }
    }
    
    // Write out the processed transparent PNG
    out.pack()
      .pipe(fs.createWriteStream('assets/kivquo-logo-transparent.png'))
      .on('finish', () => {
        console.log('Successfully wrote assets/kivquo-logo-transparent.png');
        console.log('Size:', outWidth, 'x', outHeight);
      });
  });
