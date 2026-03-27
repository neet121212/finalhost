import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Building, GraduationCap, ExternalLink, Filter, Database, Loader2, CalendarClock, Download, X, CheckSquare, FileSpreadsheet } from 'lucide-react';
import Select from 'react-select';
import * as XLSX from 'xlsx';

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

// Helper to reliably find object properties regardless of case/spacing
const getFieldValue = (item, possibleKeys) => {
  if (!item) return null;
  const itemKeys = Object.keys(item);
  const normalizedPossibles = possibleKeys.map(k => k.toLowerCase().replace(/[\s_.-]+/g, ''));

  for (let key of itemKeys) {
    const normalizedKey = key.toLowerCase().replace(/[\s_.-]+/g, '');
    if (normalizedPossibles.includes(normalizedKey)) {
      return item[key];
    }
  }
  return null;
};

const SearchProgram = ({ onProceed, preselectedUnis = [], hideFooter = false, proceedLabel = "Proceed to Apply", onSelectionChange }) => {
  const [searchParams, setSearchParams] = useState({
    programLevel: null,
    programName: null,
    percentage: '',
    interestedField: null,
    subField: null
  });
  const [universitiesData, setUniversitiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUniIds, setSelectedUniIds] = useState(() => preselectedUnis.map(u => u.id));
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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

  // --- Dynamic Dropdown Options Generation ---
  const extractUniqueOptions = (data, keys) => {
    const rawSet = new Set();
    data.forEach(item => {
      const val = getFieldValue(item, keys);
      if (val !== null && val !== undefined) {
        if (typeof val === 'string' && val.trim() !== '') {
          rawSet.add(val.trim());
        } else if (typeof val === 'number') {
          rawSet.add(val.toString().trim());
        }
      }
    });
    return Array.from(rawSet).sort().map(val => ({ value: val, label: val }));
  };

  const levelOptions = useMemo(() => [
    { value: '', label: 'Any Level' },
    ...extractUniqueOptions(universitiesData, ['programlevel', 'level'])
  ], [universitiesData]);

  const interestedFieldOptions = useMemo(() => {
    let filteredData = universitiesData;
    if (searchParams.programLevel && searchParams.programLevel.value) {
      const qLevel = searchParams.programLevel.value.toLowerCase();
      filteredData = filteredData.filter(u => {
        const uLevel = (getFieldValue(u, ['programlevel', 'level']) || "").toLowerCase();
        return uLevel.includes(qLevel);
      });
    }
    return [
      { value: '', label: 'Any Interested Field' },
      ...extractUniqueOptions(filteredData, ['interestedfield'])
    ];
  }, [universitiesData, searchParams.programLevel]);

  const subFieldOptions = useMemo(() => {
    let filteredData = universitiesData;

    if (searchParams.programLevel && searchParams.programLevel.value) {
      const qLevel = searchParams.programLevel.value.toLowerCase();
      filteredData = filteredData.filter(u => {
        const uLevel = (getFieldValue(u, ['programlevel', 'level']) || "").toLowerCase();
        return uLevel.includes(qLevel);
      });
    }

    if (searchParams.interestedField && searchParams.interestedField.value) {
      filteredData = filteredData.filter(u => {
        const val = getFieldValue(u, ['interestedfield']);
        return val && String(val).trim() === searchParams.interestedField.value;
      });
    }
    return [
      { value: '', label: 'Any Sub Field' },
      ...extractUniqueOptions(filteredData, ['subfield'])
    ];
  }, [universitiesData, searchParams.programLevel, searchParams.interestedField]);

  const programNameOptions = useMemo(() => {
    let filteredData = universitiesData;

    if (searchParams.programLevel && searchParams.programLevel.value) {
      const qLevel = searchParams.programLevel.value.toLowerCase();
      filteredData = filteredData.filter(u => {
        const uLevel = (getFieldValue(u, ['programlevel', 'level']) || "").toLowerCase();
        return uLevel.includes(qLevel);
      });
    }

    if (searchParams.interestedField && searchParams.interestedField.value) {
      filteredData = filteredData.filter(u => {
        const val = getFieldValue(u, ['interestedfield']);
        return val && String(val).trim() === searchParams.interestedField.value;
      });
    }
    if (searchParams.subField && searchParams.subField.value) {
      filteredData = filteredData.filter(u => {
        const val = getFieldValue(u, ['subfield']);
        return val && String(val).trim() === searchParams.subField.value;
      });
    }
    return [
      { value: '', label: 'Any Program' },
      ...extractUniqueOptions(filteredData, ['programname', 'program', 'name'])
    ];
  }, [universitiesData, searchParams.programLevel, searchParams.interestedField, searchParams.subField]);

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

  const handleSelectChange = (name, selectedOption) => {
    setSearchParams(prev => {
      const updated = { ...prev, [name]: selectedOption };

      // Auto-clear dependent fields when parent changes
      if (name === "programLevel") {
        updated.interestedField = null;
        updated.subField = null;
        updated.programName = null;
      } else if (name === "interestedField") {
        updated.subField = null;
        updated.programName = null;
      } else if (name === "subField") {
        updated.programName = null;
      }

      return updated;
    });
  };

  const handleTextChange = (e) => {
    setSearchParams(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredResults = useMemo(() => {
    let filtered = universitiesData;

    // Filter by Program Level
    if (searchParams.programLevel && searchParams.programLevel.value) {
      const qLevel = searchParams.programLevel.value.toLowerCase();
      filtered = filtered.filter(u => {
        const uLevel = (getFieldValue(u, ['programlevel', 'level']) || "").toLowerCase();
        return uLevel.includes(qLevel);
      });
    }

    // Filter by Percentage
    if (searchParams.percentage) {
      const p = parseFloat(searchParams.percentage);
      if (!isNaN(p)) {
        filtered = filtered.filter(u => {
          const reqStr = getFieldValue(u, ['percentage', 'minpercentage']);
          let finalReq = 0;
          if (reqStr) {
            if (typeof reqStr === 'string' && reqStr.includes('%')) {
              finalReq = parseFloat(reqStr.replace('%', ''));
            } else {
              const rawNum = parseFloat(reqStr);
              finalReq = rawNum < 1 ? rawNum * 100 : rawNum;
            }
          }
          return p >= finalReq;
        });
      }
    }

    // Filter by Program Name
    if (searchParams.programName && searchParams.programName.value) {
      const q = searchParams.programName.value.toLowerCase();
      filtered = filtered.filter(u => {
        const uProg = (getFieldValue(u, ['programname', 'program', 'name']) || "").toLowerCase();
        return uProg.includes(q);
      });
    }

    // Filter by Interested Field
    if (searchParams.interestedField && searchParams.interestedField.value) {
      const q = searchParams.interestedField.value.toLowerCase();
      filtered = filtered.filter(u => {
        const field = (getFieldValue(u, ['interestedfield']) || "").toLowerCase();
        return field.includes(q);
      });
    }

    // Filter by Sub Field
    if (searchParams.subField && searchParams.subField.value) {
      const q = searchParams.subField.value.toLowerCase();
      filtered = filtered.filter(u => {
        const field = (getFieldValue(u, ['subfield']) || "").toLowerCase();
        return field.includes(q);
      });
    }

    return filtered;
  }, [universitiesData, searchParams]);

  const toggleSelection = (uni) => {
    const uniId = uni.id;
    const isNowSelected = !selectedUniIds.includes(uniId);

    if (isNowSelected && selectedUniIds.length >= 25 && !hideFooter) {
      setError("You can select a maximum of 25 programs for the Excel export at one time.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    setSelectedUniIds(prev =>
      prev.includes(uniId) ? prev.filter(id => id !== uniId) : [...prev, uniId]
    );

    if (onSelectionChange) {
      const formattedUni = {
        id: uni.id,
        name: getFieldValue(uni, ['universityname', 'name']) || "Unknown University",
        location: getFieldValue(uni, ['location']) || "Unknown Location",
        level: getFieldValue(uni, ['programlevel', 'level']) || "N/A",
        minPercentage: getFieldValue(uni, ['percentage']) || 0,
        type: getFieldValue(uni, ['type']) || "N/A",
        ranking: getFieldValue(uni, ['ranking']) || "N/A",
        programs: [getFieldValue(uni, ['programname', 'program']) || "Unknown Program"],
        rawSheetData: uni
      };
      onSelectionChange(formattedUni, isNowSelected);
    }
  };

  const handleSelectAllFiltered = () => {
    const visibleResults = filteredResults.slice(0, 25);
    const visibleIds = visibleResults.map(uni => uni.id || uni.SNO);
    const allVisibleSelected = visibleIds.every(id => selectedUniIds.includes(id));

    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedUniIds(prev => prev.filter(id => !visibleIds.includes(id)));
      if (onSelectionChange) {
        visibleResults.forEach(uni => {
          const formattedUni = {
            id: uni.id || uni.SNO,
            name: getFieldValue(uni, ['universityname', 'name']) || "Unknown University",
            location: getFieldValue(uni, ['location']) || "Unknown Location",
            level: getFieldValue(uni, ['programlevel', 'level']) || "N/A",
            minPercentage: getFieldValue(uni, ['percentage']) || 0,
            type: getFieldValue(uni, ['type']) || "N/A",
            ranking: getFieldValue(uni, ['ranking']) || "N/A",
            programs: [getFieldValue(uni, ['programname', 'program']) || "Unknown Program"],
            rawSheetData: uni
          };
          onSelectionChange(formattedUni, false);
        });
      }
    } else {
      // Select all visible (up to 25)
      const toAdd = visibleResults.filter(uni => !selectedUniIds.includes(uni.id || uni.SNO));
      
      let currentCount = selectedUniIds.length;
      const actualToAdd = [];
      const newIds = [...selectedUniIds];

      for (const uni of toAdd) {
        if (currentCount < 25) {
          actualToAdd.push(uni);
          newIds.push(uni.id || uni.SNO);
          currentCount++;
        }
      }

      setSelectedUniIds(newIds);

      if (onSelectionChange) {
        actualToAdd.forEach(uni => {
          const formattedUni = {
            id: uni.id || uni.SNO,
            name: getFieldValue(uni, ['universityname', 'name']) || "Unknown University",
            location: getFieldValue(uni, ['location']) || "Unknown Location",
            level: getFieldValue(uni, ['programlevel', 'level']) || "N/A",
            minPercentage: getFieldValue(uni, ['percentage']) || 0,
            type: getFieldValue(uni, ['type']) || "N/A",
            ranking: getFieldValue(uni, ['ranking']) || "N/A",
            programs: [getFieldValue(uni, ['programname', 'program']) || "Unknown Program"],
            rawSheetData: uni
          };
          onSelectionChange(formattedUni, true);
        });
      }

      if (filteredResults.length > 25) {
        setError("Only the first 25 filtered results were selected (Export Limit).");
        setTimeout(() => setError(null), 4000);
      } else if (toAdd.length > actualToAdd.length) {
        setError("Export limit of 25 programs reached.");
        setTimeout(() => setError(null), 4000);
      }
    }
  };

  const handleProceedWithSelected = (e) => {
    if (e) e.stopPropagation();
    if (onProceed && selectedUniIds.length > 0) {
      const selected = universitiesData.filter(u => selectedUniIds.includes(u.id)).map(uni => ({
        id: uni.id,
        name: getFieldValue(uni, ['universityname', 'name']) || "Unknown University",
        location: getFieldValue(uni, ['location']) || "Unknown Location",
        level: getFieldValue(uni, ['programlevel', 'level']) || "N/A",
        minPercentage: getFieldValue(uni, ['percentage']) || 0,
        type: getFieldValue(uni, ['type']) || "N/A",
        ranking: getFieldValue(uni, ['ranking']) || "N/A",
        programs: [getFieldValue(uni, ['programname', 'program']) || "Unknown Program"],
        rawSheetData: uni
      }));
      onProceed(selected);
    }
  };

  const handleDownloadExcel = () => {
    const selected = universitiesData.filter(u => selectedUniIds.includes(u.id));
    if (selected.length === 0) return;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert JSON to worksheet, omitting sensitive or internal keys like 'id'
    const cleanData = selected.map(uni => {
      const { id, ...rest } = uni;
      return rest;
    });

    const ws = XLSX.utils.json_to_sheet(cleanData);

    // Standard column widths
    const wscols = Object.keys(cleanData[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Selected Programs");

    // Generate and download
    XLSX.writeFile(wb, "Course_Finder_Export.xlsx");
    setShowDownloadModal(false);
  };

  // Helper to extract non-standard columns for display
  const getOtherColumns = (uni) => {
    const standardKeysNormalized = [
      "id", "universityname", "name",
      "location", "type", "ranking",
      "percentage", "minpercentage",
      "programlevel", "level",
      "interestedfield",
      "subfield",
      "programname", "program", "rawsheetdata",
      "sno" // Hide S.NO entirely
    ];
    return Object.keys(uni).filter(key => {
      const normKey = key.toLowerCase().replace(/[\s_.-]+/g, '');
      return !standardKeysNormalized.includes(normKey) &&
        uni[key] !== null &&
        uni[key] !== undefined &&
        uni[key] !== "";
    });
  };

  return (
    <div className="view-search" style={{ position: 'relative', paddingBottom: selectedUniIds.length > 0 ? '80px' : '0' }}>
      <header className="dash-header">
        <div>
          <h1>Search Program Interface</h1>
          <p>Explore programs</p>
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
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} /> Search Parameters
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>Program Level</label>
            <Select
              name="programLevel"
              value={searchParams.programLevel}
              onChange={(val) => handleSelectChange("programLevel", val)}
              options={levelOptions}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Level"
            />
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>Interested Field</label>
            <Select
              name="interestedField"
              value={searchParams.interestedField}
              onChange={(val) => handleSelectChange("interestedField", val)}
              options={interestedFieldOptions}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Field"
            />
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>Sub Field</label>
            <Select
              name="subField"
              value={searchParams.subField}
              onChange={(val) => handleSelectChange("subField", val)}
              options={subFieldOptions}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Sub Field"
            />
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>Program Name</label>
            <Select
              name="programName"
              value={searchParams.programName}
              onChange={(val) => handleSelectChange("programName", val)}
              options={programNameOptions}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Program"
            />
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px' }}>Your Highest Percentage (%)</label>
            <input type="number" name="percentage" value={searchParams.percentage} onChange={handleTextChange} placeholder="e.g. 75" className="theme-input" />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-save" onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', width: 'auto' }}>
            <Search size={16} />
            Search Programs
          </button>
        </div>
      </div>

      <div className="widget mt-4" style={{ padding: '0', overflow: 'hidden' }}>
        <h3 style={{ padding: '20px 20px 0 20px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Search Results</span>
            {!isLoading && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{filteredResults.length} programs found</span>}
          </div>
          {!isLoading && filteredResults.length > 0 && !hideFooter && (
            <button
              onClick={handleSelectAllFiltered}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-secondary)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '6px 15px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckSquare size={14} />
              {filteredResults.slice(0, 25).every(u => selectedUniIds.includes(u.id || u.SNO))
                ? 'Deselect All'
                : 'Select All (Max 25)'}
            </button>
          )}
        </h3>

        {isLoading ? (
          <div className="empty-state" style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <Loader2 size={32} className="animate-spin text-accent" style={{ color: 'var(--accent-secondary)' }} />
            <span className="text-muted">Loading.......</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', color: '#ef4444' }}>No universities matched your specific criteria. Try lowering the percentage or changing filters.</div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredResults.map((uni, idx) => {
              const uniId = uni.id || `fallback_${idx}`;
              const isSelected = selectedUniIds.includes(uniId);
              const otherCols = getOtherColumns(uni);

              const uniName = uni["University Name"] || uni["university name"] || uni.name || "Unknown University";
              const programNameRaw = uni["Program Name "] || uni["program name"] || uni["Program name"] || uni.program || "";
              const programName = (programNameRaw && programNameRaw !== "N/A") ? programNameRaw : "";
              const location = (uni["Location"] || uni.location) ? (uni["Location"] || uni.location) : "Location Not Listed";
              const type = (uni["Type"] || uni.type) && (uni["Type"] || uni.type) !== "N/A" ? (uni["Type"] || uni.type) : "";
              const ranking = (uni["Ranking"] || uni.ranking) && (uni["Ranking"] || uni.ranking) !== "N/A" ? (uni["Ranking"] || uni.ranking) : "";
              const reqPercentage = uni["percentage"] || uni["Percentage"] || uni.percentage || "0";

              let displayPercentage = reqPercentage;
              if (reqPercentage && reqPercentage !== "0") {
                if (typeof reqPercentage === 'string' && reqPercentage.includes('%')) {
                  displayPercentage = parseFloat(reqPercentage.replace('%', '')).toString();
                } else {
                  const rawNum = parseFloat(reqPercentage);
                  if (!isNaN(rawNum)) {
                    displayPercentage = (rawNum < 1 ? Math.round(rawNum * 100) : rawNum).toString();
                  }
                }
              }

              const levelRaw = uni["program level"] || uni["Program level"] || uni.level || "";
              const level = (levelRaw && levelRaw !== "N/A") ? levelRaw : "";
              const interestedFieldRaw = uni["Interested field"] || uni["interested field"] || uni.interestedField || "";
              const interestedField = (interestedFieldRaw && interestedFieldRaw !== "N/A") ? interestedFieldRaw : "";
              const subFieldRaw = uni["sub field"] || uni["Sub field"] || uni.subField || "";
              const subField = (subFieldRaw && subFieldRaw !== "N/A") ? subFieldRaw : "";

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
                          <Building size={18} className="text-muted" /> {programName || uniName}
                        </h4>
                        {programName && (
                          <div style={{ fontSize: '0.95rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                            {uniName}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap', marginTop: '5px' }}>
                          {location !== "Location Not Listed" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {location}</span>}
                          {reqPercentage !== "0" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {displayPercentage}%</span>}
                          {type !== "" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>{type}</span>}
                          {ranking !== "" && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>{ranking}</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px' }}>
                          {level && <span className="text-muted">Target Level: ({level})</span>}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {interestedField} {subField && ` > ${subField}`}
                          </div>
                        </div>
                      </div>
                    </div>
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
                      {otherCols.map(col => {
                        const isDeadline = col.toLowerCase().includes('deadline');
                        return (
                          <div key={col} style={{
                            fontSize: '0.85rem',
                            background: isDeadline ? 'rgba(239, 68, 68, 0.05)' : 'var(--input-bg)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isDeadline ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: isDeadline ? '#ef4444' : 'var(--text-muted)'
                            }}>
                              {isDeadline && <CalendarClock size={12} />}
                              {col}
                            </span>
                            <span style={{
                              color: isDeadline ? '#ef4444' : 'var(--text-main)',
                              fontWeight: isDeadline ? 700 : 500
                            }}>
                              {uni[col]}
                            </span>
                          </div>
                        );
                      })}
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
            onClick={() => setShowDownloadModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 20px',
              fontSize: '0.95rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              borderRadius: '25px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} /> Review & Download Excel
          </button>
        </div>
      )}

      {/* EXCEL EXPORT REVIEW MODAL */}
      {showDownloadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg-solid)', padding: '0', borderRadius: '20px', border: '1px solid var(--glass-border)', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>

            <div style={{ padding: '20px 25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 800 }}><FileSpreadsheet size={22} color="#10b981" /> Export Data Configuration</h3>
              <button onClick={() => setShowDownloadModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Currently Selected Programs:</div>
                <div style={{ fontSize: '0.85rem', color: selectedUniIds.length === 25 ? '#ef4444' : 'var(--accent-secondary)', fontWeight: 800, background: 'var(--input-bg)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>{selectedUniIds.length} / 25 Maximum</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {universitiesData.filter(u => selectedUniIds.includes(u.id)).map(uni => {
                  const uniName = uni["University Name"] || uni["university name"] || uni.name || "Unknown University";
                  const programNameRaw = uni["Program Name "] || uni["program name"] || uni["Program name"] || uni.program || "";
                  const programName = (programNameRaw && programNameRaw !== "N/A") ? programNameRaw : "";

                  return (
                    <div key={uni.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', padding: '12px 15px', borderRadius: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '15px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{programName || uniName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{programName ? uniName : ''}</div>
                      </div>
                      <button
                        onClick={() => toggleSelection(uni)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        title="Remove from export list"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {selectedUniIds.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No programs selected for export.</div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 25px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '15px', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setShowDownloadModal(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleDownloadExcel}
                disabled={selectedUniIds.length === 0}
                style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: selectedUniIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedUniIds.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
              >
                <Download size={16} /> Generate .XLSX Excel File
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SearchProgram;
