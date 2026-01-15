import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Generate a report ID
    const reportId = `INS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Prepare findings for PDF
    const findings = [];
    if (data.findings) {
      for (const [area, info] of Object.entries(data.findings)) {
        if (info.checked) {
          findings.push({
            area: area.charAt(0).toUpperCase() + area.slice(1),
            status: info.notes ? 'Issue Found' : 'OK',
            status_class: info.notes ? 'issue' : 'ok',
            notes: info.notes || 'No issues found'
          });
        }
      }
    }

    // Upload photos to Cloudinary and get URLs
    const photoUrls = [];
    if (data.photos && data.photos.length > 0) {
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        if (photo.preview) {
          try {
            console.log(`Uploading photo ${i + 1}, preview length: ${photo.preview.length}`);
            
            // Use form-urlencoded for Cloudinary
            const params = new URLSearchParams();
            params.append('file', photo.preview);
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
            
            if (cloudinaryData.secure_url) {
              console.log(`Photo ${i + 1} uploaded:`, cloudinaryData.secure_url);
              photoUrls.push({
                url: cloudinaryData.secure_url,
                caption: photo.caption || `Photo ${i + 1}`
              });
            } else {
              console.error('Cloudinary error:', JSON.stringify(cloudinaryData));
            }
          } catch (uploadError) {
            console.error('Photo upload error:', uploadError.message);
          }
        }
      }
    }

    console.log('Total photos uploaded:', photoUrls.length);

    // Prepare PDF data
    const pdfData = {
      company_name: data.rooferInfo?.company_name || 'Roofing Company',
      company_logo: data.rooferInfo?.company_logo || '',
      company_phone: data.rooferInfo?.company_phone || '(555) 123-4567',
      company_phone_raw: (data.rooferInfo?.company_phone || '5551234567').replace(/\D/g, ''),
      company_email: data.rooferInfo?.company_email || 'info@roofing.com',
      company_website: data.rooferInfo?.company_website || '',
      inspection_date: data.inspectionDate,
      customer_name: data.customerName,
      property_address: data.propertyAddress,
      property_city_state_zip: data.cityStateZip,
      report_id: reportId,
      roof_type: data.roofType,
      roof_material: data.roofMaterial,
      roof_age: data.roofAge,
      roof_size: data.roofSize,
      condition_rating: data.condition,
      condition_class: data.condition?.toLowerCase() || 'fair',
      condition_description: getConditionDescription(data.condition),
      findings: findings,
      photos: photoUrls,
      damage_assessment: data.damageAssessment,
      recommendation: data.recommendation,
      estimate_low: data.estimateLow,
      estimate_high: data.estimateHigh,
      next_steps: data.nextSteps,
      generated_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Generate PDF with PDFMonkey
    let pdfUrl = null;
    try {
      const pdfMonkeyResponse = await fetch('https://api.pdfmonkey.io/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document: {
            document_template_id: process.env.PDFMONKEY_TEMPLATE_ID,
            payload: pdfData,
            status: 'pending'
          }
        })
      });

      const pdfResult = await pdfMonkeyResponse.json();
      
      if (pdfResult.document?.id) {
        pdfUrl = await waitForPdf(pdfResult.document.id);
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError.message);
    }

    // Send SMS via GHL if requested
    if (data.sendToHomeowner && data.homeownerPhone && pdfUrl) {
      try {
        await sendSmsViaGhl(
          data.homeownerPhone,
          data.customerName,
          data.rooferInfo?.company_name || 'Roofing Company',
          pdfUrl
        );
      } catch (smsError) {
        console.error('SMS error:', smsError.message);
      }
    }

    return NextResponse.json({
      success: true,
      reportId: reportId,
      pdfUrl: pdfUrl,
      photosUploaded: photoUrls.length
    });

  } catch (error) {
    console.error('API Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getConditionDescription(condition) {
  const descriptions = {
    'Good': 'Roof is in good condition with no immediate concerns',
    'Fair': 'Roof shows moderate wear and requires attention within 6-12 months',
    'Poor': 'Roof has significant issues requiring prompt attention',
    'Critical': 'Roof requires immediate repair or replacement'
  };
  return descriptions[condition] || '';
}

async function waitForPdf(documentId) {
  const maxAttempts = 30;
  const delayMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));

    const response = await fetch(
      `https://api.pdfmonkey.io/api/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}`
        }
      }
    );

    const result = await response.json();

    if (result.document?.status === 'success') {
      return result.document.download_url;
    } else if (result.document?.status === 'failure') {
      throw new Error('PDF generation failed');
    }
  }

  throw new Error('PDF generation timeout');
}

async function sendSmsViaGhl(phone, customerName, companyName, pdfUrl) {
  const message = `Hi ${customerName}, here's your roof inspection report from ${companyName}: ${pdfUrl}`;

  const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify({
      phone: phone,
      name: customerName,
      locationId: process.env.GHL_LOCATION_ID
    })
  });

  const contactData = await contactResponse.json();
  const contactId = contactData.contact?.id;

  if (contactId) {
    await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });
  }
}
