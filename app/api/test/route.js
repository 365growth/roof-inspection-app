import { NextResponse } from 'next/server';

export async function GET(request) {
  // Test photo - a small red square as base64
  const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5h/wYAAAAASUVORK5CYII=';

  const testData = {
    customerName: 'Test Customer',
    propertyAddress: '123 Test Street',
    cityStateZip: 'Dallas, TX 75201',
    inspectionDate: 'January 15, 2026',
    roofType: 'Hip',
    roofAge: '10-15 years',
    roofMaterial: 'Architectural Shingles',
    roofSize: '2500',
    condition: 'Fair',
    findings: {
      shingles: { checked: true, notes: 'Some wear visible' },
      flashing: { checked: true, notes: 'Minor rust' },
      gutters: { checked: false, notes: '' },
      vents: { checked: false, notes: '' },
      decking: { checked: false, notes: '' }
    },
    photos: [
      { preview: testPhoto, caption: 'Test photo 1' }
    ],
    damageAssessment: 'Moderate wear consistent with age',
    recommendation: 'Replace',
    estimateLow: '8500',
    estimateHigh: '12000',
    nextSteps: 'Schedule follow-up appointment',
    sendToHomeowner: false,
    homeownerPhone: '',
    rooferInfo: {
      company_name: 'Test Roofing Co',
      company_phone: '(555) 123-4567',
      company_email: 'test@roofing.com'
    }
  };

  // Now call the generate-report endpoint
  try {
    console.log('Starting test...');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('CLOUDINARY_UPLOAD_PRESET:', process.env.CLOUDINARY_UPLOAD_PRESET);
    
    // Test Cloudinary directly
    console.log('Testing Cloudinary upload...');
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
    console.log('Cloudinary response:', JSON.stringify(cloudinaryData));

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
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
```

5. Commit changes

---

After redeploy, just visit this URL in your browser:
```
https://roof-inspection-app.vercel.app/api/test
