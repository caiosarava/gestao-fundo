import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const downloadUrl = await uploadFileToDrive(
      buffer,
      file.name,
      file.type || 'application/octet-stream'
    );

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      name: file.name,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro no upload do arquivo' },
      { status: 500 }
    );
  }
}