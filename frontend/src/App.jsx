import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

// ── SVG Icons ─────────────────────────────────────────────
const Ic = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  projects:  <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>,
  apps:      <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/></>,
  bulletin:  <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  profile:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  post:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  chart:     <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  back:      <><polyline points="15 18 9 12 15 6"/></>,
  logout:    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  close:     <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  menu:      <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  chevron:   <><polyline points="9 18 15 12 9 6"/></>,
  check:     <><polyline points="20 6 9 17 4 12"/></>,
  edit:      <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>,
  info:      <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
};
const Icon = ({ name, size = 18 }) => <Ic d={ICONS[name]} size={size} />;

// ── Helpers ───────────────────────────────────────────────
const STATUS_LABEL = { submitted: 'Applied', shortlisted: 'Shortlisted', accepted: 'Selected', declined: 'Rejected' };
const STATUS_CLS   = { submitted: 'badge-submitted', shortlisted: 'badge-shortlisted', accepted: 'badge-accepted', declined: 'badge-declined' };
const PROJ_STATUS_CLS = { open: 'badge-open', active: 'badge-active', closed: 'badge-closed', archived: 'badge-archived' };
const BULLETIN_LABEL = { announcement: 'Announcement', deadline: 'Deadline', notice: 'Notice', general: 'General' };
const BULLETIN_CLS   = { announcement: 'badge-rose', deadline: 'badge-amber', notice: 'badge-sage', general: 'badge-gray' };
const ROLE_LABEL = { student: 'Student', faculty: 'Faculty', alumni: 'Alumni', admin: 'Admin' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const splitCSV = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean);

const calcCompletion = (profile) => {
  if (!profile) return 0;
  const checks = [profile.rollNumber, profile.branch, profile.year, profile.cgpa,
    profile.bio, profile.skills?.length > 0, profile.linkedinUrl, profile.githubUrl, profile.resumeUrl];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
};

// ── Branch options ────────────────────────────────────────
const BRANCHES = [
  'Computer Science Engineering',
  'Software Engineering',
  'Electronics & Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Information Technology',
  'Other',
];

// ── Initial form states ───────────────────────────────────
const INIT_AUTH = { name: '', email: '', password: '', role: 'student', rollNumber: '', branch: '', domain: '', position: '' };
const INIT_PROJ = { title: '', summary: '', description: '', domain: '', department: '', requiredSkills: '', eligibleYears: '', eligibleDepartments: '', minCgpa: '', duration: '', deadline: '', imageUrl: '', tags: '', futureProspectsText: '', futureProspectsMandatory: false };
const INIT_PROFILE = { headline: '', bio: '', department: '', rollNumber: '', branch: '', year: '', cgpa: '', domain: '', position: '', contactInfo: '', graduationYear: '', linkedinUrl: '', githubUrl: '', skills: '', interests: '', achievements: '' };
const INIT_BULLETIN = { title: '', content: '', type: 'general' };

