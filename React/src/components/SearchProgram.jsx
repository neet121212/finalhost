import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, GraduationCap, ExternalLink, Filter, Database, Loader2 } from 'lucide-react';
import Select from 'react-select';

// ==========================================
// PASTE YOUR GOOGLE APP SCRIPT WEB APP URL BELOW
// ==========================================
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbydE8Mw77TYC_e9vMYxWEXTLZvZQRfstl3eNgp3G1bCHyNw-hScNVpCuUx_6VPevDwIZw/exec";

// Fallback sample data structured like what the Google Sheet would return
const sampleSheetData = [
  {
    id: "1",
    "University Name": "Sample University A",
    "Location": "New York, USA",
    "Type": "Public",
    "Ranking": "#10",
    "program level": "PG",
    "percentage": 75,
    "Interested field": "Engineering",
    "sub field": "Computer Science",
    "program name": "MSc Computer Science",
    "Tuition Fee": "$20,000 / year",
    "Intakes": "Fall 2024",
    "Application Deadline": "Jan 2024"
  },
  {
    id: "2",
    "University Name": "Sample University B",
    "Location": "London, UK",
    "Type": "Private",
    "Ranking": "#5",
    "program level": "UG",
    "percentage": 80,
    "Interested field": "Business",
    "sub field": "Management",
    "program name": "BBA Management",
    "Language": "English",
    "Requires IELTS": "Yes"
  }
];

