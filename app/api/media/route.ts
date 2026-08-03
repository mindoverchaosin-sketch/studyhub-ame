import { NextResponse } from 'next/server';
import { requirePermission } from '@/auth';
import { LocalMediaProvider } from '@/services/media/local-media-provider';
import { MediaLibraryService } from '@/server/services/media/media-library.service';
import { withRequestLogging } from '@/lib/request-logger';

const provider = new LocalMediaProvider();
const service = new MediaLibraryService(provider);

function createMediaErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Media upload failed.' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Media upload failed.' }, { status: 500 });
}

export async function GET(request: Request) {
  return withRequestLogging(request, 'media.listAssets', async () => {
    try {
      await requirePermission('manageResources');
      const assets = await provider.list();
      return NextResponse.json({ assets });
    } catch (error) {
      return createMediaErrorResponse(error);
    }
  })
}

export async function POST(request: Request) {
  return withRequestLogging(request, 'media.uploadAsset', async () => {
    try {
      await requirePermission('manageResources');
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const asset = await service.uploadAsset(file, { uploadedBy: 'editor' });
      return NextResponse.json({ asset });
    } catch (error) {
      return createMediaErrorResponse(error);
    }
  })
}
