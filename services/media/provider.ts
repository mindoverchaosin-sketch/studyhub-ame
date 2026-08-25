import { LocalMediaProvider } from './local-media-provider'
import { S3MediaProvider } from './s3-media-provider'
import { env } from '@/lib/env'

export const mediaProvider = env.MEDIA_STORAGE_PROVIDER === 's3'
	? new S3MediaProvider({
		endpoint: env.S3_ENDPOINT,
		region: env.S3_REGION!,
		bucket: env.S3_BUCKET!,
		accessKeyId: env.S3_ACCESS_KEY_ID!,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
		forcePathStyle: env.S3_FORCE_PATH_STYLE,
	})
	: new LocalMediaProvider()