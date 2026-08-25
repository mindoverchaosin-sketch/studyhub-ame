import { beforeEach, describe, expect, it, vi } from 'vitest'

const s3State = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock('@aws-sdk/client-s3', () => {
  const command = (name: string) =>
    class {
      commandName = name
      constructor(public input: Record<string, unknown>) {}
    }
  return {
    S3Client: class {
      send = s3State.send
      constructor(_options: unknown) {}
    },
    ListObjectsV2Command: command('ListObjectsV2Command'),
    HeadObjectCommand: command('HeadObjectCommand'),
    GetObjectCommand: command('GetObjectCommand'),
    PutObjectCommand: command('PutObjectCommand'),
    DeleteObjectCommand: command('DeleteObjectCommand'),
    CopyObjectCommand: command('CopyObjectCommand'),
  }
})

import { S3MediaProvider } from '@/services/media/s3-media-provider'

type StoredObject = { Metadata?: Record<string, string>; ContentType?: string }

const BUCKET = 'aeroprep-media'

function makeProvider(): S3MediaProvider {
  return new S3MediaProvider({
    region: 'us-east-1',
    bucket: BUCKET,
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
  })
}

function notFoundError() {
  const error = new Error('NotFound')
  error.name = 'NotFound'
  return error
}

function seedStorage(objects: Record<string, StoredObject>) {
  s3State.send.mockImplementation(async (command: { commandName: string; input: { Key?: string } }) => {
    switch (command.commandName) {
      case 'ListObjectsV2Command':
        return { Contents: Object.keys(objects).map((Key) => ({ Key, Size: 1 })) }
      case 'HeadObjectCommand': {
        const object = objects[command.input.Key ?? '']
        if (!object) throw notFoundError()
        return {
          Metadata: object.Metadata ?? {},
          ContentType: object.ContentType ?? 'application/pdf',
          ContentLength: 1,
          LastModified: new Date('2026-08-01T00:00:00.000Z'),
        }
      }
      case 'GetObjectCommand': {
        const object = objects[command.input.Key ?? '']
        if (!object) {
          const error = new Error('NoSuchKey')
          error.name = 'NoSuchKey'
          throw error
        }
        return {
          Body: { transformToByteArray: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]) },
          ContentType: object.ContentType ?? 'application/pdf',
        }
      }
      default:
        return {}
    }
  })
}

function commandsSent() {
  return s3State.send.mock.calls.map(([command]) => ({
    name: command.commandName as string,
    input: command.input as Record<string, unknown>,
  }))
}

describe('S3MediaProvider Configuration', () => {
  it('should accept AWS S3 configuration', () => {
    const provider = new S3MediaProvider({
      region: 'us-east-1',
      bucket: 'aeroprep-media',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    })
    expect(provider.configuredEndpoint).toBeUndefined()
  })

  it('should accept Cloudflare R2 configuration', () => {
    const provider = new S3MediaProvider({
      endpoint: 'https://123456789.r2.cloudflarestorage.com',
      region: 'auto',
      bucket: 'aeroprep-media',
      accessKeyId: 'r2-key',
      secretAccessKey: 'r2-secret',
    })
    expect(provider.configuredEndpoint).toBe('https://123456789.r2.cloudflarestorage.com')
  })

  it('should accept MinIO configuration with forcePathStyle', () => {
    const provider = new S3MediaProvider({
      endpoint: 'https://minio.example.com:9000',
      region: 'minio',
      bucket: 'aeroprep-media',
      accessKeyId: 'minio-key',
      secretAccessKey: 'minio-secret',
      forcePathStyle: true,
    })
    expect(provider.configuredEndpoint).toBe('https://minio.example.com:9000')
  })

  it('should accept Backblaze B2 S3 configuration', () => {
    const provider = new S3MediaProvider({
      endpoint: 'https://s3.us-west-001.backblazeb2.com',
      region: 'us-west-001',
      bucket: 'aeroprep-media',
      accessKeyId: 'b2-key',
      secretAccessKey: 'b2-secret',
    })
    expect(provider.configuredEndpoint).toBe('https://s3.us-west-001.backblazeb2.com')
  })
})

