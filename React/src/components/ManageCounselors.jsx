import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Select from 'react-select';
import { Country } from 'country-state-city';

const ALLOWED_COUNTRIES = []; // Deprecated, enabling global support

const ManageCounselors = ({ setMessage }) => {
  const [counselors, setCounselors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '+91 ', specialty: '', country: null });

  useEffect(() => {
    fetchCounselors();
    
    const all = Country.getAllCountries();
    const sorted = all.sort((a, b) => {
      if (a.isoCode === 'IN') return -1;
      if (b.isoCode === 'IN') return 1;
      return a.name.localeCompare(b.name);
    });
    setCountries(sorted.map(c => ({ value: c.isoCode, label: c.isoCode, phonecode: c.phonecode })));
  }, []);

  const fetchCounselors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/erp/counselors', {
        headers: { 'x-auth-token': localStorage.getItem('token') || sessionStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setCounselors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const pCode = selectedOption && selectedOption.phonecode ? `+${selectedOption.phonecode} ` : '+91 ';
    setFormData({ ...formData, country: selectedOption, phone: pCode });
  };

  const enforcePhonePrefix = (e) => {
    let { name, value } = e.target;
    // Shred all alphabets
    value = value.replace(/[^\d+ ]/g, '');
    const prefix = formData.country && formData.country.phonecode ? `+${formData.country.phonecode} ` : '+91 ';
    
    if (!value.startsWith(prefix)) {
      setFormData(prev => ({ ...prev, [name]: prefix }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value.slice(0, prefix.length + 10) }));
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent-secondary)' : 'var(--input-border)',
      color: 'var(--text-main)',
      minHeight: '42px',
      boxShadow: 'none',
      cursor: 'pointer',
      '&:hover': { borderColor: 'var(--accent-secondary)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      zIndex: 100,
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgba(59, 130, 246, 0.15)' 
        : state.isFocused ? 'rgba(128, 128, 128, 0.1)' : 'transparent',
      color: state.isSelected ? 'var(--accent-secondary)' : 'var(--text-main)',
      cursor: 'pointer',
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
    input: (base) => ({ ...base, color: 'var(--text-main)' }),
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/erp/counselors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || sessionStorage.getItem('token')
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setMessage({ text: 'Counselor added successfully.', type: 'success' });
        setFormData({ name: '', email: '', phone: '+91 ', specialty: '', country: null });
        fetchCounselors();
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Failed to add counselor.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error.', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove counselor?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/erp/counselors/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': localStorage.getItem('token') || sessionStorage.getItem('token') }
      });
      if (response.ok) {
        setMessage({ text: 'Counselor removed successfully.', type: 'success' });
        fetchCounselors();
      }
    } catch (err) {
      setMessage({ text: 'Failed to delete counselor.', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className="view-counselors">
      <header className="dash-header">
        <div>
          <h1>Manage Counselors</h1>
          <p>Add or remove admission counselors from the network.</p>
        </div>
      </header>

      <div className="widget" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) 100px 1.5fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px'}}>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px'}}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px'}}>Prefix</label>
            <Select 
              name="country" value={formData.country} onChange={handleSelectChange} 
              options={countries} styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="IN" isSearchable={false}
            />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px'}}>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={enforcePhonePrefix} required className="theme-input" />
          </div>
          <div>
            <label className="text-muted" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px'}}>Specialty</label>
            <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. UK Visas" className="theme-input" />
          </div>
          <button type="submit" className="btn-primary" style={{padding: '8px 20px', height: '37px'}}>Add</button>
        </form>
      </div>

      <div className="widget placeholder-panel">
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead>
            <tr className="theme-header-bg">
              <th style={{padding: '10px'}}>Name</th>
              <th style={{padding: '10px'}}>Email</th>
              <th style={{padding: '10px'}}>Phone</th>
              <th style={{padding: '10px'}}>Specialty</th>
              <th style={{padding: '10px', width: '50px'}}></th>
            </tr>
          </thead>
          <tbody>
            {counselors.map(c => (
              <tr key={c._id} className="theme-row-border">
                <td style={{padding: '10px'}}>{c.name}</td>
                <td style={{padding: '10px'}} className="text-muted">{c.email}</td>
                <td style={{padding: '10px'}} className="text-muted">{c.phone}</td>
                <td style={{padding: '10px'}}>
                  <span style={{background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>
                    {c.specialty}
                  </span>
                </td>
                <td style={{padding: '10px', textAlign: 'center'}}>
                  <button onClick={() => handleDelete(c._id)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: '0.7'}}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {counselors.length === 0 && (
              <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#9ca3af'}}>No active counselors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCounselors;
