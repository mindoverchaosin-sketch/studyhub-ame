import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { MediaAsset, MediaProvider } from '@/types/media'

type StoredObject = { body: Uint8Array; mimeType: string; redirectPath?: string }

function keyFromPath(path: string): string {
  return path.replace(/^\/media\//, '')
}

function pathFromKey(key: string): string {
  return `/media/${key}`
}

async function bodyToBytes(body: unknown): Promise<Uint8Array> {
  if (body && typeof body === 'object' && 'transformToByteArray' in body && typeof body.transformToByteArray === 'function') {
    return body.transformToByteArray()
  }
  if (body instanceof Uint8Array) return body
  throw new Error('Unsupported S3 response body')
}

export class S3MediaProvider implements MediaProvider {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly endpoint?: string

  constructor(options: { endpoint?: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string; forcePathStyle?: boolean }) {
    this.bucket = options.bucket
    this.endpoint = options.endpoint
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    })
  }

  async list(): Promise<MediaAsset[]> {
    const result = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: 'media/' }))
    const assets: MediaAsset[] = []
    for (const object of result.Contents ?? []) {
      if (!object.Key) continue
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: object.Key }))
      const metadata = head.Metadata ?? {}
      assets.push({
        id: metadata.id ?? object.Key,
        name: metadata.name ?? object.Key.split('/').pop() ?? object.Key,
        type: (metadata.type as MediaAsset['type']) ?? 'document',
        mimeType: head.ContentType ?? 'application/octet-stream',
        size: Number(head.ContentLength ?? object.Size ?? 0),
        uploadedAt: head.LastModified?.toISOString() ?? new Date().toISOString(),
        uploadedBy: metadata.uploadedby ?? 'unknown',
        storageKey: object.Key,
        altText: metadata.alttext,
        url: pathFromKey(object.Key),
      })
    }
    return assets
  }

  async get(id: string): Promise<MediaAsset | null> {
    const assets = await this.list()
    return assets.find((asset) => asset.id === id) ?? null
  }

  async create(asset: MediaAsset): Promise<MediaAsset> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: asset.storageKey,
      Body: new Uint8Array(),
      ContentType: asset.mimeType,
      Metadata: { id: asset.id, name: asset.name, type: asset.type, uploadedby: asset.uploadedBy, ...(asset.altText ? { alttext: asset.altText } : {}) },
    }))
    return asset
  }

  async update(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null> {
    const existing = await this.get(id)
    if (!existing) return null

    const targetKey = updates.storageKey ?? existing.storageKey
    const metadata: Record<string, string> = {
      id: existing.id,
      name: updates.name ?? existing.name,
      type: updates.type ?? existing.type,
      uploadedby: updates.uploadedBy ?? existing.uploadedBy,
    }
    if (updates.altText ?? existing.altText) {
      metadata.alttext = (updates.altText ?? existing.altText) as string
    }
    const contentType = updates.mimeType ?? existing.mimeType

    if (targetKey === existing.storageKey) {
      // Metadata-only edit: a self-copy with REPLACE rewrites the registry
      // while preserving the stored bytes untouched.
      await this.client.send(new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${existing.storageKey}`,
        Key: targetKey,
        MetadataDirective: 'REPLACE',
        ContentType: contentType,
        Metadata: metadata,
      }))
    } else {
      // Replacement: prepare the new object's registry placeholder. Bytes
      // are written by the replacement flow via storeBytes; the superseded
      // object is removed only afterwards, by that flow, on success.
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: targetKey,
        Body: new Uint8Array(),
        ContentType: contentType,
        Metadata: metadata,
      }))
    }

    return { ...existing, ...updates, storageKey: targetKey, url: pathFromKey(targetKey) }
  }

  async delete(id: string): Promise<boolean> {
    const asset = await this.get(id)
    if (!asset) return false
    await this.deleteObject(pathFromKey(asset.storageKey))
    return true
  }

  async storeBytes(path: string, body: Uint8Array, mimeType: string): Promise<void> {
    const key = keyFromPath(path)
    let metadata: Record<string, string> | undefined
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      metadata = head.Metadata
    } catch (error) {
      // Fresh keys have nothing to preserve yet — proceed without metadata.
      const code = (error as { name?: string }).name
      if (code !== 'NotFound' && code !== 'NoSuchKey') throw error
    }
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType, Metadata: metadata }))
  }

  async getObject(path: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: keyFromPath(path) }))
      return { body: await bodyToBytes(result.Body), mimeType: result.ContentType ?? 'application/octet-stream' }
    } catch (error) {
      const code = (error as { name?: string }).name
      if (code === 'NoSuchKey' || code === 'NotFound') return null
      throw error
    }
  }

  get configuredEndpoint(): string | undefined {
    return this.endpoint
  }

  async deleteObject(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: keyFromPath(path) }))
  }
}
