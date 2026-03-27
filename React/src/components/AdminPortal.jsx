import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Trash2, LogOut, ShieldAlert, Edit2, ChevronLeft, Save, Plus, 
  MapPin, Phone, Briefcase, GraduationCap, Building2, UserCircle, KeyRound,
  Database, Server, ShieldCheck, Mail, Sun, Moon, Monitor, Globe
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useTheme } from '../ThemeContext';

const AdminPortal = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, partners, all
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Editor State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, targetId: null });

  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return navigate('/');
    try {
      const meRes = await fetch(`${API_BASE_URL}/auth/me`, { headers: { 'x-auth-token': token } });
      const meData = await meRes.json();
      if (!meRes.ok || meData.role !== 'admin') {
        return navigate('/dashboard'); 
      }
      fetchUsers(token);
    } catch (err) {
      navigate('/');
    }
  };

  const fetchUsers = async (token) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { 'x-auth-token': token } });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      setMessage({ text: 'Database synchronization failed', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setMessage({ text: '', type: '' });
    setSelectedUser(user);
    setFormData(user);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setMessage({ text: '', type: '' });
    setSelectedUser(null);
    setIsAdding(true);
    setFormData({ role: 'student', phone: '+91 ', whatsapp: '+91 ' }); // safe defaults
  };

  const cancelEdit = () => {
    setSelectedUser(null);
    setIsAdding(false);
    setFormData({});
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirmDialog({ isOpen: true, action: 'save', targetId: null });
  };

  const executeSave = async () => {
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    setMessage({ text: 'Committing to database...', type: 'info' });
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      // Determine if POST (Add) or PUT (Edit)
      const isNew = isAdding;
      const url = isNew ? `${API_BASE_URL}/admin/users` : `${API_BASE_URL}/admin/users/${selectedUser._id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Validation
      if (!formData.email || !formData.firstName) {
        return setMessage({ text: 'First Name and Email are strictly required fields.', type: 'error' });
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: isNew ? 'Account successfully securely provisioned.' : 'Database record successfully updated.', type: 'success' });
        if (isNew) {
           setUsers([data.user, ...users]);
        } else {
           setUsers(users.map(u => u._id === data.user._id ? data.user : u));
        }
        setTimeout(() => cancelEdit(), 1500);
      } else {
        setMessage({ text: data.error || 'Failed to modify database', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Sever Connection Error', type: 'error' });
    }
  };

  const handleDeleteUser = (id, isSelf) => {
    if (isSelf) return alert("System prevents obliterating your own active session account.");
    setConfirmDialog({ isOpen: true, action: 'delete', targetId: id });
  };

  const executeDelete = async () => {
    const id = confirmDialog.targetId;
    setConfirmDialog({ isOpen: false, action: null, targetId: null });
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        setMessage({ text: 'Entity permanently erased from database.', type: 'success' });
        if (selectedUser && selectedUser._id === id) cancelEdit();
      } else {
        setMessage({ text: 'Failed to erase entity', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error during deletion', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // Filtered views
  const filteredUsers = useMemo(() => {
    const nonAdmins = users.filter(u => u.role !== 'admin');
    if (activeTab === 'all' || activeTab === 'overview') return nonAdmins;
    if (activeTab === 'direct_students') return nonAdmins.filter(u => u.role === 'student' && !u.registeredBy);
    if (activeTab === 'partner_students') return nonAdmins.filter(u => u.role === 'student' && !!u.registeredBy);
    if (activeTab === 'partners') return nonAdmins.filter(u => u.role === 'partner');
    return nonAdmins;
  }, [users, activeTab]);

  const stats = {
    total: users.length - users.filter(u => u.role === 'admin').length,
    directStudents: users.filter(u => u.role === 'student' && !u.registeredBy).length,
    partnerStudents: users.filter(u => u.role === 'student' && !!u.registeredBy).length,
    partners: users.filter(u => u.role === 'partner').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) return (
    <div className="dash-universe loading" style={{ background: 'var(--bg-primary)' }}>
      <div className="loader" style={{ borderTopColor: 'var(--accent-secondary)' }}></div>
      <p style={{ color: 'var(--text-main)', letterSpacing: '2px', textTransform: 'uppercase' }}>Authenticating God Mode...</p>
    </div>
  );

  return (
    <div className="dash-universe" style={{ display: 'flex', background: 'var(--bg-primary)', color: 'var(--text-main)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR PANEL */}
      <aside className="dash-sidebar" style={{ width: '280px', padding: '2rem 1.5rem', background: 'var(--bg-secondary)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>SysAdmin</h2>
              <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '1px' }}>ROOT ACCESS</div>
            </div>
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
            <LogOut size={18}/> Secure Disconnect
          </button>
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => {setActiveTab('overview'); cancelEdit();}}>
            <Database size={18}/> Global Overview
          </button>
          <div className="nav-divider" style={{ background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <button className={`nav-item ${activeTab === 'direct_students' ? 'active' : ''}`} onClick={() => {setActiveTab('direct_students'); cancelEdit();}}>
            <GraduationCap size={18}/> Direct Students
          </button>
          <button className={`nav-item ${activeTab === 'partner_students' ? 'active' : ''}`} onClick={() => {setActiveTab('partner_students'); cancelEdit();}}>
            <Users size={18}/> Partner Students
          </button>
          <button className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`} onClick={() => {setActiveTab('partners'); cancelEdit();}}>
            <Briefcase size={18}/> Business Partners
          </button>
        </nav>

      </aside>

      {/* MAIN CONTENT PANEL */}
      <main className="dash-main" style={{ padding: '2.5rem 3rem', flex: 1, overflowY: 'auto' }}>
        
        {message.text && (
          <div className="status-pill" style={{ 
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
             {message.type === 'error' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
             {message.text}
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: LEDGER TABLE */}
        {/* -------------------------------------------------------------------------------- */}
        {(!selectedUser && !isAdding) && (
          <div className="animate-fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ color: 'var(--text-main)', fontSize: '2rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {activeTab === 'overview' ? 'System Overview' : activeTab === 'all' ? 'Master Ledger' : activeTab === 'direct_students' ? 'Direct Student Database' : activeTab === 'partner_students' ? 'Partner-Registered Students' : 'Partner Database'}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Directly manage and manipulate raw data records.</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Theme Toggle Group */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <button onClick={() => setTheme('light')} style={{ background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Light Mode"><Sun size={14}/></button>
                  <button onClick={() => setTheme('dark')} style={{ background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Dark Mode"><Moon size={14}/></button>
                  <button onClick={() => setTheme('system')} style={{ background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="System Sync"><Monitor size={14}/></button>
                </div>

                <button className="btn-save" onClick={handleAddNew} style={{ background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', color: '#fff' }}>
                  <Plus size={18} /> Create Account
                </button>
              </div>
            </header>

            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '25px', borderRadius: '16px' }}>
                   <div style={{ color: '#60a5fa', fontSize: '2.5rem', fontWeight: 800 }}>{stats.total}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Total Records</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '25px', borderRadius: '16px' }}>
                   <div style={{ color: '#34d399', fontSize: '2.5rem', fontWeight: 800 }}>{stats.directStudents}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Direct Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '25px', borderRadius: '16px' }}>
                   <div style={{ color: '#fbbf24', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partnerStudents}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partner Students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '25px', borderRadius: '16px' }}>
                   <div style={{ color: '#c084fc', fontSize: '2.5rem', fontWeight: 800 }}>{stats.partners}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Partners</div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Users size={18} color="#10b981" />
                  Showing <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{filteredUsers.length}</span> Active Database Records
               </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Synchronized</div>
            </div>
            
            <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                  <tr>
                    <th style={{ padding: '18px 24px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Entity Name</th>
                    <th style={{ padding: '18px 24px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Identifiers</th>
                    <th style={{ padding: '18px 24px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Access Level</th>
                    <th style={{ padding: '18px 24px', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #27272a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>{u.firstName} {u.lastName}</div>
                            {u.role === 'partner' && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems:'center', gap:'4px' }}><Building2 size={10}/> {u.companyName || 'No Company'}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.phone || 'No Phone Data'}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing:'0.5px',
                          background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : u.role === 'partner' ? 'rgba(124,58,237,0.1)' : 'rgba(16,185,129,0.1)',
                          color: u.role === 'admin' ? '#ef4444' : u.role === 'partner' ? '#a78bfa' : '#34d399',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : u.role === 'partner' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)'}`
                         }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleEdit(u)} style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                            <Edit2 size={14} /> Modify
                          </button>
                          <button onClick={() => handleDeleteUser(u._id, u.role === 'admin')} disabled={u.role === 'admin'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, opacity: u.role === 'admin' ? 0.3 : 1 }}>
                            <Trash2 size={14} /> Obliterate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                     <tr><td colSpan="4" style={{ padding: '50px 30px', textAlign: 'center', color: '#a1a1aa' }}>
                        <Database size={40} style={{ margin: '0 auto 15px auto', opacity: 0.2 }} />
                        <div>No entities match this criteria.</div>
                     </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* -------------------------------------------------------------------------------- */}
        {/* VIEW: DATA EDITOR / CREATOR */}
        {/* -------------------------------------------------------------------------------- */}
        {(selectedUser || isAdding) && (
          <div className="animate-fade-in">
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <button onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Return to Ledger
                </button>
                <h1 style={{ color: 'var(--text-main)', fontSize: '2rem', margin: '0 0 8px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {isAdding ? "Create Master Entity" : "Entity Configuration"}
                  {!isAdding && <span style={{ fontSize: '0.85rem', background: 'var(--input-bg)', padding:'4px 12px', borderRadius:'12px', color:'var(--text-muted)', border: '1px solid var(--glass-border)', fontWeight:'normal' }}>ID: {selectedUser._id}</span>}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Absolute control over database structure vectors.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {!isAdding && (
                  <button onClick={() => handleDeleteUser(selectedUser._id, selectedUser.role === 'admin')} disabled={selectedUser.role === 'admin'} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: selectedUser.role === 'admin' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: selectedUser.role === 'admin' ? 0.3 : 1 }}>
                    <Trash2 size={16} /> Destroy
                  </button>
                )}
                <button onClick={handleSave} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -10px rgba(16, 185, 129, 0.5)' }}>
                  <Save size={16} /> Commit Changes
                </button>
              </div>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* SECTION: ACCESS CONTROL */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '30px' }}>
                 <h3 style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'var(--text-main)', margin:'0 0 20px 0', fontSize:'1.1rem' }}><Server size={18} color="#a78bfa"/> System & Access Configuration</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clearance Level (Role) *</label>
                       <select name="role" value={formData.role || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                         <option value="student" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Student (Standard)</option>
                         <option value="partner" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Business Partner</option>
                       </select>
                    </div>
                    {isAdding && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Initial Master Password</label>
                        <input type="text" name="password" value={formData.password || ''} onChange={handleChange} placeholder="Auto-generated if left blank" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                    )}
                 </div>
              </div>

              {/* SECTION: PERSONAL IDENTITY */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '30px' }}>
                 <h3 style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'var(--text-main)', margin:'0 0 20px 0', fontSize:'1.1rem' }}><UserCircle size={18} color="#60a5fa"/> Personal Identity Vector</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Email *</label>
                       <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>First Name / Given Name *</label>
                       <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Name / Surname</label>
                       <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                 </div>
              </div>

              {/* SECTION: CONNECTIVITY & LOCATION */}
              <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '30px' }}>
                 <h3 style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'var(--text-main)', margin:'0 0 20px 0', fontSize:'1.1rem' }}><Globe size={18} color="#34d399"/> Geolocation & Connectivity Nodes</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Signature</label>
                       <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Signature</label>
                       <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sovereign Country</label>
                       <input type="text" name="country" value={formData.country || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>State / Province</label>
                       <input type="text" name="state" value={formData.state || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>City</label>
                       <input type="text" name="city" value={formData.city || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                    </div>
                 </div>
              </div>

              {/* SECTION: REGISTRATION METADATA (For Students Registered by Partners) */}
              {formData.role === 'student' && formData.registeredBy && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '30px' }}>
                   <h3 style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'var(--text-main)', margin:'0 0 20px 0', fontSize:'1.1rem' }}><Building2 size={18} color="#fbbf24"/> Business Channel Metadata</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Originating Partner ID</label>
                         <div style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', cursor: 'default', fontSize: '0.9rem', opacity: 0.8 }}>
                           {formData.registeredBy}
                         </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Channel Source</label>
                         <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>PARTNER REGISTERED ENTITY</div>
                      </div>
                   </div>
                </div>
              )}

              {/* SECTION: PARTNER ONLY (DYNAMIC) */}
              {formData.role === 'partner' && (
                <div style={{ background: 'var(--card-bg-solid)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '16px', padding: '30px', boxShadow: '0 0 30px rgba(124, 58, 237, 0.05)' }}>
                   <h3 style={{ display: 'flex', alignItems: 'center', gap:'10px', color:'var(--text-main)', margin:'0 0 20px 0', fontSize:'1.1rem' }}><Briefcase size={18} color="#a78bfa"/> Business B2B Configuration</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Entity Name</label>
                         <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Headquarters Address</label>
                         <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizational Designation</label>
                         <input type="text" name="designation" value={formData.designation || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reported Team Size Payload</label>
                         <input type="text" name="teamSize" value={formData.teamSize || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Student Tracking Key (Unique ID)</label>
                         <input type="text" name="studentUniqueId" value={formData.studentUniqueId || ''} onChange={handleChange} style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '12px 15px', borderRadius: '8px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', gridColumn: '1 / -1', marginTop: '10px' }}>
                         <input type="checkbox" name="priorExperience" checked={formData.priorExperience || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }} />
                         <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>Bypass Verification (Has Prior Overseas Experience)</label>
                      </div>
                   </div>
                </div>
              )}

            </form>
          </div>
        )}

      </main>

      {/* CONFIRMATION MODAL OVERLAY */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'var(--card-bg-solid)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              {confirmDialog.action === 'delete' ? <Trash2 color="#ef4444" /> : <Save color="#10b981" />} 
              {confirmDialog.action === 'delete' ? 'Confirm Deletion' : 'Confirm Changes'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {confirmDialog.action === 'delete' 
                ? "This will permanently obliterate the user and all associated application data. This destructive action cannot be undone. Proceed?"
                : "Are you sure you want to permanently commit these modifications to the global database?"}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog({ isOpen: false, action: null, targetId: null })} style={{ padding: '10px 20px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmDialog.action === 'delete' ? executeDelete : executeSave} style={{ padding: '10px 20px', background: confirmDialog.action === 'delete' ? '#ef4444' : '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                {confirmDialog.action === 'delete' ? 'Obliterate Entity' : 'Commit Database Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
