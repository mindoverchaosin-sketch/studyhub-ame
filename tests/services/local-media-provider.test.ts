import { beforeEach, describe, expect, it } from 'vitest'
import { LocalMediaProvider } from '@/services/media/local-media-provider'
import type { MediaAsset } from '@/types/media'

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    name: 'doc.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 3,
    uploadedAt: new Date('2026-08-25T00:00:00.000Z').toISOString(),
    uploadedBy: 'editor-1',
    storageKey: 'media/doc.pdf',
    url: '/media/media/doc.pdf',
    ...overrides,
  }
}

describe('local media provider', () => {
  let provider: LocalMediaProvider

  beforeEach(async () => {
    provider = new LocalMediaProvider()
    await provider.create(asset())
    await provider.storeBytes('/media/media/doc.pdf', new Uint8Array([1, 2, 3]), 'application/pdf')
  })

  it('round-trips stored bytes through getObject', async () => {
    const object = await provider.getObject('/media/media/doc.pdf')

    expect(object?.mimeType).toBe('application/pdf')
    expect(Array.from(object?.body ?? [])).toEqual([1, 2, 3])
  })

  it('evicts the previous byte entry when an update re-keys the asset', async () => {
    await provider.update('asset-1', {
      storageKey: 'media/renamed.pdf',
      url: '/media/media/renamed.pdf',
    })

    expect(await provider.getObject('/media/media/doc.pdf')).toBeNull()

    await provider.storeBytes('/media/media/renamed.pdf', new Uint8Array([9]), 'application/pdf')
    const object = await provider.getObject('/media/media/renamed.pdf')
    expect(object?.mimeType).toBe('application/pdf')
  })

  it('keeps bytes reachable for metadata-only updates', async () => {
    await provider.update('asset-1', { name: 'renamed' })

    expect(await provider.getObject('/media/media/doc.pdf')).not.toBeNull()
  })

  it('supports deleteObject for superseded storage cleanup', async () => {
    await provider.deleteObject('/media/media/doc.pdf')

    expect(await provider.getObject('/media/media/doc.pdf')).toBeNull()
  })
})
