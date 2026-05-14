import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

export interface ReceiptExtraction {
  amount: number | null;
  currency: string | null;
  senderName: string | null;
  receiverName: string | null;
  date: string | null;
  transactionRef: string | null;
  paymentProvider: string | null;
  confidence: number;
  flags: string[];
}

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(private readonly prisma: PrismaService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload receipt image to Cloudinary.
   * Returns the secure URL.
   */
  async uploadReceiptImage(base64Data: string, mimeType: string): Promise<string> {
    try {
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'fanpass/receipts',
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
      return result.secure_url;
    } catch (error: any) {
      this.logger.error('Cloudinary upload failed:', error.message);
      throw new Error('Failed to upload receipt image');
    }
  }

  /**
   * Use Claude AI to extract structured data from a receipt image.
   */
  async extractReceiptData(
    imageBase64: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
    expectedAmount: number,
    expectedCurrency: string = 'ETB',
  ): Promise<ReceiptExtraction> {
    const aiEnabled = process.env.AI_RECEIPT_EXTRACTION !== 'false';

    if (!aiEnabled || !process.env.ANTHROPIC_API_KEY) {
      this.logger.warn('AI extraction disabled or no API key. Returning empty extraction.');
      return {
        amount: null,
        currency: null,
        senderName: null,
        receiverName: null,
        date: null,
        transactionRef: null,
        paymentProvider: null,
        confidence: 0,
        flags: ['ai_disabled'],
      };
    }

    try {
      // Dynamic import to avoid crash when package is not installed
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `You are a payment receipt reader. Extract the following fields from this receipt image and return ONLY valid JSON with no other text:

{
  "amount": <number or null>,
  "currency": "<string or null>",
  "senderName": "<string or null>",
  "receiverName": "<string or null>",
  "date": "<YYYY-MM-DD string or null>",
  "transactionRef": "<string or null>",
  "paymentProvider": "<e.g. Telebirr, CBE Birr, Bank, or null>",
  "confidence": <0.0 to 1.0>,
  "flags": ["<any concerns>"]
}

Expected amount: ${expectedAmount} ${expectedCurrency}.
If the amount in the receipt does not match the expected amount, add "amount mismatch" to flags.
If the receipt date is more than 24 hours ago, add "old receipt" to flags.
If the image appears altered, digitally generated, or the text looks inconsistent, add "possible fake" to flags.
If you cannot read the receipt clearly, set confidence below 0.4.`,
              },
            ],
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        return parsed as ReceiptExtraction;
      } catch {
        this.logger.warn('Failed to parse AI response:', text);
        return {
          amount: null,
          currency: null,
          senderName: null,
          receiverName: null,
          date: null,
          transactionRef: null,
          paymentProvider: null,
          confidence: 0,
          flags: ['parse_error'],
        };
      }
    } catch (error: any) {
      this.logger.error('AI extraction failed:', error.message);
      return {
        amount: null,
        currency: null,
        senderName: null,
        receiverName: null,
        date: null,
        transactionRef: null,
        paymentProvider: null,
        confidence: 0,
        flags: ['ai_error'],
      };
    }
  }

  /**
   * Compute a simple average hash (aHash) of an image using sharp.
   * Returns a hex string representing the hash.
   */
  async computeImageHash(imageBuffer: Buffer): Promise<string> {
    try {
      const sharp = (await import('sharp')).default;
      // Resize to 8x8 greyscale for perceptual hashing
      const pixels = await sharp(imageBuffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();

      // Compute average
      let sum = 0;
      for (let i = 0; i < pixels.length; i++) {
        sum += pixels[i];
      }
      const avg = sum / pixels.length;

      // Build hash: 1 if pixel > avg, 0 otherwise
      let hash = '';
      for (let i = 0; i < pixels.length; i++) {
        hash += pixels[i] > avg ? '1' : '0';
      }

      // Convert binary string to hex
      let hexHash = '';
      for (let i = 0; i < hash.length; i += 4) {
        hexHash += parseInt(hash.substring(i, i + 4), 2).toString(16);
      }

      return hexHash;
    } catch (error: any) {
      this.logger.error('Image hash computation failed:', error.message);
      return '';
    }
  }

  /**
   * Compute Hamming distance between two hex hash strings.
   */
  hammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999;

    // Convert hex to binary
    const bin1 = hash1.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    const bin2 = hash2.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');

    let distance = 0;
    for (let i = 0; i < bin1.length; i++) {
      if (bin1[i] !== bin2[i]) distance++;
    }
    return distance;
  }

  /**
   * Check if a similar image has already been uploaded for any ticket.
   */
  async checkDuplicateImage(imageHash: string): Promise<{ isDuplicate: boolean; matchingTicketId?: string }> {
    if (!imageHash) return { isDuplicate: false };

    const tickets = await this.prisma.ticket.findMany({
      where: {
        imageHash: { not: null },
        verificationStatus: { not: 'REJECTED' },
      },
      select: { id: true, imageHash: true },
    });

    for (const ticket of tickets) {
      if (ticket.imageHash && this.hammingDistance(imageHash, ticket.imageHash) < 10) {
        return { isDuplicate: true, matchingTicketId: ticket.id };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Check if a transaction reference has already been used.
   */
  async checkDuplicateRef(transactionRef: string): Promise<{ isDuplicate: boolean; matchingTicketId?: string }> {
    if (!transactionRef) return { isDuplicate: false };

    const existing = await this.prisma.ticket.findFirst({
      where: {
        extractedRef: transactionRef,
        verificationStatus: { not: 'REJECTED' },
      },
      select: { id: true },
    });

    if (existing) {
      return { isDuplicate: true, matchingTicketId: existing.id };
    }

    return { isDuplicate: false };
  }
}
