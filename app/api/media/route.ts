import { NextResponse } from 'next/server';
import { LocalMediaProvider } from '@/services/media/local-media-provider';
import { MediaLibraryService } from '@/server/services/media/media-library.service';

const provider = new LocalMediaProvider();
const service = new MediaLibraryService(provider);

export async function GET() {
  const assets = await provider.list();
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const asset = await service.uploadAsset(file, { uploadedBy: 'editor' });
  return NextResponse.json({ asset });
}
