import React, { useState, useEffect } from 'react';
import { Search, Building, MapPin, GraduationCap, FileText, User, Users, CheckCircle, Phone, CheckSquare } from 'lucide-react';
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
      allApplications.push({
        ...app,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        studentEmail: student.email,
        studentPhone: student.phone,
        counselorName: student.assignedCounselor ? student.assignedCounselor.name : 'Unassigned',
      });
    });
  });

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {allApplications.map((app, idx) => (
            <div key={idx} className="widget" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--accent-secondary)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building size={18} className="text-muted" /> {app.name}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {app.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {app.minPercentage}%</span>
                </div>
              </div>
              
              <div style={{ padding: '20px', flex: 1, background: 'var(--card-bg-solid)' }}>
                
                {/* APPLICANT INFO */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant Details</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                      <User size={14} className="text-muted" /> {app.studentName}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <Phone size={14} className="text-muted" /> {app.studentPhone}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--glass-border)' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Counselor</span>
                     <span style={{ color: 'var(--text-main)' }}>{app.counselorName}</span>
                   </div>
                </div>

                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied Programs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {app.programs && app.programs.map((prog, pIdx) => (
                    <div key={pIdx} style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      <CheckSquare size={14} className="text-muted" />
                      {prog}
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                     <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>Finalized</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</span>
                     <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}>{app.level}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerApplications;
