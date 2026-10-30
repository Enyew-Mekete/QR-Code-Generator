import QRCode from 'qrcode';
import { QRCodeStyling } from '../types';

export const QRGeneratorService = {
  /**
   * Generates a base QR Data URL using the qrcode library
   */
  async generateBasicDataUrl(text: string, styling: QRCodeStyling): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: styling.size || 300,
        margin: 2,
        color: {
          dark: styling.fgColor || '#1e3a2b',
          light: styling.bgColor || '#ffffff',
        },
        errorCorrectionLevel: 'H', // High error correction so logos can be placed in center without breaking scan
      });
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate basic QR Code', err);
      return '';
    }
  },

  /**
   * Generates SVG string
   */
  async generateSvgString(text: string, styling: QRCodeStyling): Promise<string> {
    try {
      const svg = await QRCode.toString(text, {
        type: 'svg',
        width: styling.size || 300,
        margin: 2,
        color: {
          dark: styling.fgColor || '#1e3a2b',
          light: styling.bgColor || '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      return svg;
    } catch (err) {
      console.error('Failed to generate SVG QR Code', err);
      return '';
    }
  },

  /**
   * Generates a fully composed branded QR image with optional frame, text badge, and center logo
   */
  async generateBrandedCanvas(
    text: string,
    styling: QRCodeStyling,
    options?: {
      restaurantName?: string;
      tableLabel?: string;
      logoSrc?: string;
    }
  ): Promise<string> {
    return new Promise(async (resolve) => {
      try {
        const rawQrDataUrl = await this.generateBasicDataUrl(text, styling);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(rawQrDataUrl);
        }

        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.onload = () => {
          const qrSize = styling.size || 320;
          const hasFrame = styling.frameStyle !== 'none';
          const topExtra = styling.frameStyle === 'badge-top' || styling.frameStyle === 'table-card' ? 70 : 0;
          const bottomExtra = styling.frameStyle === 'scan-me' || styling.frameStyle === 'table-card' ? 65 : 0;

          const totalWidth = qrSize + (hasFrame ? 48 : 0);
          const totalHeight = qrSize + topExtra + bottomExtra + (hasFrame ? 40 : 0);

          canvas.width = totalWidth;
          canvas.height = totalHeight;

          // Background
          ctx.fillStyle = styling.bgColor || '#ffffff';
          ctx.fillRect(0, 0, totalWidth, totalHeight);

          // Card or border styling
          if (hasFrame) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = styling.fgColor || '#1e3a2b';
            ctx.beginPath();
            ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
            ctx.stroke();

            // Top Header if applicable
            if (topExtra > 0) {
              ctx.fillStyle = styling.fgColor || '#1e3a2b';
              ctx.beginPath();
              ctx.roundRect(8, 8, totalWidth - 16, 52, [18, 18, 0, 0]);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                (styling.frameText || options?.tableLabel || options?.restaurantName || 'SCAN TO ORDER').toUpperCase(),
                totalWidth / 2,
                34
              );
            }
          }

          // Draw QR Code
          const qrX = (totalWidth - qrSize) / 2;
          const qrY = (hasFrame && topExtra > 0 ? topExtra + 12 : hasFrame ? 20 : 0);
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Bottom Call To Action Banner if scan-me
          if (styling.frameStyle === 'scan-me' || (styling.frameStyle === 'table-card' && bottomExtra > 0)) {
            const bannerY = qrY + qrSize + 8;
            ctx.fillStyle = styling.fgColor || '#1e3a2b';
            ctx.beginPath();
            ctx.roundRect(24, bannerY, totalWidth - 48, 44, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              (styling.frameText || 'SCAN TO VIEW MENU & ORDER').toUpperCase(),
              totalWidth / 2,
              bannerY + 22
            );
          }

          // Center Logo if enabled
          if (styling.logoInCenter) {
            const logoPercent = (styling.logoSizePercent || 22) / 100;
            const logoSize = qrSize * logoPercent;
            const logoX = qrX + (qrSize - logoSize) / 2;
            const logoY = qrY + (qrSize - logoSize) / 2;

            // White rounded backing badge
            ctx.fillStyle = styling.bgColor || '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow

            // Outer ring
            ctx.strokeStyle = styling.fgColor || '#1e3a2b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();

            const targetLogoSrc = styling.customLogoUrl || options?.logoSrc;
            if (targetLogoSrc) {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              logoImg.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                ctx.restore();
                resolve(canvas.toDataURL('image/png'));
              };
              logoImg.onerror = () => {
                drawDefaultCenterIcon(ctx, logoX, logoY, logoSize, styling.fgColor);
                resolve(canvas.toDataURL('image/png'));
              };
              logoImg.src = targetLogoSrc;
              return;
            } else {
              drawDefaultCenterIcon(ctx, logoX, logoY, logoSize, styling.fgColor);
            }
          }

          resolve(canvas.toDataURL('image/png'));
        };

        qrImg.onerror = () => {
          resolve(rawQrDataUrl);
        };

        qrImg.src = rawQrDataUrl;
      } catch (err) {
        console.error('Failed branded canvas creation', err);
        resolve('');
      }
    });
  },

  /**
   * Triggers a browser download of the QR code image
   */
  downloadImage(dataUrl: string, filename: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

function drawDefaultCenterIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.fillStyle = color || '#1e3a2b';
  // Draw sleek restaurant fork & spoon silhouette
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  // Center badge fill
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // White icon inside
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.44)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍽️', cx, cy + 1);
}
