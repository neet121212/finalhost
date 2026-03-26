import React from 'react';
import { Building, MapPin, GraduationCap, CheckSquare, FileText } from 'lucide-react';

const AppliedUniversities = ({ profile }) => {
  const appliedUniversities = (profile?.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);

  return (
    <div className="view-standard" style={{ animation: 'fadeIn 0.3s ease' }}>
      <header className="dash-header">
        <div>
          <h1>Applied Universities</h1>
          <p>Review the record of all academic applications submitted to your target institutions.</p>
        </div>
      </header>

      {appliedUniversities.length === 0 ? (
        <div className="widget placeholder-panel mt-4">
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--glass-border)', margin: '0 auto 15px auto' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Applications Filed</h3>
            <p style={{ color: 'var(--text-muted)' }}>You have not submitted your profile to any universities yet. Use the Course Finder to begin your journey.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {appliedUniversities.map((uni, idx) => (
            <div key={idx} className="widget" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--accent-secondary)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building size={20} className="text-muted" /> {uni.name}
                </h3>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {uni.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Min. {uni.minPercentage}%</span>
                </div>
              </div>
              <div style={{ padding: '20px', flex: 1, background: 'var(--card-bg-solid)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied Programs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  {uni.programs && uni.programs.map((prog, pIdx) => (
                    <div key={pIdx} style={{ background: 'var(--bg-secondary)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <CheckSquare size={16} className="text-muted" />
                      {prog}
                    </div>
                  ))}
                </div>
                
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admission Requirements</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Minimum Percentage</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{uni.minPercentage}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Program Level</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{uni.level}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ranking Strategy</span>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{uni.ranking}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Institution Type</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{uni.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Application Status</span>
                    <span style={{ color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Submitted & Locked</span>
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

export default AppliedUniversities;
