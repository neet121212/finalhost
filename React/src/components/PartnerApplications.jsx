import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building, MapPin, GraduationCap, FileText, User, Users, CheckCircle, Phone, CheckSquare, Filter } from 'lucide-react';
import StudentDetails from './StudentDetails';
import { API_BASE_URL } from '../config';

const PartnerApplications = ({ profile, setMessage }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/erp/students`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      } else {
        if(setMessage) setMessage({ text: data.error || 'Failed to fetch students', type: 'error' });
      }
    } catch (err) {
      if(setMessage) setMessage({ text: 'Server error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Extract all valid applications from all students
  const allApplications = [];
  students.forEach(student => {
    const validApps = (student.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);
    validApps.forEach(app => {
      // Determine label: Who is the primary counselor for this record?
      let counselorLabel = 'Direct';
      
      if (student.createdByCounselor) {
        counselorLabel = `${student.createdByCounselor.firstName} ${student.createdByCounselor.lastName || ''}`;
      } else if (student.assignedCounselor) {
        counselorLabel = `${student.assignedCounselor.firstName} ${student.assignedCounselor.lastName || ''}`;
      }

      allApplications.push({
        ...app,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        studentEmail: student.email,
        studentPhone: student.phone,
        counselorName: counselorLabel,
      });
    });
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const uniqueStudents = useMemo(() => {
    return Array.from(new Set(allApplications.map(app => app.studentName).filter(Boolean))).sort();
  }, [allApplications]);

  const uniqueUniversities = useMemo(() => {
    return Array.from(new Set(allApplications.map(app => app.name).filter(Boolean))).sort();
  }, [allApplications]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(allApplications.map(app => app.location).filter(Boolean)));
  }, [allApplications]);

  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(allApplications.map(app => app.level).filter(Boolean)));
  }, [allApplications]);

  const filteredApplications = useMemo(() => {
    return allApplications.filter(app => {
      if (searchTerm && app.name && !app.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (studentSearchTerm && app.studentName && !app.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase())) return false;
      if (locationFilter && app.location !== locationFilter) return false;
      if (levelFilter && app.level !== levelFilter) return false;
      return true;
    });
  }, [allApplications, searchTerm, studentSearchTerm, locationFilter, levelFilter]);

  return (
    <div className="view-standard" style={{ animation: 'fadeIn 0.3s ease' }}>
      <header className="dash-header">
        <div>
          <h1>Applied Applications</h1>
          <p>Master ledger of all university applications submitted by students under your management.</p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div className="loader" style={{ margin: '0 auto 20px auto' }}></div>
          <p>Loading application ledger...</p>
        </div>
      ) : allApplications.length === 0 ? (
        <div className="widget placeholder-panel mt-4">
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--glass-border)', margin: '0 auto 15px auto' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Applications Filed</h3>
            <p style={{ color: 'var(--text-muted)' }}>None of your managed students have finalized university applications yet.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="widget" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              <Filter size={18} /> Filter Ledger
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select className="theme-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '35px', width: '100%', boxSizing: 'border-box' }}>
                  <option value="">All Universities</option>
                  {uniqueUniversities.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select className="theme-input" value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} style={{ paddingLeft: '35px', width: '100%', boxSizing: 'border-box' }}>
                  <option value="">All Students</option>
                  {uniqueStudents.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <select className="theme-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <select className="theme-input" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Levels</option>
                {uniqueLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-save" onClick={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', width: 'auto' }}>
                <Search size={16} /> 
                Apply Filters
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredApplications.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No applications match your filter criteria.
              </div>
            ) : (
              filteredApplications.map((app, idx) => (
                <div key={idx} className="widget hover:border-[var(--accent-secondary)]" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: '1px solid var(--glass-border)', transition: 'all 0.2s ease', background: 'var(--bg-secondary)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ flex: '1 1 auto' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building size={20} className="text-muted" /> {app.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', flexWrap: 'wrap' }}>
                        {app.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {app.location}</span>}
                        {app.minPercentage && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {app.minPercentage}%</span>}
                        {app.level && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>{app.level}</span>}
                      </div>

                      <div style={{ marginTop: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                            <User size={16} className="text-muted" /> {app.studentName}
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Phone size={14} className="text-muted" /> {app.studentPhone}
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '10px' }}>
                            Submitted By: <span style={{ color: 'var(--text-main)', fontWeight: 500, background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-secondary)' }}>{app.counselorName}</span>
                         </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <CheckSquare size={14} /> Finalized
                      </span>
                    </div>
                  </div>

                  {app.programs && app.programs.length > 0 && (
                    <div style={{ marginTop: '5px', paddingTop: '15px', borderTop: '1px dashed var(--glass-border)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied Programs</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {app.programs.map((prog, pIdx) => (
                          <div key={pIdx} style={{ background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            <CheckSquare size={14} className="text-muted" />
                            {prog}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerApplications;
