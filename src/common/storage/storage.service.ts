import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as URLSafeBase64 from 'urlsafe-base64';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;
  private cdnBaseUrl: string;
  private cdnKeyName: string;
  private cdnPrivateKey: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const keyFilePath = this.configService.get<string>('GCP_KEYFILE_PATH');
    this.bucketName = this.configService.get<string>('GCP_BUCKET_NAME') || '';
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL') || '';
    this.cdnKeyName = this.configService.get<string>('CDN_KEY_NAME') || '';
    this.cdnPrivateKey = this.configService.get<string>('CDN_PRIVATE_KEY') || '';

    this.storage = new Storage({
      projectId,
      keyFilename: keyFilePath,
    });
  }

  /**
   * 파일 업로드
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<{ fileName: string; cdnUrl: string; storageUrl: string }> {
    try {
      const fileName = this.generateFileName(file.originalname, folder);
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
          cacheControl: 'public, max-age=3600',
        },
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error(`Upload error: ${err.message}`);
          reject(err);
        });

        blobStream.on('finish', () => {
          // Generate CDN Signed URL (1 hour expiration)
          const cdnUrl = this.generateSignedUrl(fileName, 60);
          const storageUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

          this.logger.log(`File uploaded: ${fileName}`);
          resolve({ fileName, cdnUrl, storageUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 다중 파일 업로드
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = '',
  ): Promise<Array<{ fileName: string; cdnUrl: string; storageUrl: string }>> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.storage.bucket(this.bucketName).file(fileName).delete();
      this.logger.log(`File deleted: ${fileName}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const [exists] = await this.storage
        .bucket(this.bucketName)
        .file(fileName)
        .exists();
      return exists;
    } catch (error) {
      this.logger.error(`Check file existence failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 파일명 생성 (UUID + 원본 확장자)
   */
  private generateFileName(originalName: string, folder: string): string {
    const ext = originalName.split('.').pop();
    const uniqueName = `${uuidv4()}.${ext}`;
    return folder ? `${folder}/${uniqueName}` : uniqueName;
  }

  /**
   * CDN URL 생성
   */
  getCdnUrl(fileName: string): string {
    return `${this.cdnBaseUrl}/${fileName}`;
  }

  /**
   * CDN Signed URL 생성 (GCP Cloud CDN)
   */
  generateSignedUrl(fileName: string, expirationMinutes: number = 60): string {
    const url = `${this.cdnBaseUrl}/${fileName}`;
    const expiration = Math.round(new Date().getTime() / 1000) + expirationMinutes * 60;
    const decodedKey = URLSafeBase64.decode(this.cdnPrivateKey);

    let urlToSign =
      url +
      (url.indexOf('?') > -1 ? '&' : '?') +
      'Expires=' +
      expiration +
      '&KeyName=' +
      this.cdnKeyName;

    const hmac = crypto.createHmac('sha1', decodedKey);
    const signature = hmac.update(urlToSign).digest();
    const encodedSignature = URLSafeBase64.encode(signature);

    urlToSign += '&Signature=' + encodedSignature;
    return urlToSign;
  }

  /**
   * 파일명 배열을 Signed URL 배열로 변환
   */
  generateSignedUrls(fileNames: string[], expirationMinutes: number = 60): string[] {
    if (!fileNames || fileNames.length === 0) {
      return [];
    }
    return fileNames
      .filter(fileName => fileName && fileName.trim() !== '')
      .map(fileName => this.generateSignedUrl(fileName, expirationMinutes));
  }

  /**
   * 단일 파일명을 Signed URL로 변환 (null-safe)
   */
  generateSignedUrlSafe(fileName: string | null | undefined, expirationMinutes: number = 60): string | undefined {
    if (!fileName || fileName.trim() === '') {
      return undefined;
    }
    return this.generateSignedUrl(fileName, expirationMinutes);
  }
}
