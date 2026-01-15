'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Get roofer ID from URL
  const [rooferId, setRooferId] = useState(null);
  const [rooferInfo, setRooferInfo] = useState({
    company_name: 'Roofing Company',
    company_logo: '',
    company_phone: '(555) 123-4567',
    company_email: 'info@roofing.com'
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    setRooferId(id);
    
    // TODO: Fetch roofer info from database based on ID
    // For now, using default values
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    propertyAddress: '',
    cityStateZip: '',
    inspectionDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    roofType: '',
    roofAge: '',
    roofMaterial: '',
    roofSize: '',
    condition: '',
    findings: {
      shingles: { checked: false, notes: '' },
      flashing: { checked: false, notes: '' },
      gutters: { checked: false, notes: '' },
      vents: { checked: false, notes: '' },
      decking: { checked: false, notes: '' }
    },
    photos: [],
    damageAssessment: '',
    recommendation: '',
    estimateLow: '',
    estimateHigh: '',
    nextSteps: '',
    sendToHomeowner: true,
    homeownerPhone: ''
  });

  const totalScreens = 6;
  const screenLabels = ['Customer Info', 'Roof Details', 'Condition', 'Photos', 'Assessment', 'Review'];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFinding = (area, field, value) => {
    setFormData(prev => ({
      ...prev,
      findings: {
        ...prev.findings,
        [area]: { ...prev.findings[area], [field]: value }
      }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 6) {
      alert('Maximum 6 photos allowed');
      return;
    }

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, {
            file: file,
            preview: event.target.result,
            caption: ''
          }]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        rooferId: rooferId,
        rooferInfo: rooferInfo
      };

      // Call our API endpoint
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      
      if (result.success) {
        setReportData(result);
        setIsSuccess(true);
        setCurrentScreen(7);
      } else {
        alert('Error generating report: ' + result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextScreen = () => {
    if (currentScreen === 6) {
      handleSubmit();
    } else {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const prevScreen = () => {
    setCurrentScreen(prev => prev - 1);
  };

  const resetForm = () => {
    setCurrentScreen(1);
    setIsSuccess(false);
    setFormData({
      customerName: '',
      propertyAddress: '',
      cityStateZip: '',
      inspectionDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      roofType: '',
      roofAge: '',
      roofMaterial: '',
      roofSize: '',
      condition: '',
      findings: {
        shingles: { checked: false, notes: '' },
        flashing: { checked: false, notes: '' },
        gutters: { checked: false, notes: '' },
        vents: { checked: false, notes: '' },
        decking: { checked: false, notes: '' }
      },
      photos: [],
      damageAssessment: '',
      recommendation: '',
      estimateLow: '',
      estimateHigh: '',
      nextSteps: '',
      sendToHomeowner: true,
      homeownerPhone: ''
    });
  };

  return (
    <div className="container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Generating report...</div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="company-logo">
          {rooferInfo.company_logo ? (
            <img src={rooferInfo.company_logo} alt="Logo" />
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a5f' }}>
              {rooferInfo.company_name.substring(0, 10)}
            </span>
          )}
        </div>
        <div className="company-name">{rooferInfo.company_name}</div>
        <div className="header-subtitle">Roof Inspection Report</div>
      </div>

      {/* Progress Bar */}
      {currentScreen <= 6 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentScreen / totalScreens) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>Step {currentScreen} of {totalScreens}</span>
            <span>{screenLabels[currentScreen - 1]}</span>
          </div>
        </div>
      )}

      {/* Screen 1: Customer Info */}
      <div className={`screen ${currentScreen === 1 ? 'active' : ''}`}>
        <h2 className="section-title">Customer Info</h2>
        <p className="section-subtitle">Enter the homeowner's information</p>
        
        <div className="form-group">
          <label className="form-label">Customer Name *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="John Smith"
            value={formData.customerName}
            onChange={(e) => updateFormData('customerName', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Property Address *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="123 Main Street"
            value={formData.propertyAddress}
            onChange={(e) => updateFormData('propertyAddress', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">City, State, ZIP *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Dallas, TX 75201"
            value={formData.cityStateZip}
            onChange={(e) => updateFormData('cityStateZip', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Inspection Date</label>
          <input 
            type="text" 
            className="form-input" 
            value={formData.inspectionDate}
            readOnly
            style={{ background: '#f5f5f5' }}
          />
        </div>
      </div>

      {/* Screen 2: Roof Details */}
      <div className={`screen ${currentScreen === 2 ? 'active' : ''}`}>
        <h2 className="section-title">Roof Details</h2>
        <p className="section-subtitle">Basic information about the roof</p>
        
        <div className="form-group">
          <label className="form-label">Roof Type</label>
          <select 
            className="form-select"
            value={formData.roofType}
            onChange={(e) => updateFormData('roofType', e.target.value)}
          >
            <option value="">Select type...</option>
            <option value="Gable">Gable</option>
            <option value="Hip">Hip</option>
            <option value="Flat">Flat</option>
            <option value="Mansard">Mansard</option>
            <option value="Gambrel">Gambrel</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Approximate Age</label>
          <select 
            className="form-select"
            value={formData.roofAge}
            onChange={(e) => updateFormData('roofAge', e.target.value)}
          >
            <option value="">Select age...</option>
            <option value="0-5 years">0-5 years</option>
            <option value="5-10 years">5-10 years</option>
            <option value="10-15 years">10-15 years</option>
            <option value="15-20 years">15-20 years</option>
            <option value="20+ years">20+ years</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Material</label>
          <select 
            className="form-select"
            value={formData.roofMaterial}
            onChange={(e) => updateFormData('roofMaterial', e.target.value)}
          >
            <option value="">Select material...</option>
            <option value="3-Tab Shingles">3-Tab Shingles</option>
            <option value="Architectural Shingles">Architectural Shingles</option>
            <option value="Metal">Metal</option>
            <option value="Tile">Tile</option>
            <option value="Slate">Slate</option>
            <option value="Wood Shake">Wood Shake</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Approximate Size (sq ft)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="2,500"
            value={formData.roofSize}
            onChange={(e) => updateFormData('roofSize', e.target.value)}
          />
        </div>
      </div>

      {/* Screen 3: Condition */}
      <div className={`screen ${currentScreen === 3 ? 'active' : ''}`}>
        <h2 className="section-title">Condition & Findings</h2>
        <p className="section-subtitle">Rate the overall condition and note issues</p>
        
        <div className="form-group">
          <label className="form-label">Overall Condition</label>
          <div className="rating-options">
            {['Good', 'Fair', 'Poor', 'Critical'].map((rating) => (
              <div 
                key={rating}
                className={`rating-option ${rating.toLowerCase()} ${formData.condition === rating ? 'selected' : ''}`}
                onClick={() => updateFormData('condition', rating)}
              >
                <div className="rating-icon">
                  {rating === 'Good' && '✓'}
                  {rating === 'Fair' && '!'}
                  {rating === 'Poor' && '⚠'}
                  {rating === 'Critical' && '✕'}
                </div>
                <div className="rating-label">{rating}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Inspection Findings</label>
          
          {Object.entries(formData.findings).map(([area, data]) => (
            <div key={area} className={`checklist-item ${data.checked ? 'expanded' : ''}`}>
              <div 
                className="checklist-header"
                onClick={() => updateFinding(area, 'checked', !data.checked)}
              >
                <div className={`checklist-checkbox ${data.checked ? 'checked' : ''}`}>
                  {data.checked && '✓'}
                </div>
                <div className="checklist-title">
                  {area.charAt(0).toUpperCase() + area.slice(1)}
                </div>
                <div className="checklist-expand">▼</div>
              </div>
              {data.checked && (
                <div className="checklist-notes" style={{ display: 'block' }}>
                  <textarea
                    className="form-textarea"
                    placeholder={`Notes about ${area}...`}
                    value={data.notes}
                    onChange={(e) => updateFinding(area, 'notes', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Screen 4: Photos */}
      <div className={`screen ${currentScreen === 4 ? 'active' : ''}`}>
        <h2 className="section-title">Photos</h2>
        <p className="section-subtitle">Upload photos of the roof (tap to add)</p>
        
        <div className="photo-grid">
          {formData.photos.map((photo, index) => (
            <div key={index} className="photo-slot filled">
              <img src={photo.preview} alt={`Photo ${index + 1}`} />
              <button 
                className="remove-photo"
                onClick={() => removePhoto(index)}
              >
                ×
              </button>
            </div>
          ))}
          
          {formData.photos.length < 6 && (
            <label className="photo-slot">
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <div className="photo-icon">📷</div>
              <div className="photo-text">Add Photo</div>
            </label>
          )}
        </div>
        
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#666', textAlign: 'center' }}>
          {formData.photos.length}/6 photos added
        </p>
      </div>

      {/* Screen 5: Assessment */}
      <div className={`screen ${currentScreen === 5 ? 'active' : ''}`}>
        <h2 className="section-title">Assessment</h2>
        <p className="section-subtitle">Your professional recommendation</p>
        
        <div className="form-group">
          <label className="form-label">Damage Assessment</label>
          <textarea 
            className="form-textarea"
            style={{ minHeight: '120px' }}
            placeholder="Describe the damage and issues found..."
            value={formData.damageAssessment}
            onChange={(e) => updateFormData('damageAssessment', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Recommendation</label>
          <div className="recommendation-toggle">
            <div 
              className={`recommendation-option ${formData.recommendation === 'Repair' ? 'selected' : ''}`}
              onClick={() => updateFormData('recommendation', 'Repair')}
            >
              <div className="recommendation-icon">🔧</div>
              <div className="recommendation-label">Repair</div>
            </div>
            <div 
              className={`recommendation-option ${formData.recommendation === 'Replace' ? 'selected' : ''}`}
              onClick={() => updateFormData('recommendation', 'Replace')}
            >
              <div className="recommendation-icon">🏠</div>
              <div className="recommendation-label">Replace</div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Estimate Range</label>
          <div className="estimate-range">
            <div className="estimate-input">
              <span>$</span>
              <input 
                type="text" 
                placeholder="8,500"
                value={formData.estimateLow}
                onChange={(e) => updateFormData('estimateLow', e.target.value)}
              />
            </div>
            <span className="estimate-separator">to</span>
            <div className="estimate-input">
              <span>$</span>
              <input 
                type="text" 
                placeholder="12,000"
                value={formData.estimateHigh}
                onChange={(e) => updateFormData('estimateHigh', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Next Steps for Homeowner</label>
          <textarea 
            className="form-textarea"
            placeholder="What should the homeowner do next?"
            value={formData.nextSteps}
            onChange={(e) => updateFormData('nextSteps', e.target.value)}
          />
        </div>
      </div>

      {/* Screen 6: Review */}
      <div className={`screen ${currentScreen === 6 ? 'active' : ''}`}>
        <h2 className="section-title">Review & Submit</h2>
        <p className="section-subtitle">Confirm the inspection details</p>
        
        <div className="summary-card">
          <div className="summary-card-title">Customer</div>
          <div className="summary-card-content">
            {formData.customerName}<br />
            {formData.propertyAddress}<br />
            {formData.cityStateZip}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-title">Roof Details</div>
          <div className="summary-card-content">
            {formData.roofType} • {formData.roofMaterial}<br />
            {formData.roofAge} • {formData.roofSize} sq ft
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-title">Condition</div>
          <div className="summary-card-content">
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: formData.condition === 'Good' ? '#e8f5e9' : 
                         formData.condition === 'Fair' ? '#fff8e1' :
                         formData.condition === 'Poor' ? '#fff3e0' : '#ffebee',
              color: formData.condition === 'Good' ? '#2e7d32' : 
                    formData.condition === 'Fair' ? '#f57c00' :
                    formData.condition === 'Poor' ? '#e65100' : '#c62828'
            }}>
              {formData.condition}
            </span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-title">Recommendation</div>
          <div className="summary-card-content">
            <strong>{formData.recommendation}</strong> • ${formData.estimateLow} - ${formData.estimateHigh}
          </div>
        </div>
        
        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Send report to homeowner?</label>
          <div className="rating-options" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div 
              className={`rating-option ${formData.sendToHomeowner ? 'selected' : ''}`}
              onClick={() => updateFormData('sendToHomeowner', true)}
            >
              <div className="rating-icon">✉️</div>
              <div className="rating-label">Yes, send SMS</div>
            </div>
            <div 
              className={`rating-option ${!formData.sendToHomeowner ? 'selected' : ''}`}
              onClick={() => updateFormData('sendToHomeowner', false)}
            >
              <div className="rating-icon">✕</div>
              <div className="rating-label">No, save only</div>
            </div>
          </div>
        </div>
        
        {formData.sendToHomeowner && (
          <div className="form-group">
            <label className="form-label">Homeowner Phone</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="(555) 123-4567"
              value={formData.homeownerPhone}
              onChange={(e) => updateFormData('homeownerPhone', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Screen 7: Success */}
      <div className={`screen ${currentScreen === 7 ? 'active' : ''}`}>
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Report Sent!</h2>
          <p className="success-message">
            The inspection report has been generated
            {formData.sendToHomeowner && ` and sent to ${formData.customerName}`}.
          </p>
          <div className="success-details">
            <div className="success-detail-row">
              <span className="success-detail-label">Report ID</span>
              <span className="success-detail-value">#{reportData?.reportId || 'N/A'}</span>
            </div>
            {formData.sendToHomeowner && (
              <div className="success-detail-row">
                <span className="success-detail-label">Sent to</span>
                <span className="success-detail-value">{formData.homeownerPhone}</span>
              </div>
            )}
            <div className="success-detail-row">
              <span className="success-detail-label">PDF Link</span>
              <span className="success-detail-value">
                <a href={reportData?.pdfUrl} target="_blank" style={{ color: '#2d5a87' }}>
                  View Report →
                </a>
              </span>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '24px', width: '100%' }}
            onClick={resetForm}
          >
            Start New Inspection
          </button>
        </div>
      </div>

      {/* Navigation */}
      {currentScreen <= 6 && (
        <div className="nav-buttons">
          {currentScreen > 1 && (
            <button className="btn btn-secondary" onClick={prevScreen}>
              ← Back
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={nextScreen}
            disabled={isLoading}
          >
            {currentScreen === 6 ? 'Submit ✓' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