const SearchProgram = ({ onProceed, preselectedUnis = [], hideFooter = false, proceedLabel = "Proceed to Apply", onSelectionChange }) => {
  const [searchParams, setSearchParams] = useState({
    programLevel: null,
    programName: '',
    percentage: '',
    interestedField: '',
    subField: ''
  });
  const [universitiesData, setUniversitiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUniIds, setSelectedUniIds] = useState(() => preselectedUnis.map(u => u.id));

  useEffect(() => {
    setSelectedUniIds(prev => {
      const newIds = preselectedUnis.map(u => u.id);
      if (newIds.length !== prev.length || !newIds.every(id => prev.includes(id))) {
        return newIds;
      }
      return prev;
    });
  }, [preselectedUnis]);

  // Fetch data from Google Sheet App Script
  useEffect(() => {
    const fetchData = async () => {
      if (APP_SCRIPT_URL === "INSERT_YOUR_GOOGLE_APP_SCRIPT_URL_HERE" || !APP_SCRIPT_URL) {
        setUniversitiesData(sampleSheetData);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(APP_SCRIPT_URL);
        if (!response.ok) throw new Error("Failed to fetch data from App Script");
        const data = await response.json();
        
        // ensure IDs exist for selection logic
        const dataWithIds = data.map((item, index) => ({
          ...item,
          id: item.id || `sheet_row_${index}`
        }));
        
        setUniversitiesData(dataWithIds);
      } catch (err) {
        console.error("Error fetching universities:", err);
        setError("Failed to load university data. Please check the App Script URL or your network connection.");
        setUniversitiesData(sampleSheetData); // Fallback to sample on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const levelOptions = [
    { value: '', label: 'Any Level' },
    { value: 'UG', label: 'Undergraduate (UG)' },
    { value: 'PG', label: 'Postgraduate (PG)' },
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
    let filtered = universitiesData;

    // Filter by Program Level
    if (searchParams.programLevel && searchParams.programLevel.value) {
      const qLevel = searchParams.programLevel.value.toLowerCase();
      filtered = filtered.filter(u => {
        const uLevel = (u["program level"] || u["Program level"] || u.level || "").toLowerCase();
        return uLevel.includes(qLevel);
      });
    }
    
    // Filter by Percentage
    if (searchParams.percentage) {
      const p = parseFloat(searchParams.percentage);
      filtered = filtered.filter(u => {
        const req = parseFloat(u["percentage"] || u["Percentage"] || u.percentage || 0);
        return p >= req;
      });
    }

    // Filter by Program Name
    if (searchParams.programName) {
      const q = searchParams.programName.toLowerCase();
      filtered = filtered.filter(u => {
        const uProg = (u["program name"] || u["Program name"] || u.program || u.name || "").toLowerCase();
        return uProg.includes(q);
      });
    }

    // Filter by Interested Field
    if (searchParams.interestedField) {
      const q = searchParams.interestedField.toLowerCase();
      filtered = filtered.filter(u => {
        const field = (u["Interested field"] || u["interested field"] || u.interestedField || "").toLowerCase();
        return field.includes(q);
      });
    }

    // Filter by Sub Field
    if (searchParams.subField) {
      const q = searchParams.subField.toLowerCase();
      filtered = filtered.filter(u => {
        const field = (u["sub field"] || u["Sub field"] || u.subField || "").toLowerCase();
        return field.includes(q);
      });
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
      // Create a standard structure object for the rest of the app to understand
      const standardizedUni = {
        id: uni.id,
        name: uni["University Name"] || uni["university name"] || uni.name || "Unknown University",
        location: uni["Location"] || uni.location || "Unknown Location",
        level: uni["program level"] || uni["Program level"] || uni.level || "N/A",
        minPercentage: uni["percentage"] || uni["Percentage"] || uni.percentage || 0,
        type: uni["Type"] || uni.type || "N/A",
        ranking: uni["Ranking"] || uni.ranking || "N/A",
        programs: [uni["program name"] || uni["Program name"] || uni.program || uni.name || "Unknown Program"]
      };
      onSelectionChange(standardizedUni, isNowSelected);
    }
  };

  const handleProceedWithSelected = (e) => {
    if (e) e.stopPropagation();
    if (onProceed && selectedUniIds.length > 0) {
      // Pass the selected universities structured for existing pipelines
      const selected = universitiesData.filter(u => selectedUniIds.includes(u.id)).map(uni => ({
        id: uni.id,
        name: uni["University Name"] || uni["university name"] || uni.name || "Unknown University",
        location: uni["Location"] || uni.location || "Unknown Location",
        level: uni["program level"] || uni["Program level"] || uni.level || "N/A",
        minPercentage: uni["percentage"] || uni["Percentage"] || uni.percentage || 0,
        type: uni["Type"] || uni.type || "N/A",
        ranking: uni["Ranking"] || uni.ranking || "N/A",
        programs: [uni["program name"] || uni["Program name"] || uni.program || uni.name || "Unknown Program"],
        rawSheetData: uni // pass the full object in case its needed
      }));
      onProceed(selected);
    }
  };

  // Helper to extract non-standard columns for display
  const getOtherColumns = (uni) => {
    const standardKeys = [
      "id", "University Name", "university name", "name", 
      "Location", "location", "Type", "type", "Ranking", "ranking", 
      "percentage", "Percentage", "minPercentage", 
      "program level", "Program level", "level", 
      "Interested field", "interested field", "interestedField",
      "sub field", "Sub field", "subField",
      "program name", "Program name", "program", "rawSheetData"
    ];
    return Object.keys(uni).filter(key => !standardKeys.includes(key) && uni[key] !== null && uni[key] !== undefined && uni[key] !== "");
  };

  return (
    <div className="view-search" style={{ position: 'relative', paddingBottom: selectedUniIds.length > 0 ? '80px' : '0' }}>
      <header className="dash-header">
        <div>
          <h1>Search Program Interface</h1>
          <p>Explore programs by syncing directly with your Google Sheet data.</p>
        </div>
        {APP_SCRIPT_URL === "INSERT_YOUR_GOOGLE_APP_SCRIPT_URL_HERE" && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '8px 15px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} /> Using Mock Data. Please insert your App Script URL in SearchProgram.jsx.
          </div>
        )}
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

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
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Interested Field</label>
            <input type="text" name="interestedField" value={searchParams.interestedField} onChange={handleChange} placeholder="e.g. Engineering, Business" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Sub Field</label>
            <input type="text" name="subField" value={searchParams.subField} onChange={handleChange} placeholder="e.g. Computer Science" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Program Name</label>
            <input type="text" name="programName" value={searchParams.programName} onChange={handleChange} placeholder="e.g. MSc Data Science" className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '8px'}}>Your Highest Percentage (%)</label>
            <input type="number" name="percentage" value={searchParams.percentage} onChange={handleChange} placeholder="e.g. 75" className="theme-input" />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-save" onClick={handleSearch} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', width: 'auto', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} 
            Search Programs
          </button>
        </div>
      </div>

      <div className="widget mt-4" style={{ padding: '0', overflow: 'hidden' }}>
        <h3 style={{ padding: '20px 20px 0 20px', margin: 0 }}>Search Results</h3>
        
        {isLoading ? (
          <div className="empty-state" style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <Loader2 size={32} className="animate-spin text-accent" style={{ color: 'var(--accent-secondary)' }} />
            <span className="text-muted">Fetching live data from Google Sheets...</span>
          </div>
        ) : !hasSearched ? (
          <div className="empty-state" style={{ padding: '30px' }}>Execute a search filter above to display available programs from your database.</div>
        ) : results.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', color: '#ef4444' }}>No universities matched your specific criteria. Try lowering the percentage or changing filters.</div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {results.map((uni, idx) => {
              const uniId = uni.id || `fallback_${idx}`;
              const isSelected = selectedUniIds.includes(uniId);
              const otherCols = getOtherColumns(uni);
              
              const uniName = uni["University Name"] || uni["university name"] || uni.name || "Unknown University";
              const programName = uni["program name"] || uni["Program name"] || uni.program || "Unknown Program";
              const location = uni["Location"] || uni.location || "Unknown Location";
              const type = uni["Type"] || uni.type || "N/A";
              const ranking = uni["Ranking"] || uni.ranking || "N/A";
              const reqPercentage = uni["percentage"] || uni["Percentage"] || uni.percentage || "0";
              const level = uni["program level"] || uni["Program level"] || uni.level || "N/A";
              const interestedField = uni["Interested field"] || uni["interested field"] || uni.interestedField || "N/A";
              const subField = uni["sub field"] || uni["Sub field"] || uni.subField || "N/A";

              return (
                <div key={uniId} style={{ 
                  background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)', 
                  border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }} className="hover:border-[var(--accent-secondary)]"
                   onClick={() => toggleSelection({ ...uni, id: uniId })}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <div style={{ paddingTop: '4px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelection({ ...uni, id: uniId })}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-secondary)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building size={18} className="text-muted" /> {uniName}
                        </h4>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                          {location !== "Unknown Location" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {location}</span>}
                          {reqPercentage !== "0" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {reqPercentage}%</span>}
                          {type !== "N/A" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>{type}</span>}
                          {ranking !== "N/A" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>{ranking}</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '5px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{programName}</span> <span className="text-muted">({level})</span>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {interestedField} {subField !== "N/A" && `> ${subField}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!hideFooter && (
                      <button 
                        className="btn-save" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onProceed) handleProceedWithSelected(e);
                        }}
                        style={{ background: 'var(--accent-primary)', border: 'none', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                      >
                        Select <ExternalLink size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dynamic Other Columns from Google Sheet */}
                  {otherCols.length > 0 && (
                    <div style={{ 
                      marginTop: '5px', 
                      paddingTop: '15px', 
                      borderTop: '1px dashed var(--glass-border)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '12px'
                    }}>
                      {otherCols.map(col => (
                        <div key={col} style={{ fontSize: '0.85rem' }}>
                          <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{col}</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{uni[col]}</span>
                        </div>
                      ))}
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
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '0.95rem' }}>
            {selectedUniIds.length} Program{selectedUniIds.length === 1 ? '' : 's'} Selected
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
