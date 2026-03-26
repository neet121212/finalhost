import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, GraduationCap, ExternalLink, Filter } from 'lucide-react';
import Select from 'react-select';

const italyUniversities = [
  { id: 1, name: "Politecnico di Milano", location: "Milan, Italy", level: "PG", minPercentage: 70, type: "Public", ranking: "QS #111", programs: ["MSc Computer Science", "Architecture", "Engineering"] },
  { id: 2, name: "University of Bologna (Alma Mater Studiorum)", location: "Bologna, Italy", level: "UG", minPercentage: 65, type: "Public", ranking: "QS #133", programs: ["BA Economics", "Data Science", "Humanities"] },
  { id: 3, name: "Sapienza University of Rome", location: "Rome, Italy", level: "PG", minPercentage: 60, type: "Public", ranking: "QS #134", programs: ["MSc Artificial Intelligence", "Classics", "Physics"] },
  { id: 4, name: "University of Padua", location: "Padua, Italy", level: "UG", minPercentage: 75, type: "Public", ranking: "QS #219", programs: ["BSc Medicine", "Engineering", "Psychology"] },
  { id: 5, name: "University of Milan", location: "Milan, Italy", level: "PG", minPercentage: 65, type: "Public", ranking: "QS #276", programs: ["MSc Biotechnology", "Law", "Political Science"] },
  { id: 6, name: "Politecnico di Torino", location: "Turin, Italy", level: "PG", minPercentage: 70, type: "Public", ranking: "QS #252", programs: ["MSc Automotive Eng", "Computer Eng", "Design"] },
  { id: 7, name: "University of Pisa", location: "Pisa, Italy", level: "UG", minPercentage: 60, type: "Public", ranking: "QS #349", programs: ["BSc Computer Science", "Engineering", "Mathematics"] },
  { id: 8, name: "University of Naples Federico II", location: "Naples, Italy", level: "PG", minPercentage: 65, type: "Public", ranking: "QS #335", programs: ["MSc Aerospace Eng", "Natural Sciences", "Pharmacy"] },
  { id: 9, name: "University of Florence", location: "Florence, Italy", level: "UG", minPercentage: 70, type: "Public", ranking: "QS #358", programs: ["BA Fine Arts", "Medicine", "Architecture"] },
  { id: 10, name: "University of Turin", location: "Turin, Italy", level: "PG", minPercentage: 65, type: "Public", ranking: "QS #364", programs: ["MSc Economics", "Business", "Veterinary Medicine"] },
];