// ─────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [token, setToken]       = useState(() => localStorage.getItem('portal_token') || '');
  const [user, setUser]         = useState(null);
  const [authMode, setAuthMode] = useState('login');  // login|register|forgot|reset
  const [authForm, setAuthForm] = useState(INIT_AUTH);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode]   = useState('');
  const [resetPwd, setResetPwd]     = useState('');

  // Navigation
  const [view, setView]             = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  // Data
  const [profile, setProfile]         = useState(null);
  const [projects, setProjects]       = useState([]);
  const [bulletins, setBulletins]     = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [adminStats, setAdminStats]   = useState(null);
  const [adminUsers, setAdminUsers]   = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null); // { msg, type }
  const [selectedProject, setSelectedProject] = useState(null);
  const [applyOpen, setApplyOpen]             = useState(false);
  const [applyPitch, setApplyPitch]           = useState('');
  const [expandedFacultyProj, setExpandedFacultyProj] = useState(null);

  // Filters
  const [search, setSearch]             = useState('');
  const [fDomain, setFDomain]           = useState('');
  const [fDept, setFDept]               = useState('');
  const [fStatus, setFStatus]           = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Forms
  const [projForm, setProjForm]       = useState(INIT_PROJ);
  const [profileForm, setProfileForm] = useState(INIT_PROFILE);
  const [bulletinForm, setBulletinForm] = useState(INIT_BULLETIN);
  const [reviewData, setReviewData]   = useState({}); // { appId: { remarks } }
  const [evalForms, setEvalForms]     = useState({});

  const resumeRef = useRef(null);
  const attachRef = useRef(null);

  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student' || user?.role === 'alumni';
  const isAdmin   = user?.role === 'admin';

  // ── Toast helper ─────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── API ───────────────────────────────────────────────────
  const api = useCallback(async (path, opts = {}, tok = token) => {
    const isForm = opts.body instanceof FormData;
    const headers = { ...(opts.headers || {}) };
    if (!isForm) headers['Content-Type'] = 'application/json';
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }, [token]);

  // ── Data loading ──────────────────────────────────────────
  const hydrateProfile = useCallback((p) => {
    if (!p) return;
    setProfileForm({
      headline: p.headline || '', bio: p.bio || '', department: p.department || '',
      rollNumber: p.rollNumber || '', branch: p.branch || '',
      year: p.year || '', cgpa: p.cgpa || '',
      domain: p.domain || '', position: p.position || '', contactInfo: p.contactInfo || '',
      graduationYear: p.graduationYear || '',
      linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '',
      skills: (p.skills || []).join(', '), interests: (p.interests || []).join(', '),
      achievements: (p.achievements || []).join('\n'),
    });
  }, []);

  const loadData = useCallback(async (tok = token) => {
    if (!tok) return;
    try {
      const [profileData, projectData, bulletinData] = await Promise.all([
        api('/profiles/me', {}, tok),
        api('/projects', {}, tok),
        api('/posts', {}, tok),
      ]);
      setProfile(profileData.profile);
      hydrateProfile(profileData.profile);
      setProjects(projectData || []);
      setBulletins(bulletinData || []);

      const evalData = await api('/evaluations/me', {}, tok).catch(() => []);
      setEvaluations(evalData || []);
      const facData = await api('/profiles/faculty', {}, tok).catch(() => []);
      setFacultyList(facData || []);
    } catch (e) {
      console.error('Load error', e);
    }
  }, [api, hydrateProfile, token]);

  const loadAdminData = useCallback(async (tok = token) => {
    if (!tok) return;
    try {
      const [stats, users, allProj, posts] = await Promise.all([
        api('/admin/stats', {}, tok),
        api('/admin/users', {}, tok),
        api('/admin/projects', {}, tok),
        api('/posts', {}, tok),
      ]);
      setAdminStats(stats);
      setAdminUsers(users || []);
      setProjects(allProj || []);
      setBulletins(posts || []);
    } catch (e) {
      console.error('Admin load error', e);
    }
  }, [api, token]);

  // Bootstrap
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const session = await api('/auth/me');
        setUser(session.user);
        if (session.user.role === 'admin') await loadAdminData(token);
        else await loadData(token);
      } catch {
        localStorage.removeItem('portal_token');
        setToken('');
      }
    })();
  }, [token]); // intentionally minimal deps

  // ── Auth handlers ─────────────────────────────────────────
  const doLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: authForm.email, password: authForm.password }) }, '');
      localStorage.setItem('portal_token', d.token);
      setToken(d.token);
      setUser(d.user);
      showToast(`Welcome back, ${d.user.name}`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const d = await api('/auth/register', { method: 'POST', body: JSON.stringify(authForm) }, '');
      localStorage.setItem('portal_token', d.token);
      setToken(d.token);
      setUser(d.user);
      showToast(`Account created! Welcome, ${d.user.name}`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doForgotPassword = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const d = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: resetEmail }) }, '');
      showToast(d.message, 'info');
      setAuthMode('reset');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doResetPassword = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const d = await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetCode, password: resetPwd }) }, '');
      showToast(d.message, 'success');
      setAuthMode('login');
      setResetCode(''); setResetPwd('');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doLogout = () => {
    localStorage.removeItem('portal_token');
    setToken(''); setUser(null); setProfile(null);
    setProjects([]); setBulletins([]); setEvaluations([]);
    setAdminStats(null); setAdminUsers([]);
    setView('dashboard'); setAuthMode('login');
  };

  // ── Profile save ──────────────────────────────────────────
  const doSaveProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          ...profileForm,
          skills: splitCSV(profileForm.skills),
          interests: splitCSV(profileForm.interests),
          achievements: profileForm.achievements.split('\n').map(s => s.trim()).filter(Boolean),
          year: profileForm.year ? Number(profileForm.year) : null,
          cgpa: profileForm.cgpa ? Number(profileForm.cgpa) : null,
          graduationYear: profileForm.graduationYear ? Number(profileForm.graduationYear) : null,
        }),
      });
      await (isAdmin ? loadAdminData() : loadData());
      showToast('Profile updated', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doUploadResume = async (evt) => {
    const file = evt.target.files?.[0]; if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('resume', file);
      await api('/profiles/me/resume', { method: 'POST', body: fd });
      await loadData();
      showToast('Resume uploaded', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); if (resumeRef.current) resumeRef.current.value = ''; }
  };

  // ── Project handlers ──────────────────────────────────────
  const doPostProject = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(projForm).forEach(([k, v]) => {
        if (k === 'attachment') { if (v) fd.append('attachment', v); }
        else fd.append(k, v);
      });
      await api('/projects', { method: 'POST', body: fd });
      setProjForm(INIT_PROJ);
      if (attachRef.current) attachRef.current.value = '';
      await loadData();
      showToast('Project posted!', 'success');
      setView('my-projects');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doApply = async () => {
    if (!applyPitch.trim()) { showToast('Please write a statement of interest', 'error'); return; }
    setLoading(true);
    try {
      await api(`/projects/${selectedProject._id}/apply`, { method: 'POST', body: JSON.stringify({ pitch: applyPitch }) });
      await loadData();
      setApplyOpen(false); setApplyPitch('');
      showToast('Application submitted!', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doReview = async (projectId, appId, decision) => {
    const remarks = reviewData[appId]?.remarks || '';
    setLoading(true);
    try {
      await api(`/projects/${projectId}/applications/${appId}/review`, { method: 'POST', body: JSON.stringify({ decision, remarks }) });
      await loadData();
      showToast(`Application ${decision === 'accept' ? 'accepted' : decision === 'shortlist' ? 'shortlisted' : 'declined'}`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doUpdateStatus = async (projectId, status) => {
    setLoading(true);
    try {
      await api(`/projects/${projectId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadData();
      showToast('Status updated', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  // ── Bulletin ──────────────────────────────────────────────
  const doPostBulletin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api('/posts', { method: 'POST', body: JSON.stringify(bulletinForm) });
      await (isAdmin ? loadAdminData() : loadData());
      setBulletinForm(INIT_BULLETIN);
      showToast('Post published', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doDeleteBulletin = async (id) => {
    setLoading(true);
    try {
      await api(`/posts/${id}`, { method: 'DELETE' });
      await (isAdmin ? loadAdminData() : loadData());
      showToast('Post deleted', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doFollowToggle = async (facultyId) => {
    setLoading(true);
    try {
      await api(`/profiles/faculty/${facultyId}/follow`, { method: 'POST' });
      await loadData();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  // ── Computed ──────────────────────────────────────────────
  const myProjects = useMemo(() => {
    if (!isFaculty || !user) return [];
    return projects.filter(p => {
      const pid = p.professor?._id || p.professor;
      return pid?.toString() === user.id?.toString();
    });
  }, [projects, user, isFaculty]);

  const myApplications = useMemo(() => {
    if (!isStudent || !user) return [];
    const result = [];
    projects.forEach(p => {
      (p.applications || []).forEach(app => {
        const sid = app.student?._id || app.student;
        if (sid?.toString() === user.id?.toString()) result.push({ ...app, project: p });
      });
    });
    return result;
  }, [projects, user, isStudent]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (p.status === 'archived') return false;
      if (fStatus && p.status !== fStatus) return false;
      if (fDomain && p.domain !== fDomain) return false;
      if (fDept && p.department !== fDept) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit = [p.title, p.description, p.summary, p.domain, p.department]
          .some(f => (f || '').toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [projects, fStatus, fDomain, fDept, search]);

  const domains = useMemo(() => [...new Set(projects.map(p => p.domain).filter(Boolean))], [projects]);
  const depts   = useMemo(() => [...new Set(projects.map(p => p.department).filter(Boolean))], [projects]);
  const completion = useMemo(() => calcCompletion(profile), [profile]);

  // ════════════════════════════════════════════════════════
  // RENDER: AUTH PAGE
  // ════════════════════════════════════════════════════════
  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark">CS</div>
            <div className="auth-brand-text">
              CollabSphere
              <small>Faculty · Student · Admin Platform</small>
            </div>
          </div>

          {authMode === 'login' && <>
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-sub">Sign in to your account to continue</p>
            <div className="auth-tabs">
              <button className="auth-tab active" type="button">Login</button>
              <button className="auth-tab" type="button" onClick={() => setAuthMode('register')}>Register</button>
            </div>
            <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="field">
                <label>Email address</label>
                <input type="email" placeholder="you@university.edu" required value={authForm.email}
                  onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required minLength={6} value={authForm.password}
                  onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" className="forgot-link" onClick={() => setAuthMode('forgot')}>Forgot password?</button>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '.25rem' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <div className="auth-dev-note" style={{ marginTop: '1rem' }}>
              <Icon name="info" size={13} /> Default admin: <strong>admin@portal.com</strong> / <strong>admin123</strong>
            </div>
          </>}

          {authMode === 'register' && <>
            <h1 className="auth-heading">Create account</h1>
            <p className="auth-sub">Join the platform as a student or faculty</p>
            <div className="auth-tabs">
              <button className="auth-tab" type="button" onClick={() => setAuthMode('login')}>Login</button>
              <button className="auth-tab active" type="button">Register</button>
            </div>
            <form onSubmit={doRegister} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="field">
                <label>Full name</label>
                <input placeholder="Your full name" required value={authForm.name}
                  onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Email address</label>
                <input type="email" placeholder="se23uari096@mahindrauniversity.edu.in" required value={authForm.email}
                  onChange={e => {
                    const email = e.target.value;
                    const roll = email.split('@')[0] || '';
                    setAuthForm(p => ({
                      ...p,
                      email,
                      rollNumber: (p.role === 'student' || p.role === 'alumni') ? roll : p.rollNumber,
                    }));
                  }} />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="At least 6 characters" required minLength={6} value={authForm.password}
                  onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="field">
                <label>I am a</label>
                <div className="role-select-row">
                  {['student', 'faculty', 'alumni'].map(r => (
                    <button key={r} type="button" className={`role-btn ${authForm.role === r ? 'selected' : ''}`}
                      onClick={() => setAuthForm(p => ({
                        ...p, role: r,
                        rollNumber: (r === 'student' || r === 'alumni') ? (p.email.split('@')[0] || '') : '',
                      }))}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {(authForm.role === 'student' || authForm.role === 'alumni') && <>
                <div className="form-grid">
                  <div className="field"><label>Roll number</label>
                    <input placeholder="Auto-filled from email" value={authForm.rollNumber} readOnly
                      style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }} /></div>
                  <div className="field"><label>Branch</label>
                    <select value={authForm.branch} onChange={e => setAuthForm(p => ({ ...p, branch: e.target.value }))}>
                      <option value="">Select branch…</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select></div>
                </div>
              </>}
              {authForm.role === 'faculty' && <>
                <div className="form-grid">
                  <div className="field"><label>Domain / expertise</label>
                    <input placeholder="Machine Learning" value={authForm.domain}
                      onChange={e => setAuthForm(p => ({ ...p, domain: e.target.value }))} /></div>
                  <div className="field"><label>Position / designation</label>
                    <input placeholder="Associate Professor" value={authForm.position}
                      onChange={e => setAuthForm(p => ({ ...p, position: e.target.value }))} /></div>
                </div>
              </>}
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '.25rem' }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </>}

          {authMode === 'forgot' && <>
            <h1 className="auth-heading">Reset password</h1>
            <p className="auth-sub">Enter your email and we'll print a reset code to the server console</p>
            <form onSubmit={doForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1.25rem' }}>
              <div className="field">
                <label>Email address</label>
                <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@university.edu" />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset code'}</button>
              <button className="btn btn-ghost btn-full" type="button" onClick={() => setAuthMode('login')}>Back to login</button>
            </form>
          </>}

          {authMode === 'reset' && <>
            <h1 className="auth-heading">Enter reset code</h1>
            <div className="auth-dev-note"><Icon name="info" size={13} /> Check your server terminal for the 6-digit code</div>
            <form onSubmit={doResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '.75rem' }}>
              <div className="field">
                <label>Reset code (from server console)</label>
                <input required value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="123456" />
              </div>
              <div className="field">
                <label>New password</label>
                <input type="password" required minLength={6} value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="New password" />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? 'Updating…' : 'Reset password'}</button>
              <button className="btn btn-ghost btn-full" type="button" onClick={() => setAuthMode('login')}>Back to login</button>
            </form>
          </>}
        </div>

        {toast && (
          <div className="toast-wrap">
            <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // SIDEBAR NAV CONFIG
  // ════════════════════════════════════════════════════════
  const navItems = isAdmin ? [
    { key: 'dashboard',    label: 'Dashboard',     icon: 'dashboard' },
    { key: 'all-projects', label: 'All Projects',  icon: 'projects' },
    { key: 'users',        label: 'User Management', icon: 'users' },
    { key: 'bulletin',     label: 'Bulletin Board', icon: 'bulletin' },
  ] : isFaculty ? [
    { key: 'dashboard',    label: 'Dashboard',     icon: 'dashboard' },
    { key: 'post-project', label: 'Post Project',  icon: 'post' },
    { key: 'my-projects',  label: 'My Projects',   icon: 'projects' },
    { key: 'bulletin',     label: 'Bulletin Board', icon: 'bulletin' },
    { key: 'profile',      label: 'My Profile',    icon: 'profile' },
  ] : [
    { key: 'dashboard',    label: 'Dashboard',     icon: 'dashboard' },
    { key: 'projects',     label: 'Browse Projects', icon: 'projects' },
    { key: 'applications', label: 'My Applications', icon: 'apps' },
    { key: 'bulletin',     label: 'Bulletin Board', icon: 'bulletin' },
    { key: 'profile',      label: 'My Profile',    icon: 'profile' },
  ];

  const pageTitle = navItems.find(n => n.key === view)?.label || 'Dashboard';

  const nav = (key) => { setView(key); setSelectedProject(null); setExpandedFacultyProj(null); setSidebarOpen(false); };

  // ════════════════════════════════════════════════════════
  // RENDER: STUDENT DASHBOARD
  // ════════════════════════════════════════════════════════
  const renderStudentDashboard = () => {
    const applied = myApplications.length;
    const shortlisted = myApplications.filter(a => a.status === 'shortlisted').length;
    const selected = myApplications.filter(a => a.status === 'accepted').length;
    const recentApps = myApplications.slice(0, 5);
    const recentBulletins = bulletins.slice(0, 4);

    return <>
      <div className="page-header">
        <h2>Good to see you, {user.name.split(' ')[0]} 👋</h2>
        <p>Here's your activity summary</p>
      </div>

      {/* Profile completion */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <div><div className="card-title">Profile completion</div>
            <div className="card-sub">A complete profile gets you better project recommendations</div></div>
          <button className="btn btn-sm btn-ghost" onClick={() => nav('profile')}>Edit profile</button>
        </div>
        <div className="progress-wrap">
          <div className="progress-label"><span>Progress</span><strong>{completion}%</strong></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Applications Sent', value: applied, color: '#eff6ff', icon: '#1d4ed8' },
          { label: 'Shortlisted', value: shortlisted, color: '#fef3c7', icon: '#92400e' },
          { label: 'Selected', value: selected, color: '#dcfce7', icon: '#15803d' },
          { label: 'Open Projects', value: projects.filter(p => p.status === 'open').length, color: '#fff2f4', icon: 'var(--rose)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Recent applications */}
        <div className="card">
          <div className="section-header">
            <h3>Recent Applications</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => nav('applications')}>View all</button>
          </div>
          {recentApps.length === 0
            ? <p className="text-muted">No applications yet. <button className="btn btn-sm btn-ghost" style={{ display: 'inline-flex', marginLeft: '.3rem' }} onClick={() => nav('projects')}>Browse projects →</button></p>
            : <div className="recent-list">
                {recentApps.map(app => (
                  <div key={app._id} className="recent-item">
                    <div style={{ minWidth: 0 }}>
                      <div className="recent-item-title">{app.project?.title}</div>
                      <div className="recent-item-sub">By {app.project?.professor?.name || 'Faculty'}</div>
                    </div>
                    <span className={`badge ${STATUS_CLS[app.status]}`}>{STATUS_LABEL[app.status]}</span>
                  </div>
                ))}
              </div>}
        </div>

        {/* Recent bulletins */}
        <div className="card">
          <div className="section-header">
            <h3>Recent Notices</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => nav('bulletin')}>View all</button>
          </div>
          {recentBulletins.length === 0
            ? <p className="text-muted">No notices posted yet.</p>
            : <div className="recent-list">
                {recentBulletins.map(b => (
                  <div key={b._id} className="recent-item">
                    <div style={{ minWidth: 0 }}>
                      <div className="recent-item-title">{b.title}</div>
                      <div className="recent-item-sub">By {b.author?.name}</div>
                    </div>
                    <span className={`badge ${BULLETIN_CLS[b.type] || 'badge-gray'}`}>{BULLETIN_LABEL[b.type]}</span>
                  </div>
                ))}
              </div>}
        </div>
      </div>
    </>;
  };

  // ════════════════════════════════════════════════════════
  // RENDER: FACULTY DASHBOARD
  // ════════════════════════════════════════════════════════
  const renderFacultyDashboard = () => {
    const totalApplicants = myProjects.reduce((sum, p) => sum + (p.applications?.length || 0), 0);
    const openCount = myProjects.filter(p => p.status === 'open').length;
    const recentActivity = myProjects
      .flatMap(p => (p.applications || []).map(a => ({ ...a, projectTitle: p.title, projectId: p._id })))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return <>
      <div className="page-header">
        <h2>Faculty Dashboard</h2>
        <p>Manage your research projects and student collaborations</p>
      </div>

      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <div className="stat-card-value">{myProjects.length}</div>
          <div className="stat-card-label">Projects Posted</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalApplicants}</div>
          <div className="stat-card-label">Total Applicants</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{openCount}</div>
          <div className="stat-card-label">Open Projects</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-header">
            <h3>My Projects</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => nav('my-projects')}>View all</button>
          </div>
          {myProjects.length === 0
            ? <p className="text-muted">No projects posted. <button className="btn btn-sm btn-primary" style={{ marginLeft: '.5rem' }} onClick={() => nav('post-project')}>Post one →</button></p>
            : <div className="stack">
                {myProjects.slice(0, 4).map(p => (
                  <div key={p._id} className="my-project-row" style={{ cursor: 'pointer' }} onClick={() => { setExpandedFacultyProj(p._id); nav('my-projects'); }}>
                    <div className="my-project-info">
                      <div className="my-project-title">{p.title}</div>
                      <div className="my-project-stats">{p.applications?.length || 0} applicants · {fmtDate(p.createdAt)}</div>
                    </div>
                    <span className={`badge ${PROJ_STATUS_CLS[p.status]}`}>{p.status}</span>
                  </div>
                ))}
              </div>}
        </div>

        <div className="card">
          <div className="section-header"><h3>Recent Applicant Activity</h3></div>
          {recentActivity.length === 0
            ? <p className="text-muted">No applications received yet.</p>
            : <div className="recent-list">
                {recentActivity.map((a, i) => (
                  <div key={i} className="recent-item">
                    <div style={{ minWidth: 0 }}>
                      <div className="recent-item-title">{a.student?.name || 'Student'}</div>
                      <div className="recent-item-sub">{a.projectTitle}</div>
                    </div>
                    <span className={`badge ${STATUS_CLS[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                  </div>
                ))}
              </div>}
        </div>
      </div>
    </>;
  };

  // ════════════════════════════════════════════════════════
  // RENDER: ADMIN DASHBOARD
  // ════════════════════════════════════════════════════════
  const renderAdminDashboard = () => (
    <>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>Platform-wide overview and management</p>
      </div>

      {adminStats ? (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users',       value: adminStats.totalUsers },
            { label: 'Students',          value: adminStats.students },
            { label: 'Faculty',           value: adminStats.faculty },
            { label: 'Total Projects',    value: adminStats.totalProjects },
            { label: 'Open Projects',     value: adminStats.openProjects },
            { label: 'Total Applications',value: adminStats.totalApplications },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>
      ) : <p className="text-muted">Loading stats…</p>}

      <div className="two-col">
        <div className="card">
          <div className="section-header">
            <h3>Quick navigation</h3>
          </div>
          <div className="stack">
            {[
              { key: 'users', label: 'Manage Users', sub: 'View and filter all registered users' },
              { key: 'all-projects', label: 'All Projects', sub: 'Browse every posted project' },
              { key: 'bulletin', label: 'Bulletin Board', sub: 'Post announcements and notices' },
            ].map(item => (
              <button key={item.key} className="my-project-row" onClick={() => nav(item.key)} style={{ width: '100%', cursor: 'pointer' }}>
                <div className="my-project-info">
                  <div className="my-project-title">{item.label}</div>
                  <div className="my-project-stats">{item.sub}</div>
                </div>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h3>Recent Bulletins</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => nav('bulletin')}>Manage</button>
          </div>
          <div className="recent-list">
            {bulletins.slice(0, 4).map(b => (
              <div key={b._id} className="recent-item">
                <div style={{ minWidth: 0 }}>
                  <div className="recent-item-title">{b.title}</div>
                  <div className="recent-item-sub">By {b.author?.name}</div>
                </div>
                <span className={`badge ${BULLETIN_CLS[b.type] || 'badge-gray'}`}>{BULLETIN_LABEL[b.type]}</span>
              </div>
            ))}
            {bulletins.length === 0 && <p className="text-muted">No bulletins yet.</p>}
          </div>
        </div>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: PROJECT LISTING (Student browse)
  // ════════════════════════════════════════════════════════
  const renderProjects = () => {
    if (selectedProject) return renderProjectDetail();
    return <>
      <div className="page-header">
        <h2>Browse Projects</h2>
        <p>{filteredProjects.length} projects available</p>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon"><Icon name="search" size={15} /></span>
          <input className="search-input" placeholder="Search by title, description, domain…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={fDomain} onChange={e => setFDomain(e.target.value)}>
          <option value="">All domains</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={fDept} onChange={e => setFDept(e.target.value)}>
          <option value="">All departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        {(search || fDomain || fDept || fStatus) &&
          <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setFDomain(''); setFDept(''); setFStatus(''); }}>Clear</button>}
      </div>

      {filteredProjects.length === 0
        ? <div className="empty-state"><Icon name="projects" size={40} /><p>No projects match your filters</p></div>
        : <div className="projects-grid">
            {filteredProjects.map(p => {
              const applied = (p.applications || []).some(a => {
                const sid = a.student?._id || a.student;
                return sid?.toString() === user?.id?.toString();
              });
              return (
                <div key={p._id} className="project-card">
                  <div className="project-card-top">
                    {p.domain && <span className="badge badge-sage">{p.domain}</span>}
                    {p.department && <span className="badge badge-gray">{p.department}</span>}
                    <span className={`badge ${PROJ_STATUS_CLS[p.status]}`}>{p.status}</span>
                    {p.recommendationScore > 0 && <span className="badge badge-rose">Recommended</span>}
                  </div>
                  <div className="project-card-title">{p.title}</div>
                  <div className="project-card-meta">By {p.professor?.name} · {p.professor?.department || p.professor?.domain || 'Faculty'}</div>
                  <div className="project-card-desc">{p.summary || p.description}</div>
                  {(p.requiredSkills || []).length > 0 && (
                    <div className="tags-row">
                      {p.requiredSkills.map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                  )}
                  <div className="project-card-info">
                    {p.minCgpa > 0 && <span>CGPA ≥ {p.minCgpa}</span>}
                    {p.deadline && <span>Deadline: {fmtDate(p.deadline)}</span>}
                    {p.duration && <span>Duration: {p.duration}</span>}
                  </div>
                  <div className="project-card-footer">
                    <button className="btn btn-sm btn-ghost" onClick={() => setSelectedProject(p)}>View details</button>
                    {isStudent && p.status === 'open' && (
                      applied
                        ? <button className="btn btn-sm" disabled style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                            <Icon name="check" size={14} /> Applied
                          </button>
                        : <button className="btn btn-sm btn-primary" onClick={() => { setSelectedProject(p); setApplyOpen(true); }}>
                            Apply
                          </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>}
    </>;
  };

  // ════════════════════════════════════════════════════════
  // RENDER: PROJECT DETAIL (Student view)
  // ════════════════════════════════════════════════════════
  const renderProjectDetail = () => {
    const p = selectedProject;
    if (!p) return null;
    const applied = (p.applications || []).some(a => {
      const sid = a.student?._id || a.student;
      return sid?.toString() === user?.id?.toString();
    });
    return (
      <div className="detail-panel">
        <button className="detail-back" onClick={() => setSelectedProject(null)}>
          <Icon name="back" size={16} /> Back to projects
        </button>
        <div className="project-card-top" style={{ marginBottom: '.65rem' }}>
          {p.domain && <span className="badge badge-sage">{p.domain}</span>}
          {p.department && <span className="badge badge-gray">{p.department}</span>}
          <span className={`badge ${PROJ_STATUS_CLS[p.status]}`}>{p.status}</span>
        </div>
        <h2 className="detail-title">{p.title}</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: '.875rem', marginBottom: '.75rem' }}>
          By <strong>{p.professor?.name}</strong> · {p.professor?.position || p.professor?.department || 'Faculty mentor'}
        </p>

        <div className="detail-grid">
          {p.domain && <div><div className="detail-field-label">Domain</div><div className="detail-field-value">{p.domain}</div></div>}
          {p.department && <div><div className="detail-field-label">Department</div><div className="detail-field-value">{p.department}</div></div>}
          {p.duration && <div><div className="detail-field-label">Duration</div><div className="detail-field-value">{p.duration}</div></div>}
          {p.deadline && <div><div className="detail-field-label">Deadline</div><div className="detail-field-value">{fmtDate(p.deadline)}</div></div>}
          {p.minCgpa > 0 && <div><div className="detail-field-label">Min CGPA</div><div className="detail-field-value">{p.minCgpa}/10</div></div>}
          {(p.eligibleYears || []).length > 0 && <div><div className="detail-field-label">Eligible years</div><div className="detail-field-value">{p.eligibleYears.join(', ')}</div></div>}
          {(p.eligibleDepartments || []).length > 0 && <div className="field-span-2"><div className="detail-field-label">Eligible departments</div><div className="detail-field-value">{p.eligibleDepartments.join(', ')}</div></div>}
        </div>

        <div className="divider" />
        <h4 style={{ marginBottom: '.5rem' }}>Description</h4>
        <p style={{ color: 'var(--text-soft)', lineHeight: 1.65 }}>{p.description}</p>

        {p.futureProspects?.text && <>
          <div className="divider" />
          <h4 style={{ marginBottom: '.5rem' }}>Future Prospects {p.futureProspects.isMandatory && <span className="badge badge-rose" style={{ marginLeft: '.4rem' }}>Required</span>}</h4>
          <p style={{ color: 'var(--text-soft)', lineHeight: 1.65 }}>{p.futureProspects.text}</p>
        </>}

        {(p.requiredSkills || []).length > 0 && <>
          <div className="divider" />
          <h4 style={{ marginBottom: '.5rem' }}>Required Skills</h4>
          <div className="tags-row">{p.requiredSkills.map(s => <span key={s} className="tag">{s}</span>)}</div>
        </>}

        {p.attachmentUrl && <><div className="divider" /><a href={p.attachmentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open attachment</a></>}

        {isStudent && p.status === 'open' && (
          <div style={{ marginTop: '1.25rem' }}>
            {applied
              ? <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '.75rem 1rem', color: '#15803d', fontWeight: 600, display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <Icon name="check" size={16} /> You have already applied to this project
                </div>
              : <button className="btn btn-primary" onClick={() => setApplyOpen(true)}>Apply to this project</button>}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════
  // RENDER: MY APPLICATIONS (Student)
  // ════════════════════════════════════════════════════════
  const renderApplications = () => (
    <>
      <div className="page-header">
        <h2>My Applications</h2>
        <p>{myApplications.length} total applications</p>
      </div>
      {myApplications.length === 0
        ? <div className="empty-state"><Icon name="apps" size={40} /><p>You haven't applied to any projects yet.</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => nav('projects')}>Browse Projects</button></div>
        : <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th><th>Faculty</th><th>Domain</th><th>Dept.</th>
                  <th>CGPA Req.</th><th>Applied On</th><th>Status</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {myApplications.map((app, i) => (
                  <tr key={i}>
                    <td><strong style={{ fontSize: '.875rem' }}>{app.project?.title}</strong></td>
                    <td className="td-muted">{app.project?.professor?.name || '—'}</td>
                    <td className="td-muted">{app.project?.domain || '—'}</td>
                    <td className="td-muted">{app.project?.department || '—'}</td>
                    <td className="td-muted">{app.project?.minCgpa > 0 ? `${app.project.minCgpa}+` : '—'}</td>
                    <td className="td-muted">{fmtDate(app.createdAt)}</td>
                    <td><span className={`badge ${STATUS_CLS[app.status]}`}>{STATUS_LABEL[app.status]}</span></td>
                    <td className="td-muted">{app.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: POST PROJECT (Faculty)
  // ════════════════════════════════════════════════════════
  const renderPostProject = () => (
    <>
      <div className="page-header">
        <h2>Post a New Project</h2>
        <p>Fill in the details below to publish a project for students</p>
      </div>
      <div className="card">
        <form onSubmit={doPostProject}>
          <div className="stack">
            <div className="field span-2"><label>Project title *</label>
              <input required placeholder="e.g. Deep Learning for Medical Image Analysis" value={projForm.title}
                onChange={e => setProjForm(p => ({ ...p, title: e.target.value }))} /></div>

            <div className="form-grid">
              <div className="field"><label>Domain / area</label>
                <input placeholder="Machine Learning" value={projForm.domain}
                  onChange={e => setProjForm(p => ({ ...p, domain: e.target.value }))} /></div>
              <div className="field"><label>Department</label>
                <input placeholder="Computer Science" value={projForm.department}
                  onChange={e => setProjForm(p => ({ ...p, department: e.target.value }))} /></div>
            </div>

            <div className="field"><label>Summary (short, 1–2 sentences) *</label>
              <textarea rows={2} required placeholder="What is this project about in brief?" value={projForm.summary}
                onChange={e => setProjForm(p => ({ ...p, summary: e.target.value }))} /></div>

            <div className="field"><label>Full description *</label>
              <textarea rows={5} required placeholder="Detailed description of the project, goals, methodology, and expected outputs" value={projForm.description}
                onChange={e => setProjForm(p => ({ ...p, description: e.target.value }))} /></div>

            <div className="form-grid">
              <div className="field"><label>Required skills (comma-separated)</label>
                <input placeholder="Python, TensorFlow, Research" value={projForm.requiredSkills}
                  onChange={e => setProjForm(p => ({ ...p, requiredSkills: e.target.value }))} /></div>
              <div className="field"><label>Tags (comma-separated)</label>
                <input placeholder="AI, Healthcare, Deep Learning" value={projForm.tags}
                  onChange={e => setProjForm(p => ({ ...p, tags: e.target.value }))} /></div>
            </div>

            <div className="form-grid cols-3">
              <div className="field"><label>Min CGPA</label>
                <input type="number" step="0.1" min="0" max="10" placeholder="7.0" value={projForm.minCgpa}
                  onChange={e => setProjForm(p => ({ ...p, minCgpa: e.target.value }))} /></div>
              <div className="field"><label>Duration</label>
                <input placeholder="3 months" value={projForm.duration}
                  onChange={e => setProjForm(p => ({ ...p, duration: e.target.value }))} /></div>
              <div className="field"><label>Application deadline</label>
                <input type="date" value={projForm.deadline}
                  onChange={e => setProjForm(p => ({ ...p, deadline: e.target.value }))} /></div>
            </div>

            <div className="form-grid">
              <div className="field"><label>Eligible years (comma-separated)</label>
                <input placeholder="2nd year, 3rd year, Final year" value={projForm.eligibleYears}
                  onChange={e => setProjForm(p => ({ ...p, eligibleYears: e.target.value }))} /></div>
              <div className="field"><label>Eligible departments</label>
                <input placeholder="CS, ECE, EE" value={projForm.eligibleDepartments}
                  onChange={e => setProjForm(p => ({ ...p, eligibleDepartments: e.target.value }))} /></div>
            </div>

            <div className="form-grid">
              <div className="field"><label>Image URL (optional)</label>
                <input type="url" placeholder="https://…" value={projForm.imageUrl}
                  onChange={e => setProjForm(p => ({ ...p, imageUrl: e.target.value }))} /></div>
              <div className="field"><label>Attachment file</label>
                <input type="file" ref={attachRef} onChange={e => setProjForm(p => ({ ...p, attachment: e.target.files?.[0] || null }))} /></div>
            </div>

            <div className="field"><label>Future prospects / career relevance</label>
              <textarea rows={2} placeholder="What can students expect to gain or where this project may lead?" value={projForm.futureProspectsText}
                onChange={e => setProjForm(p => ({ ...p, futureProspectsText: e.target.value }))} /></div>

            <div className="field checkbox-row">
              <input type="checkbox" checked={projForm.futureProspectsMandatory}
                onChange={e => setProjForm(p => ({ ...p, futureProspectsMandatory: e.target.checked }))} />
              <label style={{ textTransform: 'none', letterSpacing: 0, fontSize: '.875rem', fontWeight: 500 }}>
                Mark future prospects section as mandatory
              </label>
            </div>

            <div className="btn-row" style={{ marginTop: '.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Publishing…' : 'Publish project'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setProjForm(INIT_PROJ)}>Reset</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: MY PROJECTS (Faculty)
  // ════════════════════════════════════════════════════════
  const renderMyProjects = () => (
    <>
      <div className="page-header">
        <h2>My Projects</h2>
        <p>{myProjects.length} projects posted</p>
      </div>
      {myProjects.length === 0
        ? <div className="empty-state"><Icon name="projects" size={40} /><p>No projects yet.</p><button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => nav('post-project')}>Post a Project</button></div>
        : <div className="stack">
            {myProjects.map(p => (
              <div key={p._id}>
                <div className="my-project-row">
                  <div className="my-project-info">
                    <div className="my-project-title">{p.title}</div>
                    <div className="my-project-stats">
                      {p.applications?.length || 0} total · {(p.applications || []).filter(a => a.status === 'shortlisted').length} shortlisted · {(p.applications || []).filter(a => a.status === 'accepted').length} selected
                      {p.deadline && ` · Deadline ${fmtDate(p.deadline)}`}
                    </div>
                  </div>
                  <div className="my-project-actions">
                    <span className={`badge ${PROJ_STATUS_CLS[p.status]}`}>{p.status}</span>
                    <select className="filter-select" style={{ fontSize: '.78rem', padding: '.35rem .7rem' }}
                      value={p.status} onChange={e => doUpdateStatus(p._id, e.target.value)}>
                      <option value="open">Open</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button className="btn btn-sm btn-ghost" onClick={() => setExpandedFacultyProj(expandedFacultyProj === p._id ? null : p._id)}>
                      {expandedFacultyProj === p._id ? 'Hide applicants' : `Applicants (${p.applications?.length || 0})`}
                    </button>
                  </div>
                </div>

                {/* Applicant cards for this project */}
                {expandedFacultyProj === p._id && (
                  <div style={{ padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
                    {(p.applications || []).length === 0
                      ? <p className="text-muted">No applications yet.</p>
                      : <div className="stack">
                          {p.applications.map(app => {
                            const stu = app.student || {};
                            const rd = reviewData[app._id] || {};
                            return (
                              <div key={app._id} className="applicant-card">
                                <div className="applicant-card-header">
                                  <div>
                                    <div className="applicant-name">{stu.name || 'Student'}</div>
                                    <div className="applicant-meta">
                                      {stu.rollNumber && <span>Roll: {stu.rollNumber}</span>}
                                      {stu.branch && <span>Branch: {stu.branch}</span>}
                                      {stu.year && <span>Year {stu.year}</span>}
                                      {stu.cgpa && <span>CGPA: {stu.cgpa}</span>}
                                    </div>
                                  </div>
                                  <span className={`badge ${STATUS_CLS[app.status]}`}>{STATUS_LABEL[app.status]}</span>
                                </div>
                                {(stu.skills || []).length > 0 && <div className="tags-row" style={{ marginBottom: '.5rem' }}>{stu.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>}
                                <div className="applicant-pitch"><em>"{app.pitch}"</em></div>
                                {app.remarks && <div style={{ fontSize: '.78rem', color: 'var(--sage)', marginBottom: '.4rem' }}>Faculty note: {app.remarks}</div>}
                                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <input placeholder="Add remark (optional)" value={rd.remarks || ''}
                                    onChange={e => setReviewData(prev => ({ ...prev, [app._id]: { ...prev[app._id], remarks: e.target.value } }))}
                                    style={{ flex: 1, minWidth: 140, padding: '.38rem .65rem', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', fontSize: '.8rem' }} />
                                  <div className="applicant-actions">
                                    <button className="btn btn-sm" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} disabled={loading} onClick={() => doReview(p._id, app._id, 'shortlist')}>Shortlist</button>
                                    <button className="btn btn-sm btn-sage" disabled={loading} onClick={() => doReview(p._id, app._id, 'accept')}>Select</button>
                                    <button className="btn btn-sm btn-danger" disabled={loading} onClick={() => doReview(p._id, app._id, 'decline')}>Reject</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>}
                  </div>
                )}
              </div>
            ))}
          </div>}
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: BULLETIN BOARD (Shared)
  // ════════════════════════════════════════════════════════
  const renderBulletin = () => (
    <>
      <div className="page-header">
        <h2>Bulletin Board</h2>
        <p>Announcements, deadlines, and notices from faculty and admin</p>
      </div>

      {(isFaculty || isAdmin) && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '.85rem' }}>Post to bulletin</div>
          <form onSubmit={doPostBulletin}>
            <div className="stack">
              <div className="form-grid">
                <div className="field"><label>Title *</label>
                  <input required placeholder="Post title" value={bulletinForm.title}
                    onChange={e => setBulletinForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="field"><label>Type</label>
                  <select value={bulletinForm.type} onChange={e => setBulletinForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="deadline">Deadline</option>
                    <option value="notice">Notice</option>
                  </select></div>
              </div>
              <div className="field"><label>Content *</label>
                <textarea rows={3} required placeholder="What would you like to share?" value={bulletinForm.content}
                  onChange={e => setBulletinForm(p => ({ ...p, content: e.target.value }))} /></div>
              <div><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Publishing…' : 'Publish post'}</button></div>
            </div>
          </form>
        </div>
      )}

      {bulletins.length === 0
        ? <div className="empty-state"><Icon name="bulletin" size={40} /><p>No posts yet.</p></div>
        : <div className="bulletin-feed">
            {bulletins.map(b => (
              <div key={b._id} className={`bulletin-item type-${b.type}`}>
                <div className="bulletin-header">
                  <div>
                    <span className={`badge ${BULLETIN_CLS[b.type] || 'badge-gray'}`} style={{ marginBottom: '.35rem' }}>{BULLETIN_LABEL[b.type]}</span>
                    <div className="bulletin-title">{b.title}</div>
                  </div>
                  <div className="bulletin-meta">
                    <span>{fmtDate(b.createdAt)}</span>
                    {(isFaculty && b.author?._id?.toString() === user?.id?.toString()) || isAdmin
                      ? <button className="btn btn-sm btn-ghost" style={{ padding: '.25rem .5rem', color: 'var(--text-muted)' }} onClick={() => doDeleteBulletin(b._id)} disabled={loading}>
                          <Icon name="trash" size={13} />
                        </button>
                      : null}
                  </div>
                </div>
                <div className="bulletin-content">{b.content}</div>
                <div style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>Posted by {b.author?.name} ({ROLE_LABEL[b.author?.role] || b.author?.role})</div>
              </div>
            ))}
          </div>}
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: PROFILE (Student + Faculty)
  // ════════════════════════════════════════════════════════
  const renderProfile = () => (
    <>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Keep your profile complete for better opportunities</p>
      </div>

      {/* Header card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="user-avatar" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{initials(user.name)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{user.email}</div>
              <span className="badge badge-sage" style={{ marginTop: '.35rem' }}>{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
          {isStudent && (
            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: '.78rem', color: 'var(--text-soft)', marginBottom: '.3rem' }}>Profile {completion}% complete</div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
            </div>
          )}
        </div>

        {/* Background verification */}
        {profile?.backgroundVerification && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Verification Status</div>
            <div className="verification-row">
              {['resumeVerified', 'linkedinVerified', 'githubVerified'].map(k => (
                <div key={k} className="verif-item">
                  <div className={`verif-dot ${profile.backgroundVerification[k] ? 'verified' : 'pending'}`} />
                  <span>{k.replace('Verified', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '1rem' }}>Edit Profile</div>
        <form onSubmit={doSaveProfile}>
          <div className="stack">
            <div className="form-grid">
              <div className="field"><label>Headline</label>
                <input placeholder="e.g. CS student interested in AI" value={profileForm.headline}
                  onChange={e => setProfileForm(p => ({ ...p, headline: e.target.value }))} /></div>
              <div className="field"><label>Department</label>
                <input placeholder="Computer Science & Engineering" value={profileForm.department}
                  onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} /></div>
            </div>

            {isStudent && (
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="field"><label>Roll Number</label>
                  <input placeholder="CS22B001" value={profileForm.rollNumber}
                    onChange={e => setProfileForm(p => ({ ...p, rollNumber: e.target.value }))} /></div>
                <div className="field"><label>Branch</label>
                  <select value={profileForm.branch} onChange={e => setProfileForm(p => ({ ...p, branch: e.target.value }))}>
                    <option value="">Select…</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select></div>
                <div className="field"><label>Year</label>
                  <select value={profileForm.year} onChange={e => setProfileForm(p => ({ ...p, year: e.target.value }))}>
                    <option value="">—</option>
                    <option value="1">1st year</option><option value="2">2nd year</option>
                    <option value="3">3rd year</option><option value="4">4th year</option>
                  </select></div>
                <div className="field"><label>CGPA</label>
                  <input type="number" step="0.01" min="0" max="10" placeholder="8.50" value={profileForm.cgpa}
                    onChange={e => setProfileForm(p => ({ ...p, cgpa: e.target.value }))} /></div>
              </div>
            )}

            {isFaculty && (
              <div className="form-grid">
                <div className="field"><label>Domain / expertise</label>
                  <input placeholder="Machine Learning" value={profileForm.domain}
                    onChange={e => setProfileForm(p => ({ ...p, domain: e.target.value }))} /></div>
                <div className="field"><label>Position / designation</label>
                  <input placeholder="Associate Professor" value={profileForm.position}
                    onChange={e => setProfileForm(p => ({ ...p, position: e.target.value }))} /></div>
              </div>
            )}

            <div className="field"><label>Bio</label>
              <textarea rows={3} placeholder="A short bio about your background and interests" value={profileForm.bio}
                onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} /></div>

            <div className="form-grid">
              <div className="field"><label>Skills (comma-separated)</label>
                <input placeholder="Python, React, Research, ML" value={profileForm.skills}
                  onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))} /></div>
              <div className="field"><label>Interests (comma-separated)</label>
                <input placeholder="AI, Healthcare, Open Source" value={profileForm.interests}
                  onChange={e => setProfileForm(p => ({ ...p, interests: e.target.value }))} /></div>
            </div>

            <div className="form-grid">
              <div className="field"><label>LinkedIn URL</label>
                <input type="url" placeholder="https://linkedin.com/in/…" value={profileForm.linkedinUrl}
                  onChange={e => setProfileForm(p => ({ ...p, linkedinUrl: e.target.value }))} /></div>
              <div className="field"><label>GitHub URL</label>
                <input type="url" placeholder="https://github.com/…" value={profileForm.githubUrl}
                  onChange={e => setProfileForm(p => ({ ...p, githubUrl: e.target.value }))} /></div>
            </div>

            {isFaculty && <div className="field"><label>Contact info</label>
              <input placeholder="Office room, phone, or alternate email" value={profileForm.contactInfo}
                onChange={e => setProfileForm(p => ({ ...p, contactInfo: e.target.value }))} /></div>}

            {isStudent && <div className="field"><label>Achievements (one per line)</label>
              <textarea rows={3} placeholder="Best paper award 2024&#10;Dean's list 2023" value={profileForm.achievements}
                onChange={e => setProfileForm(p => ({ ...p, achievements: e.target.value }))} /></div>}

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save profile'}</button>
              {isStudent && <>
                <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                  Upload resume <input ref={resumeRef} type="file" style={{ display: 'none' }} onChange={doUploadResume} />
                </label>
                {profile?.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View resume</a>}
              </>}
            </div>
          </div>
        </form>
      </div>

      {/* Evaluations (student) */}
      {isStudent && evaluations.length > 0 && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '.85rem' }}>Faculty Evaluations</div>
          <div className="stack">
            {evaluations.map(ev => (
              <div key={ev._id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.4rem' }}>
                  <strong>{ev.project?.title}</strong>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>by {ev.faculty?.name}</span>
                </div>
                <p style={{ fontSize: '.875rem', color: 'var(--text-soft)', marginBottom: '.6rem' }}>{ev.detailedFeedback}</p>
                <div className="tags-row">
                  {['workQuality', 'efficiency', 'regularity', 'contribution'].map(m => (
                    <span key={m} className="badge badge-gray">{m}: {ev[m]}/5</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDER: ADMIN – USER TABLE
  // ════════════════════════════════════════════════════════
  const renderUsers = () => {
    const filtered = userRoleFilter ? adminUsers.filter(u => u.role === userRoleFilter) : adminUsers;
    return <>
      <div className="page-header">
        <h2>User Management</h2>
        <p>{filtered.length} users{userRoleFilter ? ` (${userRoleFilter})` : ''}</p>
      </div>
      <div className="filter-bar">
        <select className="filter-select" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="alumni">Alumni</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Branch / Domain</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
              : filtered.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td className="td-muted">{u.email}</td>
                    <td><span className={`badge ${u.role === 'faculty' ? 'badge-sage' : u.role === 'admin' ? 'badge-rose' : 'badge-gray'}`}>{ROLE_LABEL[u.role]}</span></td>
                    <td className="td-muted">{u.department || '—'}</td>
                    <td className="td-muted">{u.branch || u.domain || '—'}</td>
                    <td className="td-muted">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>;
  };

  // ════════════════════════════════════════════════════════
  // RENDER: ADMIN – ALL PROJECTS
  // ════════════════════════════════════════════════════════
  const renderAllProjects = () => (
    <>
      <div className="page-header">
        <h2>All Projects</h2>
        <p>{projects.length} total projects on the platform</p>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Faculty</th><th>Domain</th><th>Department</th><th>Applicants</th><th>Status</th><th>Posted</th></tr>
          </thead>
          <tbody>
            {projects.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No projects yet</td></tr>
              : projects.map(p => (
                  <tr key={p._id}>
                    <td><strong style={{ fontSize: '.875rem' }}>{p.title}</strong></td>
                    <td className="td-muted">{p.professor?.name || '—'}</td>
                    <td className="td-muted">{p.domain || '—'}</td>
                    <td className="td-muted">{p.department || '—'}</td>
                    <td className="td-muted">{p.applications?.length || 0}</td>
                    <td><span className={`badge ${PROJ_STATUS_CLS[p.status]}`}>{p.status}</span></td>
                    <td className="td-muted">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════
  // MAIN SHELL
  // ════════════════════════════════════════════════════════
  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">CS</div>
          <div className="sidebar-logo-text">
            CollabSphere
            <small>Campus Platform</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.key} className={`nav-item ${view === item.key ? 'active' : ''}`} onClick={() => nav(item.key)}>
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-meta">
            <div className="user-avatar">{initials(user.name)}</div>
            <div className="user-meta-text">
              <strong>{user.name}</strong>
              <span>{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', gap: '.5rem' }} onClick={doLogout}>
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={18} /></button>
            <div>
              <div className="topbar-title">{pageTitle}</div>
              <div className="topbar-subtitle">{user.name} · {ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          {isFaculty && view === 'my-projects' &&
            <button className="btn btn-primary btn-sm" onClick={() => nav('post-project')}><Icon name="post" size={15} /> New Project</button>}
          {isStudent && view === 'projects' && selectedProject &&
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProject(null)}><Icon name="back" size={15} /> All Projects</button>}
        </header>

        <div className="page-body">
          {view === 'dashboard'    && isStudent && renderStudentDashboard()}
          {view === 'dashboard'    && isFaculty && renderFacultyDashboard()}
          {view === 'dashboard'    && isAdmin   && renderAdminDashboard()}
          {view === 'projects'     && isStudent && renderProjects()}
          {view === 'applications' && isStudent && renderApplications()}
          {view === 'post-project' && isFaculty && renderPostProject()}
          {view === 'my-projects'  && isFaculty && renderMyProjects()}
          {view === 'users'        && isAdmin   && renderUsers()}
          {view === 'all-projects' && isAdmin   && renderAllProjects()}
          {view === 'bulletin'     && renderBulletin()}
          {view === 'profile'      && !isAdmin  && renderProfile()}
        </div>
      </div>

      {/* Apply modal */}
      {applyOpen && selectedProject && (
        <div className="modal-overlay" onClick={() => setApplyOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Apply: {selectedProject.title}</h3>
              <button className="modal-close" onClick={() => setApplyOpen(false)}><Icon name="close" size={16} /></button>
            </div>

            {/* Auto-attached profile snapshot */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '.875rem 1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.6rem' }}>
                Profile details attached automatically
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem .75rem', fontSize: '.875rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>CGPA: </span>
                  <span style={{ color: profile?.cgpa ? 'var(--text)' : 'var(--rose)', fontWeight: 500 }}>
                    {profile?.cgpa ? `${profile.cgpa} / 10` : 'Not set — add in Profile'}
                  </span>
                </div>
                <div><span style={{ color: 'var(--text-muted)' }}>Resume: </span>
                  {profile?.resumeUrl
                    ? <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sage)' }}>View ↗</a>
                    : <span style={{ color: 'var(--rose)' }}>Not set — add in Profile</span>}
                </div>
                <div><span style={{ color: 'var(--text-muted)' }}>LinkedIn: </span>
                  {profile?.linkedinUrl
                    ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sage)' }}>View ↗</a>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </div>
                <div><span style={{ color: 'var(--text-muted)' }}>GitHub: </span>
                  {profile?.githubUrl
                    ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sage)' }}>View ↗</a>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </div>
              </div>
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label>Statement of interest *</label>
              <textarea rows={5} value={applyPitch} onChange={e => setApplyPitch(e.target.value)}
                placeholder="Describe your relevant skills, past projects, and what you hope to learn or contribute…" />
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" disabled={loading || !applyPitch.trim()} onClick={doApply}>
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setApplyOpen(false); setApplyPitch(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-wrap">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
