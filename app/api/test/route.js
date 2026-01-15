import { NextResponse } from 'next/server';

export async function GET(request) {
  const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5h/wYAAAAASUVORK5CYII=';

  try {
    console.log('Starting test...');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('CLOUDINARY_UPLOAD_PRESET:', process.env.CLOUDINARY_UPLOAD_PRESET);
    
    const params = new URLSearchParams();
    params.append('file', testPhoto);
    params.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
    
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );
    
    const cloudinaryData = await cloudinaryResponse.json();

    return NextResponse.json({
      message: 'Test completed',
      cloudinaryResult: cloudinaryData,
      envVars: {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasUploadPreset: !!process.env.CLOUDINARY_UPLOAD_PRESET,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
