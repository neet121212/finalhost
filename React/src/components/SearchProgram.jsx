import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Select from 'react-select';

const SearchProgram = () => {
  const [searchParams, setSearchParams] = useState({
    programLevel: null,
    programName: '',
    percentage: '',
    academicBackground: ''
  });

  const levelOptions = [
    { value: '', label: 'Any Level' },
    { value: 'UG', label: 'Undergraduate' },
    { value: 'PG', label: 'Postgraduate / Masters' },
    { value: 'PHD', label: 'Doctorate (PhD)' }
  ];

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-secondary)' : 'var(--input-border)',
      color: 'var(--text-main)',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.15)' : 'none',
      cursor: 'pointer',
      padding: '2px 4px',
      borderRadius: '10px',
      '&:hover': { borderColor: 'var(--accent-secondary)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgba(59, 130, 246, 0.15)' 
        : state.isFocused ? 'rgba(128, 128, 128, 0.1)' : 'transparent',
      color: state.isSelected ? 'var(--accent-secondary)' : 'var(--text-main)',
      cursor: 'pointer',
      '&:hover': { backgroundColor: 'rgba(128, 128, 128, 0.1)' }
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
    input: (base) => ({ ...base, color: 'var(--text-main)' }),
    placeholder: (base) => ({ ...base, color: 'var(--text-muted)' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--glass-border)' }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--text-muted)' }),
  };

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleLevelChange = (selectedOption) => {
    setSearchParams({ ...searchParams, programLevel: selectedOption });
  };

  return (
    <div className="view-search">
      <header className="dash-header">
        <div>
          <h1>Search Program Interface</h1>
          <p>Scan for eligible international structures securely.</p>
        </div>
      </header>

      <div className="widget" style={{ marginBottom: '20px' }}>
        <h3 style={{marginBottom: '15px'}}>Search Parameters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Program Level</label>
            <Select 
              name="programLevel" 
              value={searchParams.programLevel} 
              onChange={handleLevelChange} 
              options={levelOptions} 
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Any Level" 
              isSearchable={false}
            />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Program Name (Course)</label>
            <input type="text" name="programName" value={searchParams.programName} onChange={handleChange} placeholder="e.g. Computer Science" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Highest Percentage (%)</label>
            <input type="number" name="percentage" value={searchParams.percentage} onChange={handleChange} placeholder="e.g. 85" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Req. Academic Background</label>
            <input type="text" name="academicBackground" value={searchParams.academicBackground} onChange={handleChange} placeholder="e.g. Science/Commerce" className="theme-input" />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', width: 'auto' }}>
            <Search size={18} /> Execute Search
          </button>
        </div>
      </div>

      <div className="widget placeholder-panel mt-4">
        <h3>Network Node Results</h3>
        <div className="empty-state">Execute a search filter above to display available programs.</div>
      </div>
    </div>
  );
};

export default SearchProgram;
