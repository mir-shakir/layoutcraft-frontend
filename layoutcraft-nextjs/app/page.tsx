'use client';

import './styles/designer.css';
import React, { useState, useEffect } from 'react';
import Dropdown from '../components/Dropdown'; // Import the Dropdown component

// ... (DesignerState interface)
interface DesignerState {
  prompt: string;
  selectedDimensions: string[];
  selectedStyle: string;
  isGenerating: boolean;
  appMode: 'generating' | 'editing';
  generatedDesigns: any[]; // Replace 'any' with a more specific type
  generation_id: string | null;
  selectedForEditing: string[];
}
const DIMENSIONS_DATA = [
        { value: "blog_header", label: "Blog Header (1200x630)" },
        { value: "social_square", label: "Social Post (1080x1080)" },
        { value: "story", label: "Story (1080x1920)" },
        { value: "twitter_post", label: "Twitter Post (1024x512)" },
        { value: "youtube_thumbnail", label: "YouTube Thumbnail (1280x720)" },
    ];
const STYLE_DATA = [
    { value: "auto", label: "✨ Auto" },
    { value: "bold_geometric_solid", label: "Bold Geometric" },
    { value: "minimal_luxury_space", label: "Minimal" },
    { value: "vibrant_gradient_energy", label: "Vibrant" },
    { value: "dark_neon_tech", label: "Neon Tech" },
];


export default function DesignerPage() {
  const [state, setState] = useState<DesignerState>({
    prompt: '',
    selectedDimensions: ['blog_header'],
    selectedStyle: 'auto',
    isGenerating: false,
    appMode: 'generating',
    generatedDesigns: [],
    generation_id: null,
    selectedForEditing: [],
  });
  const PROMPT_MAX_LENGTH = 500;

  useEffect(() => {
    // ... (useEffect logic)
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState({ ...state, prompt: e.target.value });
  };

  const handleSelectionChange = (type: 'dimensions' | 'style', value: string, isSelected: boolean) => {
    if (type === 'dimensions') {
      if (isSelected) {
        setState({ ...state, selectedDimensions: [...state.selectedDimensions, value] });
      } else {
        setState({ ...state, selectedDimensions: state.selectedDimensions.filter(d => d !== value) });
      }
    } else {
      setState({ ...state, selectedStyle: value });
    }
  };

  const handleGenerateClick = () => {
    // Logic to be ported from performAction()
    console.log('Generate clicked');
  };

  const isGenerateButtonDisabled = state.isGenerating || state.prompt.trim().length === 0 || state.selectedDimensions.length === 0;

  return (
    <>
      <div id="app-loader" className="app-loading-overlay" style={{ display: 'none' }}>
        <div className="app-loading-spinner"></div>
      </div>

      <div className="designer-app">
        <main className="designer-main">
          <div className="designer-toolbar">
            <div className="prompt-section">
              <div className="textarea-wrapper">
                <textarea
                  id="prompt-input"
                  className="prompt-field"
                  placeholder="Describe your design idea..."
                  maxLength={PROMPT_MAX_LENGTH}
                  rows={4}
                  value={state.prompt}
                  onChange={handlePromptChange}
                />
                <span className="char-indicator">{state.prompt.length}/{PROMPT_MAX_LENGTH}</span>
              </div>
              <div className="generate-section">
                <div className="controls-wrapper">
                  <Dropdown
                    type="dimensions"
                    options={DIMENSIONS_DATA}
                    isMultiSelect={true}
                    selectedValues={state.selectedDimensions}
                    onSelectionChange={handleSelectionChange}
                  />
                  <Dropdown
                    type="style"
                    options={STYLE_DATA}
                    isMultiSelect={false}
                    selectedValues={[state.selectedStyle]}
                    onSelectionChange={handleSelectionChange}
                  />
                </div>
                <button
                  className={`generate-button ${state.isGenerating ? 'loading' : ''}`}
                  id="generate-btn"
                  disabled={isGenerateButtonDisabled}
                  onClick={handleGenerateClick}
                >
                  <span className="generate-text">Generate</span>
                  <span className="generate-loading">
                    <span className="mini-spinner"></span>
                    Creating...
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ... (rest of the JSX) ... */}
           <div className="designer-canvas">
            <div className="canvas-state empty-canvas" id="empty-canvas">
              <div className="empty-content">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h2>Ready to Create?</h2>
                <p className="empty-description">Your design will appear here once generated</p>
                <div className="empty-steps">
                  <div className="step-item">
                    <div className="step-icon">🎯</div>
                    <div className="step-content">
                      <h4>Choose Template</h4>
                      <p>Select your preferred size</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-icon">✨</div>
                    <div className="step-content">
                      <h4>Describe Vision</h4>
                      <p>Tell us what you want</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-icon">🚀</div>
                    <div className="step-content">
                      <h4>Generate</h4>
                      <p>Watch magic happen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="canvas-state loading-canvas" id="loading-canvas" style={{ display: 'none' }}>
              <div className="loading-content">
                <div className="premium-loader">
                  <div className="loader-ring"></div>
                  <div className="loader-ring"></div>
                  <div className="loader-ring"></div>
                </div>
                <h3 id="loading-message">Initializing AI Designer...</h3>
                <div className="progress-track">
                  <div className="progress-bar" id="progress-bar"></div>
                </div>
                <p className="loading-tip" id="loading-tip">Pro tip: Be specific about colors and text</p>
              </div>
            </div>

            <div id="results-header" style={{ display: 'none', width: '100%' }}>
            </div>

            <div id="results-container-wrapper" className="custom-scrollbar" style={{ display: 'none' }}>
              <div id="results-container">
              </div>
            </div>

            <div className="canvas-state error-canvas" id="error-canvas" style={{ display: 'none' }}>
              <div className="error-content">
                <div className="error-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3>Oops! Something went wrong</h3>
                <p id="error-message">Unable to generate your design. Please try again.</p>
.                <button className="retry-button" id="retry-btn">Try Again</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <button className="help-button" onClick={() => window.open('/faq/', '_blank')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </>
  );
}