const SearchProgram = ({ onProceed, preselectedUnis = [], hideFooter = false, proceedLabel = "Proceed to Apply", onSelectionChange }) => {
  const [searchParams, setSearchParams] = useState({
    programLevel: null,
    programName: '',
    percentage: '',
    academicBackground: ''
  });
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUniIds, setSelectedUniIds] = useState(() => preselectedUnis.map(u => u.id));

  useEffect(() => {
    setSelectedUniIds(prev => {
      const newIds = preselectedUnis.map(u => u.id);
      // Only update if they differ to avoid unnecessary renders
      if (newIds.length !== prev.length || !newIds.every(id => prev.includes(id))) {
        return newIds;
      }
      return prev;
    });
  }, [preselectedUnis]);

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

  const handleSearch = () => {
    setHasSearched(true);
    let filtered = italyUniversities;

    if (searchParams.programLevel && searchParams.programLevel.value) {
      filtered = filtered.filter(u => u.level === searchParams.programLevel.value);
    }
    if (searchParams.percentage) {
      const p = parseInt(searchParams.percentage);
      filtered = filtered.filter(u => p >= u.minPercentage);
    }
    if (searchParams.programName) {
      const q = searchParams.programName.toLowerCase();
      filtered = filtered.filter(u => 
        u.programs.some(prog => prog.toLowerCase().includes(q)) || 
        u.name.toLowerCase().includes(q)
      );
    }

    setResults(filtered);
  };

  const toggleSelection = (uni) => {
    const uniId = uni.id;
    const isNowSelected = !selectedUniIds.includes(uniId);
    
    setSelectedUniIds(prev => 
      prev.includes(uniId) ? prev.filter(id => id !== uniId) : [...prev, uniId]
    );

    if (onSelectionChange) {
      onSelectionChange(uni, isNowSelected);
    }
  };

  const handleProceedWithSelected = (e) => {
    if (e) e.stopPropagation();
    if (onProceed && selectedUniIds.length > 0) {
      const selected = italyUniversities.filter(u => selectedUniIds.includes(u.id));
      onProceed(selected);
    }
  };

  return (
    <div className="view-search" style={{ position: 'relative', paddingBottom: selectedUniIds.length > 0 ? '80px' : '0' }}>
      <header className="dash-header">
        <div>
          <h1>Search Program Interface</h1>
          <p>Explore and filter available programs in Italy's top public universities.</p>
        </div>
      </header>

      <div className="widget" style={{ marginBottom: '20px' }}>
        <h3 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Filter size={18} /> Search Parameters
        </h3>
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
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Program / University Name</label>
            <input type="text" name="programName" value={searchParams.programName} onChange={handleChange} placeholder="e.g. Computer Science" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Your Highest Percentage (%)</label>
            <input type="number" name="percentage" value={searchParams.percentage} onChange={handleChange} placeholder="e.g. 75" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Req. Academic Background</label>
            <input type="text" name="academicBackground" value={searchParams.academicBackground} onChange={handleChange} placeholder="e.g. Science/Commerce" className="theme-input" />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-save" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', width: 'auto' }}>
            <Search size={18} /> Search Italy Universities
          </button>
        </div>
      </div>

      <div className="widget mt-4" style={{ padding: '0', overflow: 'hidden' }}>
        <h3 style={{ padding: '20px 20px 0 20px', margin: 0 }}>Search Results</h3>
        
        {!hasSearched ? (
          <div className="empty-state" style={{ padding: '30px' }}>Execute a search filter above to display available public universities in Italy.</div>
        ) : results.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', color: '#ef4444' }}>No universities matched your specific criteria. Try lowering the percentage or changing the level.</div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {results.map((uni) => {
              const isSelected = selectedUniIds.includes(uni.id);
              return (
                <div key={uni.id} style={{ 
                  background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)', 
                  border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }} className="hover:border-[var(--accent-secondary)]"
                   onClick={() => toggleSelection(uni)}
                >
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{ paddingTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                         onChange={() => toggleSelection(uni)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-secondary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={18} className="text-muted" /> {uni.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {uni.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {uni.minPercentage}% Required</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>{uni.type}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>{uni.ranking}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '5px' }}>
                        <span className="text-muted">Top Programs ({uni.level}): </span> {uni.programs.join(', ')}
                      </div>
                    </div>
                  </div>

                   {!hideFooter && (
                    <div>
                      <button 
                        className="btn-save" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onProceed) onProceed([uni]);
                        }}
                        style={{ background: 'var(--accent-primary)', border: 'none', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Select Program <ExternalLink size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hideFooter && selectedUniIds.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          bottom: '30px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: 'var(--card-bg-solid)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--accent-secondary)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          padding: '10px 25px',
          borderRadius: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          zIndex: 1000,
          opacity: 1,
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '0.95rem' }}>
            {selectedUniIds.length} Universit{selectedUniIds.length === 1 ? 'y' : 'ies'} Selected
          </span>
          <button 
            className="btn-save"
            onClick={handleProceedWithSelected}
            style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              border: 'none', 
              color: '#ffffff', 
              padding: '8px 20px', 
              fontSize: '0.95rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              opacity: 1,
              borderRadius: '25px',
              margin: 0
            }}
          >
            {proceedLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchProgram;