describe('S3MediaProvider storage behavior', () => {
  let provider: S3MediaProvider

  beforeEach(() => {
    s3State.send.mockReset()
    provider = makeProvider()
  })

  it('stores bytes to a brand-new key without requiring a prior object', async () => {
    seedStorage({})
    const bytes = new Uint8Array([1, 2, 3])

    await provider.storeBytes('/media/media/new-upload.pdf', bytes, 'application/pdf')

    const sent = commandsSent()
    expect(sent.map((command) => command.name)).toEqual(['HeadObjectCommand', 'PutObjectCommand'])
    const put = sent[1].input as { Key: string; Body: Uint8Array; ContentType: string }
    expect(put.Key).toBe('media/new-upload.pdf')
    expect(put.ContentType).toBe('application/pdf')
    expect(Array.from(put.Body)).toEqual([1, 2, 3])
  })

  it('preserves existing metadata when overwriting an existing key', async () => {
    seedStorage({ 'media/existing.pdf': { Metadata: { id: 'asset-1' }, ContentType: 'application/pdf' } })

    await provider.storeBytes('/media/media/existing.pdf', new Uint8Array([9]), 'application/pdf')

    const put = commandsSent().find((command) => command.name === 'PutObjectCommand')
    expect(put?.input.Metadata).toEqual({ id: 'asset-1' })
  })

  it('persists metadata-only edits via a same-key CopyObject that preserves bytes', async () => {
    seedStorage({
      'media/a.pdf': {
        Metadata: { id: 'asset-1', name: 'old-name', type: 'pdf', uploadedby: 'editor-1' },
        ContentType: 'application/pdf',
      },
    })

    const result = await makeProvider().update('asset-1', { name: 'renamed' })

    expect(result?.name).toBe('renamed')
    const sent = commandsSent()
    const copy = sent.find((command) => command.name === 'CopyObjectCommand')
    expect(copy).toBeDefined()
    expect(copy?.input.CopySource).toBe(`${BUCKET}/media/a.pdf`)
    expect(copy?.input.Key).toBe('media/a.pdf')
    expect(copy?.input.MetadataDirective).toBe('REPLACE')
    expect((copy?.input.Metadata as Record<string, string>).name).toBe('renamed')
    // Metadata-only edits must never delete or re-place the object.
    expect(sent.some((command) => command.name === 'DeleteObjectCommand')).toBe(false)
    expect(sent.some((command) => command.name === 'PutObjectCommand')).toBe(false)
  })

  it('prepares a replacement key without deleting the old object', async () => {
    seedStorage({
      'media/old.pdf': {
        Metadata: { id: 'asset-1', name: 'doc', type: 'pdf', uploadedby: 'editor-1' },
        ContentType: 'application/pdf',
      },
    })

    const result = await makeProvider().update('asset-1', {
      name: 'doc-v2',
      storageKey: 'media/new.pdf',
      mimeType: 'application/pdf',
      url: '/media/media/new.pdf',
    })

    const sent = commandsSent()
    const placeholder = sent.find((command) => command.name === 'PutObjectCommand')
    expect(placeholder).toBeDefined()
    expect(placeholder?.input.Key).toBe('media/new.pdf')
    expect((placeholder?.input.Metadata as Record<string, string>).id).toBe('asset-1')
    // Old object must remain until the replacement bytes are stored.
    expect(sent.some((command) => command.name === 'DeleteObjectCommand')).toBe(false)
    expect(result?.storageKey).toBe('media/new.pdf')
    expect(result?.url).toBe('/media/media/new.pdf')
  })

  it('removes the superseded object only after the replacement bytes are stored', async () => {
    seedStorage({
      'media/old.pdf': {
        Metadata: { id: 'asset-1', name: 'doc', type: 'pdf', uploadedby: 'editor-1' },
        ContentType: 'application/pdf',
      },
    })
    const replacing = makeProvider()

    await replacing.update('asset-1', {
      name: 'doc-v2',
      storageKey: 'media/new.pdf',
      mimeType: 'application/pdf',
      url: '/media/media/new.pdf',
    })
    // Replacement flow stores the new bytes...
    await replacing.storeBytes('/media/media/new.pdf', new Uint8Array([7]), 'application/pdf')
    // ...and only then removes the superseded object.
    await replacing.deleteObject('/media/media/old.pdf')

    const names = commandsSent().map((command) => command.name)
    expect(names.indexOf('PutObjectCommand')).toBeLessThan(names.indexOf('DeleteObjectCommand'))
    const deletion = commandsSent().find((command) => command.name === 'DeleteObjectCommand')
    expect(deletion?.input.Key).toBe('media/old.pdf')
  })

  it('returns null for an unknown asset id without issuing writes', async () => {
    seedStorage({})

    const result = await makeProvider().update('missing-id', { name: 'nope' })

    expect(result).toBeNull()
    expect(commandsSent().some((command) => ['PutObjectCommand', 'CopyObjectCommand', 'DeleteObjectCommand'].includes(command.name))).toBe(false)
  })

  it('deletes an existing asset and reports false for missing ones', async () => {
    seedStorage({
      'media/gone.pdf': {
        Metadata: { id: 'asset-gone', name: 'gone', type: 'pdf', uploadedby: 'editor-1' },
        ContentType: 'application/pdf',
      },
    })
    const deleting = makeProvider()

    await expect(deleting.delete('asset-gone')).resolves.toBe(true)
    const deletion = commandsSent().find((command) => command.name === 'DeleteObjectCommand')
    expect(deletion?.input.Key).toBe('media/gone.pdf')

    s3State.send.mockClear()
    await expect(makeProvider().delete('asset-missing')).resolves.toBe(false)
    expect(s3State.send.mock.calls.some(([command]) => (command as { commandName: string }).commandName === 'DeleteObjectCommand')).toBe(false)
  })

  it('returns null for a missing object and rethrows unexpected storage errors on getObject', async () => {
    seedStorage({})
    const missing = makeProvider()
    await expect(missing.getObject('/media/media/nothing.pdf')).resolves.toBeNull()

    s3State.send.mockImplementation(async (command: { commandName: string }) => {
      if (command.commandName === 'GetObjectCommand') throw new Error('kaboom')
      return {}
    })
    const failing = makeProvider()
    await expect(failing.getObject('/media/media/x.pdf')).rejects.toThrow('kaboom')
  })
})
