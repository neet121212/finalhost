import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  Mail, Lock, User, MapPin, Phone, Globe, Smartphone, 
  KeyRound, CheckSquare, Square, Building2, Users, Briefcase,
  Sun, Moon, Monitor, Eye, EyeOff
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import './Auth.css';
import { API_BASE_URL } from './config';

import { Country, State, City } from 'country-state-city';

const ALLOWED_COUNTRIES = []; // Deprecated, lifting restriction

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [role, setRole] = useState('student'); // 'student', 'partner'
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPartnerPopup, setShowPartnerPopup] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      background: 'rgba(15, 10, 30, 0.98)',
      borderColor: 'rgba(255,255,255,0.2)',
      color: '#fff',
      boxShadow: 'none',
      minHeight: '42px',
      '&:hover': { borderColor: 'var(--accent-primary)' }
    }),
    menu: (provided) => ({
      ...provided,
      background: 'rgb(18, 12, 35)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
      zIndex: 9999
    }),
    menuList: (provided) => ({
      ...provided,
      background: 'rgb(18, 12, 35)',
      padding: 0
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isSelected
        ? 'var(--accent-primary)'
        : state.isFocused
          ? 'rgba(124, 58, 237, 0.25)'
          : 'transparent',
      color: state.isSelected ? '#fff' : '#e2e8f0',
      cursor: 'pointer',
      ':active': { background: 'rgba(124, 58, 237, 0.4)' }
    }),
    singleValue: (provided) => ({ ...provided, color: '#fff' }),
    input: (provided) => ({ ...provided, color: '#fff' }),
    placeholder: (provided) => ({ ...provided, color: 'rgba(255,255,255,0.4)' }),
    dropdownIndicator: (provided) => ({ ...provided, color: 'rgba(255,255,255,0.5)' }),
    clearIndicator: (provided) => ({ ...provided, color: 'rgba(255,255,255,0.5)' }),
    indicatorSeparator: (provided) => ({ ...provided, background: 'rgba(255,255,255,0.2)' })
  };

  const startShowPassword = () => setShowPassword(true);
  const stopShowPassword = () => setShowPassword(false);

  const passwordToggleProps = {
    onMouseDown: startShowPassword,
    onMouseUp: stopShowPassword,
    onMouseLeave: stopShowPassword,
    onTouchStart: startShowPassword,
    onTouchEnd: stopShowPassword,
    style: { cursor: 'pointer', color: 'var(--text-muted)' }
  };

  useEffect(() => {
    // Auto-redirect if token exists in either storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const all = Country.getAllCountries();
    const sorted = all.sort((a, b) => {
      if (a.isoCode === 'IN') return -1;
      if (b.isoCode === 'IN') return 1;
      return a.name.localeCompare(b.name);
    });
    setCountries(sorted.map(c => ({ value: c.isoCode, label: c.name, phonecode: c.phonecode })));
  }, []);

  // Unified state for fields across both forms
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', 
    country: null, state: null, city: null, 
    phone: '+91 ', whatsapp: '+91 ', email: '', 
    password: '', confirmPassword: '',
    // Partner specifics
    companyName: '', companyAddress: '', teamSize: '', priorExperience: false, designation: '', studentUniqueId: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: selectedOption };
      
      if (name === 'country') {
        updated.state = null;
        updated.city = null;
        if (selectedOption) {
          const pCode = selectedOption.phonecode ? `+${selectedOption.phonecode} ` : '+91 ';
          updated.phone = pCode;
          updated.whatsapp = pCode;
          setStates(State.getStatesOfCountry(selectedOption.value).map(s => ({ value: s.isoCode, label: s.name })));
        } else {
          setStates([]);
        }
        setCities([]);
      } else if (name === 'state') {
        updated.city = null;
        if (selectedOption && updated.country) {
          setCities(City.getCitiesOfState(updated.country.value, selectedOption.value).map(c => ({ value: c.name, label: c.name })));
        } else {
          setCities([]);
        }
      }
      
      return updated;
    });
  };

  const enforcePhonePrefix = (e) => {
    let { name, value } = e.target;
    // Aggressively stripe alphabets and bad characters instantly
    value = value.replace(/[^\d+ ]/g, '');
    const prefix = formData.country && formData.country.phonecode ? `+${formData.country.phonecode} ` : '+91 ';
    
    if (!value.startsWith(prefix)) {
      setFormData(prev => ({ ...prev, [name]: prefix }));
    } else {
      const truncated = value.slice(0, prefix.length + 10);
      setFormData(prev => ({ ...prev, [name]: truncated }));
    }
  };

  const validateSignup = (targetRole) => {
    if (targetRole === 'student') {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ text: 'Passwords do not match.', type: 'error' });
        return false;
      }
      if (formData.password && formData.password.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
        return false;
      }
    }
    if (!formData.country || !formData.state || !formData.city) {
      setMessage({ text: 'Please select Country, State, and City.', type: 'error' });
      return false;
    }
    if (targetRole === 'partner' && !formData.companyName) {
      setMessage({ text: 'Company Name is required for Partners.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSignup = async (e, forcedRole) => {
    e.preventDefault();
    if (!validateSignup(forcedRole)) return;
    setMessage({ text: forcedRole === 'partner' ? 'Submitting request...' : 'Registering profile...', type: 'info' });

    // Format data for backend
    const splitPhone = formData.phone.split(' ');
    const finalPhoneCode = splitPhone.length > 1 ? splitPhone[0] : (formData.country && formData.country.phonecode ? `+${formData.country.phonecode}` : '+91');
    const finalPhone = splitPhone.length > 1 ? splitPhone[1] : formData.phone;

    let finalWhatsappCode = finalPhoneCode;
    let finalWhatsapp = formData.whatsapp;
    if (formData.whatsapp) {
      const splitWhatsapp = formData.whatsapp.split(' ');
      finalWhatsappCode = splitWhatsapp.length > 1 ? splitWhatsapp[0] : finalPhoneCode;
      finalWhatsapp = splitWhatsapp.length > 1 ? splitWhatsapp[1] : formData.whatsapp;
    }

    const payload = {
      ...formData,
      phoneCode: finalPhoneCode,
      phone: finalPhone,
      whatsappCode: finalWhatsappCode,
      whatsapp: finalWhatsapp,
      role: forcedRole,
      country: formData.country ? formData.country.label : '',
      state: formData.state ? formData.state.label : '',
      city: formData.city ? formData.city.label : ''
    };

    try {
      const endpoint = forcedRole === 'partner' ? `${API_BASE_URL}/auth/partner-request` : `${API_BASE_URL}/auth/signup`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        if (forcedRole === 'partner') {
          setShowPartnerPopup(true);
          setMode('login');
          setMessage({ text: '', type: '' });
        } else {
          setMessage({ text: `Registered successfully as Student. Please login.`, type: 'success' });
          setMode('login');
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }
      } else {
        setMessage({ text: data.error || 'Registration failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Logging in...', type: 'info' });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.email, password: formData.password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Clear any old tokens first
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        if (keepSignedIn) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('keepSignedIn', 'true');
        } else {
          sessionStorage.setItem('token', data.token);
          localStorage.removeItem('keepSignedIn');
        }
        
        setMessage({ text: 'Login successful.', type: 'success' });
        navigate('/dashboard'); 
      } else {
        setMessage({ text: data.error || 'Invalid credentials.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable.', type: 'error' });
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setMessage({ text: 'Password recovery link sent.', type: 'success' });
  };

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  };

  // Reusable Select Component block
  const renderLocationSelects = () => (
    <>
      <div className="input-group">
        <label>Country*</label>
        <div className="select-wrapper">
          <Globe className="input-icon" />
          <Select 
            name="country"
            value={formData.country}
            onChange={handleSelectChange}
            options={countries}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search Country"
            isSearchable
            required
          />
        </div>
      </div>
      <div className="input-group">
        <label>State*</label>
        <div className="select-wrapper">
          <MapPin className="input-icon" />
          <Select 
            name="state"
            value={formData.state}
            onChange={handleSelectChange}
            options={states}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search State"
            isSearchable
            required
            isDisabled={!formData.country}
          />
        </div>
      </div>
      <div className="input-group">
        <label>City*</label>
        <div className="select-wrapper">
          <MapPin className="input-icon" />
          <Select 
            name="city"
            value={formData.city}
            onChange={handleSelectChange}
            options={cities}
            styles={customSelectStyles}
            classNamePrefix="react-select"
            placeholder="Search City"
            isSearchable
            required
            isDisabled={!formData.state}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="auth-universe" onMouseMove={handleMouseMove}>
      <div className="mouse-glow"></div>
      {/* GLOBAL THEME TOGGLE */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', background: 'var(--glass-bg)', padding: '5px', borderRadius: '10px', zIndex: 100, border: '1px solid var(--glass-border)' }}>
        <button onClick={() => setTheme('light')} style={{ background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Light Mode"><Sun size={14} /></button>
        <button onClick={() => setTheme('dark')} style={{ background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Dark Mode"><Moon size={14} /></button>
        <button onClick={() => setTheme('system')} style={{ background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="System Auto"><Monitor size={14} /></button>
      </div>
      <div className="particles-layer"></div>
      
      {/* Cinematic Dreamy Tech Nebula Orbs (Dark) */}
      <div className="nebula-orb nebula-orb-1"></div>
      <div className="nebula-orb nebula-orb-2"></div>
      <div className="nebula-orb nebula-orb-3"></div>
      <div className="noise-overlay"></div>

      {/* Light Mode: Frosted Glass Geometric Shapes */}
      <div className="geo-shape geo-shape-1"></div>
      <div className="geo-shape geo-shape-2"></div>
      <div className="geo-shape geo-shape-3"></div>
      <div className="geo-shape geo-shape-4"></div>
      <div className="geo-shape geo-shape-5"></div>
      <div className="geo-shape geo-shape-6"></div>
    


      <div className={`auth-glass-container ${mode === 'signup' ? 'signup-mode' : ''}`}>
        
        {/* HERO SECTION */}
        <div className="auth-hero">
          <div className="brand-header">
            <img src="/logo.png" alt="Presume Overseas Logo" className="brand-logo-image" />
          </div>
          <p className="tagline">Guiding You From Dreams To Destinations Worldwide</p>
          <p className="hero-desc">Experience seamless international education tracking and powerful partner tools embedded in a premium networking environment.</p>
        </div>

        {/* FORMS */}
        <div className="auth-content single-layout">
          <div className="content-header">
            <h2>
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Recover Password'}
            </h2>
            <p>
              {mode === 'login' ? 'Please log in with your credentials.' 
                : mode === 'signup' ? 'Register as a Student or Business Partner below.' 
                : 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {message.text && <div className={`status-pill ${message.type}`}>{message.text}</div>}

          {/* ROLE SELECTOR ON SIGNUP */}
          {mode === 'signup' && (
            <div className="role-tabs animated-fade-in">
              <button type="button" className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                <User size={18} /> Student Registration
              </button>
              <button type="button" className={`role-tab ${role === 'partner' ? 'active' : ''}`} onClick={() => setRole('partner')}>
                <Briefcase size={18} /> Business Partner Registration
              </button>
            </div>
          )}

          {mode === 'signup' && role === 'student' && (
            <div className="single-form-wrapper">
              <div className="form-column">
              {/* === STUDENT FORM === */}
                <form onSubmit={(e) => handleSignup(e, 'student')} className="auth-form form-sub-grid">
                  <div className="input-group"><label>Email*</label><div className="input-container"><Mail className="input-icon"/><input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="student@example.com" required /></div></div>
                  <div className="input-group"><label>First Name*</label><div className="input-container"><User className="input-icon"/><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="auth-input" placeholder="First Name" required /></div></div>
                  <div className="input-group"><label>Last Name</label><div className="input-container"><User className="input-icon"/><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="auth-input" placeholder="Last Name" /></div></div>
                  {renderLocationSelects()}
                  <div className="input-group"><label>Phone*</label><div className="input-container"><Phone className="input-icon"/><input type="tel" name="phone" value={formData.phone} onChange={enforcePhonePrefix} className="auth-input" required /></div></div>
                  <div className="input-group"><label>WhatsApp</label><div className="input-container"><Smartphone className="input-icon"/><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={enforcePhonePrefix} className="auth-input" /></div></div>
                  <div className="input-group"><label>Password*</label><div className="input-container"><Lock className="input-icon"/><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="auth-input" placeholder="••••••••" required /><div className="password-toggle" {...passwordToggleProps}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></div>
                  <div className="input-group"><label>Confirm Password*</label><div className="input-container"><Lock className="input-icon"/><input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="auth-input" placeholder="••••••••" required /><div className="password-toggle" {...passwordToggleProps}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></div>
                  <button type="submit" className="btn-primary mt-2">Complete Student Signup</button>
                </form>
              </div>
            </div>
          )}

          {/* === PARTNER FORM === */}
          {mode === 'signup' && role === 'partner' && (
            <div className="single-form-wrapper form-transition-enter">
              <div className="form-column">
                <form onSubmit={(e) => handleSignup(e, 'partner')} className="auth-form form-sub-grid">
                  <div className="input-group"><label>Company Name*</label><div className="input-container"><Building2 className="input-icon"/><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="auth-input" placeholder="Company Name" required /></div></div>
                  <div className="input-group"><label>Company Address*</label><div className="input-container"><MapPin className="input-icon"/><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="auth-input" placeholder="Company Address" required /></div></div>
                  <div className="input-group"><label>Designation*</label><div className="input-container"><Briefcase className="input-icon"/><input type="text" name="designation" value={formData.designation} onChange={handleChange} className="auth-input" placeholder="Designation (e.g. CEO, Manager)" required /></div></div>
                  <div className="input-group"><label>Student Unique ID</label><div className="input-container"><KeyRound className="input-icon"/><input type="text" name="studentUniqueId" value={formData.studentUniqueId} onChange={handleChange} className="auth-input" placeholder="Optional Agency Tracker ID" /></div></div>
                  <div className="input-group"><label>Email*</label><div className="input-container"><Mail className="input-icon"/><input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="partner@example.com" required /></div></div>
                  <div className="input-group"><label>First Name*</label><div className="input-container"><User className="input-icon"/><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="auth-input" placeholder="First Name" required /></div></div>
                  <div className="input-group"><label>Last Name</label><div className="input-container"><User className="input-icon"/><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="auth-input" placeholder="Last Name" /></div></div>
                  {renderLocationSelects()}
                  <div className="input-group"><label>Team Size*</label><div className="input-container"><Users className="input-icon"/><input type="number" name="teamSize" value={formData.teamSize} onChange={handleChange} className="auth-input" placeholder="e.g. 10" required /></div></div>
                  <div className="input-group"><label>Phone*</label><div className="input-container"><Phone className="input-icon"/><input type="tel" name="phone" value={formData.phone} onChange={enforcePhonePrefix} className="auth-input" required /></div></div>
                  <div className="input-group"><label>WhatsApp</label><div className="input-container"><Smartphone className="input-icon"/><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={enforcePhonePrefix} className="auth-input" /></div></div>
                  <div className="input-group col-span-2"><label className="checkbox-group"><input type="checkbox" name="priorExperience" checked={formData.priorExperience} onChange={handleChange} /><div className="custom-checkbox"><CheckSquare size={16} className="check-mark" /></div><span>Prior experience in study abroad?</span></label></div>
                  <button type="submit" className="btn-primary">Complete Partner Signup</button>
                </form>
              </div>
            </div>
          )}


          {/* ====================================================== */}
          {/* LOGIN FORM */}
          {/* ====================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label>Email OR Phone Number*</label>
                <div className="input-container">
                  <User className="input-icon" />
                  <input type="text" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="Email or Phone Number" required />
                </div>
              </div>

              <div className="input-group">
                <label>Password*</label>
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="auth-input" placeholder="••••••••" required />
                  <div className="password-toggle" {...passwordToggleProps}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>

              <div className="login-extras">
                <label className="checkbox-group">
                  <input type="checkbox" checked={keepSignedIn} onChange={() => setKeepSignedIn(!keepSignedIn)} />
                  <div className="custom-checkbox">
                    <CheckSquare size={16} className="check-mark" />
                  </div>
                  <span>Keep me signed in</span>
                </label>
              </div>
              
              <button type="submit" className="btn-primary">Login</button>
            </form>
          )}

          {/* ====================================================== */}
          {/* FORGOT PASSWORD FORM */}
          {/* ====================================================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="auth-form">
              <div className="input-group">
                <label>Registered Email Address</label>
                <div className="input-container">
                  <KeyRound className="input-icon" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" placeholder="you@example.com" required />
                </div>
              </div>
              <button type="submit" className="btn-primary">Reset Password</button>
            </form>
          )}

          {/* FOOTER NAVIGATION */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                <span className="switch-mode">New user? <span className="switch-link" onClick={() => {setMode('signup'); setMessage({text:'', type:''});}}>Register here</span></span>
                <button type="button" className="forgot-btn" onClick={() => {setMode('forgot'); setMessage({text:'', type:''});}}>Forgot password?</button>
              </>
            ) : mode === 'signup' ? (
              <span className="switch-mode">Have an account? <span className="switch-link" onClick={() => {setMode('login'); setMessage({text:'', type:''});}}>Back to Login</span></span>
            ) : (
              <span className="switch-mode">Remembered it? <span className="switch-link" onClick={() => {setMode('login'); setMessage({text:'', type:''});}}>Back to Login</span></span>
            )}
          </div>

        </div>
      </div>

      {showPartnerPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', zIndex: 10000, justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg-solid, #18181b)', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--accent-primary, #7c3aed)', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <h2 style={{ color: '#fff', marginBottom: '15px', fontSize: '2rem' }}>🎉 Congratulations!</h2>
            <p style={{ color: 'var(--text-muted, #9ca3af)', marginBottom: '30px', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Your Business Partner registration request has been successfully submitted.<br/><br/>
              We will contact you soon to activate your ID & Password.
            </p>
            <button onClick={() => setShowPartnerPopup(false)} className="btn-primary" style={{ width: 'auto', padding: '12px 30px' }}>Okay, Back to Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;