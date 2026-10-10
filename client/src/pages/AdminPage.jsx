import { useEffect, useMemo, useRef, useState } from 'react';
import { adminToken, api, apiAssetUrl, SESSION_EXPIRED_EVENT } from '../utils/api.js';
import styles from './AdminPage.module.css';

const emptyTruck = {
  title: '',
  make: '',
  type: '',
  location: '',
  price: '',
  priceValue: '',
  mileage: '',
  mileageValue: '',
  year: '',
  gearbox: '',
  badge: '',
  cab: '',
  power: '',
  mot: '',
  description: '',
  image: '',
  status: 'available'
};

const emptyBlog = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  metaTitle: '',
  metaDescription: '',
  status: 'draft'
};

function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// While typing, keep a trailing hyphen so words can be separated; the final slug is trimmed on save.
function slugifyWhileTyping(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '');
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getLeadIdFromUrl() {
  const leadId = Number(new URLSearchParams(window.location.search).get('lead'));
  return Number.isInteger(leadId) && leadId > 0 ? leadId : null;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'pipeline', label: 'Sales pipeline' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'blog', label: 'Blog', roles: ['admin', 'manager'] },
  { id: 'users', label: 'Team', roles: ['admin', 'manager'] },
  { id: 'audit', label: 'Audit log', roles: ['admin', 'manager'] }
];

export function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [inventoryView, setInventoryView] = useState('stock');
  const [trucks, setTrucks] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [financeQuotes, setFinanceQuotes] = useState([]);
  const [partExchange, setPartExchange] = useState([]);
  const [chatLeads, setChatLeads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogView, setBlogView] = useState('list');
  const [blogForm, setBlogForm] = useState(emptyBlog);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [form, setForm] = useState(emptyTruck);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stockSearch, setStockSearch] = useState('');
  const [stockSort, setStockSort] = useState({ key: 'title', dir: 'asc' });
  const [leadFilters, setLeadFilters] = useState({ search: '', status: '', temperature: '', followUp: '', page: 1, limit: 10 });
  const [leadPagination, setLeadPagination] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadSearchInput, setLeadSearchInput] = useState('');
  const leadRequestRef = useRef(0);

  const isPrivileged = user ? ['admin', 'manager'].includes(user.role) : false;

  const dashboardStats = useMemo(
    () => [
      ['Trucks', trucks.filter((truck) => truck.status !== 'archived').length],
      ['Enquiries', enquiries.length],
      ['Finance quotes', financeQuotes.length],
      ['Part exchange', partExchange.length],
      ['Chat leads', dashboard?.leads ?? leadPagination?.total ?? chatLeads.length]
    ],
    [enquiries.length, financeQuotes.length, partExchange.length, trucks.length, chatLeads.length, dashboard, leadPagination]
  );

  const visibleTrucks = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();
    const filtered = query
      ? trucks.filter((truck) => [truck.title, truck.make, truck.type, truck.status].some((field) => String(field || '').toLowerCase().includes(query)))
      : trucks;
    const sorted = [...filtered].sort((a, b) => {
      const dir = stockSort.dir === 'asc' ? 1 : -1;
      const key = stockSort.key;
      const av = key === 'price' ? Number(a.priceValue) : String(a[key] ?? '').toLowerCase();
      const bv = key === 'price' ? Number(b.priceValue) : String(b[key] ?? '').toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return sorted;
  }, [trucks, stockSearch, stockSort]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => { api.me().then((r) => setUser(r.user)).catch(() => adminToken.clear()).finally(() => setAuthLoading(false)); }, []);
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setSelectedLead(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);
  useEffect(() => { if (user) loadAdminData(); }, [user]);
  useEffect(() => { if (user) loadChatLeads(leadFilters); }, [user, leadFilters]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeadFilters((current) => (current.search === leadSearchInput ? current : { ...current, search: leadSearchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [leadSearchInput]);
  useEffect(() => {
    const leadId = getLeadIdFromUrl();
    if (!user || !leadId) return;
    setActiveTab('pipeline');
    api.getChatLead(leadId).then((r) => setSelectedLead(r.data)).catch((error) => setMessage({ type: 'error', text: error.message }));
  }, [user]);
  useEffect(() => { if (isPrivileged) loadUsers(); }, [user]);
  useEffect(() => { if (isPrivileged && activeTab === 'audit') loadAuditLogs(auditPage); }, [user, activeTab, auditPage]);
  useEffect(() => { if (isPrivileged && activeTab === 'blog') loadBlogPosts(); }, [user, activeTab]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [truckData, enquiryData, financeData, partExchangeData, dashboardData, notificationData] = await Promise.all([
        api.listAdminTrucks(),
        api.listEnquiries(),
        api.listFinanceQuotes(),
        api.listPartExchange(),
        api.getDashboard(),
        api.listNotifications()
      ]);
      setTrucks(truckData.data || []);
      setEnquiries(enquiryData.data || []);
      setFinanceQuotes(financeData.data || []);
      setPartExchange(partExchangeData.data || []);
      setDashboard(dashboardData.data);
      setNotifications(notificationData.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function loadChatLeads(filters = leadFilters) {
    const requestId = ++leadRequestRef.current;
    try {
      const chatLeadData = await api.listChatLeads(filters);
      if (requestId !== leadRequestRef.current) return;
      setChatLeads(chatLeadData.data || []);
      setLeadPagination(chatLeadData.pagination);
    } catch (error) {
      if (requestId === leadRequestRef.current) setMessage({ type: 'error', text: error.message });
    }
  }

  async function refreshAll() {
    await Promise.all([loadAdminData(), loadChatLeads()]);
  }

  async function loadUsers() {
    try { const r = await api.listUsers(); setUsers(r.data || []); } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  async function loadAuditLogs(page) {
    try { const r = await api.listAuditLogs({ page }); setAuditLogs(r.data || []); } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  async function markNotificationRead(id) {
    try {
      await api.markNotificationRead(id);
      const [notificationData, dashboardData] = await Promise.all([api.listNotifications(), api.getDashboard()]);
      setNotifications(notificationData.data || []);
      setDashboard(dashboardData.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function createUser(payload) {
    await api.createUser(payload);
    setMessage({ type: 'success', text: 'Team member created.' });
    await loadUsers();
  }

  async function updateUser(id, payload) {
    try {
      await api.updateUser(id, payload);
      await loadUsers();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function loadBlogPosts() {
    try { const r = await api.listAllBlogs(); setBlogPosts(r.data || []); } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  function updateBlogForm(field, value) {
    setBlogForm((current) => ({ ...current, [field]: value }));
  }

  function updateBlogTitle(value) {
    setBlogForm((current) => ({
      ...current,
      title: value,
      slug: !current.slug || current.slug === slugify(current.title) ? slugify(value) : current.slug
    }));
  }

  function editBlogPost(post) {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      tags: (post.tags || []).join(', '),
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      status: post.status
    });
    setBlogView('form');
  }

  async function uploadBlogCover(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setMessage({ type: 'success', text: 'Uploading cover image…' });
      const result = await api.uploadTruckImage(file);
      updateBlogForm('coverImage', apiAssetUrl(result.url));
      setMessage({ type: 'success', text: 'Cover image uploaded. Save the post to apply it.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function saveBlogPost(event) {
    event.preventDefault();
    setMessage(null);
    try {
      const payload = { ...blogForm, slug: slugify(blogForm.slug) };
      if (!payload.slug) throw new Error('Please enter a URL slug using letters or numbers.');
      if (editingBlogId) {
        await api.updateBlog(editingBlogId, payload);
        setMessage({ type: 'success', text: 'Post updated.' });
      } else {
        await api.createBlog(payload);
        setMessage({ type: 'success', text: 'Post created.' });
      }
      setBlogForm(emptyBlog);
      setEditingBlogId(null);
      setBlogView('list');
      await loadBlogPosts();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function deleteBlogPost(post) {
    if (!window.confirm(`Delete the post "${post.title}"? This cannot be undone.`)) return;
    setMessage(null);
    try {
      await api.deleteBlog(post.id);
      setMessage({ type: 'success', text: 'Post deleted.' });
      await loadBlogPosts();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function logout() { try { await api.logout(); } catch { /* Session may already be gone. */ } finally { adminToken.clear(); setUser(null); } }

  if (authLoading) return <section className={styles.loginShell}><p>Checking secure session…</p></section>;
  if (!user) return <AdminLogin onLogin={setUser} />;

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editTruck(truck) {
    setActiveTab('inventory');
    setInventoryView('form');
    setEditingId(truck.id);
    setForm({
      title: truck.title,
      make: truck.make,
      type: truck.type,
      location: truck.location,
      price: truck.price,
      priceValue: truck.priceValue,
      mileage: truck.mileage,
      mileageValue: truck.mileageValue,
      year: truck.year,
      gearbox: truck.gearbox,
      badge: truck.badge || '',
      cab: truck.cab || '',
      power: truck.power || '',
      mot: truck.mot || '',
      description: truck.description || '',
      image: truck.image || '',
      status: truck.status || 'available'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveTruck(event) {
    event.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      priceValue: Number(form.priceValue),
      mileageValue: Number(form.mileageValue)
    };

    try {
      if (editingId) {
        await api.updateTruck(editingId, payload);
        setMessage({ type: 'success', text: 'Truck updated.' });
      } else {
        await api.createTruck(payload);
        setMessage({ type: 'success', text: 'Truck added.' });
      }
      setForm(emptyTruck);
      setEditingId(null);
      setInventoryView('stock');
      await loadAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setMessage({ type: 'success', text: 'Uploading image…' });
      const result = await api.uploadTruckImage(file);
      updateForm('image', apiAssetUrl(result.url));
      setMessage({ type: 'success', text: 'Image uploaded. Save the truck to apply it.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function deleteTruck(truck) {
    if (!window.confirm(`Archive "${truck.title}"? It will be hidden from the public site immediately.`)) return;
    setMessage(null);
    try {
      await api.deleteTruck(truck.id);
      setMessage({ type: 'success', text: 'Truck archived.' });
      await loadAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  function toggleSort(key) {
    setStockSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  const activeNavLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Overview';

  return (
    <div className={styles.adminApp}>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>MT</span>
          <span>MidLand Admin</span>
        </div>
        <ul className={styles.navList}>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.navButton} ${activeTab === item.id ? styles.navActive : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.sidebarFooter}>
          <span className={`${styles.badge} ${styles['role-' + user.role]}`}>{user.role}</span>
          <p>{user.name}</p>
        </div>
      </nav>

      <div className={styles.adminMain}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarEyebrow}>Admin panel</p>
            <h1>{activeNavLabel}</h1>
          </div>
          <div className={styles.topbarActions}>
            <NotificationBell
              notifications={notifications}
              unread={unreadCount}
              open={notifOpen}
              onToggle={() => setNotifOpen((v) => !v)}
              onMarkRead={markNotificationRead}
            />
            <div className={styles.adminIdentity}>
              <span>{user.name} · {user.role}</span>
              <button type="button" onClick={refreshAll}>Refresh</button>
              <button type="button" onClick={logout}>Log out</button>
            </div>
          </div>
        </header>

        <section className={styles.adminContent}>
          <div className={styles.adminStats}>
            {dashboardStats.map(([label, value]) => (
              <div className={styles.stat} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {dashboard && (
            <div className={styles.priorityStrip}>
              <strong>{dashboard.hotLeads} hot leads</strong>
              <span>{dashboard.newLeads} new</span>
              <span>{dashboard.followUps} follow-ups due</span>
              <span>{dashboard.unread} unread alerts</span>
            </div>
          )}

          {message && <p className={`${styles.formStatus} ${message.type === 'error' ? styles.formError : ''}`}>{message.text}</p>}
          {loading && <p className={styles.adminNote}>Loading admin data...</p>}

          {activeTab === 'overview' && (
            <OverviewPanel enquiries={enquiries} financeQuotes={financeQuotes} partExchange={partExchange} chatLeads={chatLeads} trucks={trucks} />
          )}

          {activeTab === 'inventory' && (
            <section className={styles.inventorySection}>
              <div className={styles.subTabs}>
                <button type="button" className={`${styles.subTabButton} ${inventoryView === 'stock' ? styles.subTabActive : ''}`} onClick={() => setInventoryView('stock')}>Truck stock</button>
                <button
                  type="button"
                  className={`${styles.subTabButton} ${inventoryView === 'form' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    if (inventoryView !== 'form') { setEditingId(null); setForm(emptyTruck); }
                    setInventoryView('form');
                  }}
                >
                  {editingId ? 'Edit truck' : 'Add truck'}
                </button>
              </div>

              {inventoryView === 'form' && (
              <form className={`${styles.contactForm} ${styles.adminForm}`} onSubmit={saveTruck}>
                <h2>{editingId ? 'Edit truck' : 'Add truck'}</h2>
                <AdminInput label="Title" value={form.title} onChange={(value) => updateForm('title', value)} required />
                <div className={styles.formRow}>
                  <AdminInput label="Make" value={form.make} onChange={(value) => updateForm('make', value)} required />
                  <AdminInput label="Body type" value={form.type} onChange={(value) => updateForm('type', value)} required />
                </div>
                <AdminInput label="Location" value={form.location} onChange={(value) => updateForm('location', value)} required />
                <div className={styles.formRow}>
                  <AdminInput label="Price label" value={form.price} onChange={(value) => updateForm('price', value)} required />
                  <AdminInput label="Price number" type="number" value={form.priceValue} onChange={(value) => updateForm('priceValue', value)} required />
                </div>
                <div className={styles.formRow}>
                  <AdminInput label="Mileage label" value={form.mileage} onChange={(value) => updateForm('mileage', value)} required />
                  <AdminInput label="Mileage number" type="number" value={form.mileageValue} onChange={(value) => updateForm('mileageValue', value)} required />
                </div>
                <div className={styles.formRow}>
                  <AdminInput label="Year" value={form.year} onChange={(value) => updateForm('year', value)} required />
                  <AdminInput label="Gearbox" value={form.gearbox} onChange={(value) => updateForm('gearbox', value)} required />
                </div>
                <div className={styles.formRow}>
                  <AdminInput label="Badge" value={form.badge} onChange={(value) => updateForm('badge', value)} />
                  <label>
                    Status
                    <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                </div>
                <div className={styles.formRow}>
                  <AdminInput label="Cab" value={form.cab} onChange={(value) => updateForm('cab', value)} />
                  <AdminInput label="Power" value={form.power} onChange={(value) => updateForm('power', value)} />
                </div>
                <AdminInput label="MOT" value={form.mot} onChange={(value) => updateForm('mot', value)} />
                <AdminInput label="Image URL" value={form.image} onChange={(value) => updateForm('image', value)} />
                <label>Upload truck image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} /></label>
                <label>
                  Description
                  <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
                </label>
                <button type="submit">{editingId ? 'Update truck' : 'Add truck'}</button>
                {editingId && (
                  <button
                    className={styles.adminSecondary}
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyTruck);
                      setInventoryView('stock');
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </form>
              )}

              {inventoryView === 'stock' && (
              <div className={styles.adminTablePanel}>
                <div className={styles.panelHeader}>
                  <h2>Truck stock</h2>
                  <input
                    className={styles.searchInput}
                    placeholder="Search title, make, type, status…"
                    value={stockSearch}
                    onChange={(event) => setStockSearch(event.target.value)}
                  />
                </div>
                <div className={styles.adminTableWrap}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('title')}>Truck {stockSort.key === 'title' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('price')}>Price {stockSort.key === 'price' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('status')}>Status {stockSort.key === 'status' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTrucks.map((truck) => (
                        <tr key={truck.id}>
                          <td>{truck.image ? <img className={styles.thumb} src={truck.image} alt="" /> : <div className={styles.thumbPlaceholder} />}</td>
                          <td>
                            <strong>{truck.title}</strong>
                            <span>{truck.make} / {truck.type}</span>
                          </td>
                          <td>{truck.price}</td>
                          <td><span className={`${styles.badge} ${styles['status-' + truck.status]}`}>{truck.status}</span></td>
                          <td>
                            <button type="button" onClick={() => editTruck(truck)}>Edit</button>
                            {user.role === 'admin' && truck.status !== 'archived' && <button type="button" onClick={() => deleteTruck(truck)}>Archive</button>}
                          </td>
                        </tr>
                      ))}
                      {visibleTrucks.length === 0 && (
                        <tr><td colSpan={5}>No trucks match this search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </section>
          )}

          {activeTab === 'pipeline' && (
            <section className={styles.adminTablePanel}>
              <h2>Chat sales pipeline</h2>
              <p className={styles.adminNote}>Qualified website leads, ordered newest first.</p>
              <div className={styles.leadFilters}>
                <input placeholder="Search name, phone, email, postcode…" value={leadSearchInput} onChange={(e) => setLeadSearchInput(e.target.value)} />
                <select value={leadFilters.status} onChange={(e) => setLeadFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
                  <option value="">All statuses</option>
                  <option>new</option>
                  <option>contacted</option>
                  <option>qualified</option>
                  <option value="viewing-booked">viewing booked</option>
                  <option>won</option>
                  <option>lost</option>
                </select>
                <select value={leadFilters.temperature} onChange={(e) => setLeadFilters((f) => ({ ...f, temperature: e.target.value, page: 1 }))}>
                  <option value="">All priorities</option>
                  <option>hot</option>
                  <option>warm</option>
                  <option>cold</option>
                </select>
                <label><input type="checkbox" checked={leadFilters.followUp === 'due'} onChange={(e) => setLeadFilters((f) => ({ ...f, followUp: e.target.checked ? 'due' : '', page: 1 }))} /> Follow-ups due</label>
              </div>
              <div className={styles.pipeline}>
                {chatLeads.length === 0 && <p className={styles.adminNote}>No chatbot leads yet.</p>}
                {chatLeads.map((lead) => <ChatLeadCard key={lead.id} lead={lead} onUpdated={() => Promise.all([loadChatLeads(), loadAdminData()])} onOpen={async () => { try { setSelectedLead((await api.getChatLead(lead.id)).data); } catch (error) { setMessage({ type: 'error', text: error.message }); } }} />)}
              </div>
              {leadPagination && (
                <div className={styles.pagination}>
                  <button disabled={leadPagination.page <= 1} onClick={() => setLeadFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
                  <span>Page {leadPagination.page} of {leadPagination.pages || 1} · {leadPagination.total} leads</span>
                  <button disabled={leadPagination.page >= leadPagination.pages} onClick={() => setLeadFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'enquiries' && (
            <section className={styles.adminLeads}>
              <LeadList title="Enquiries" items={enquiries} fields={['name', 'phone', 'requirement']} />
              <LeadList title="Finance quotes" items={financeQuotes} fields={['name', 'phone', 'monthlyEstimate']} />
              <LeadList title="Part exchange" items={partExchange} fields={['registration', 'mileage', 'notes']} />
            </section>
          )}

          {activeTab === 'blog' && isPrivileged && (
            <BlogPanel
              posts={blogPosts}
              view={blogView}
              onViewChange={setBlogView}
              form={blogForm}
              editingId={editingBlogId}
              onTitleChange={updateBlogTitle}
              onFieldChange={updateBlogForm}
              onUploadCover={uploadBlogCover}
              onSubmit={saveBlogPost}
              onNew={() => { setEditingBlogId(null); setBlogForm(emptyBlog); setBlogView('form'); }}
              onCancelEdit={() => { setEditingBlogId(null); setBlogForm(emptyBlog); setBlogView('list'); }}
              onEdit={editBlogPost}
              onDelete={deleteBlogPost}
            />
          )}

          {activeTab === 'users' && isPrivileged && (
            <UsersPanel users={users} currentUser={user} onCreate={createUser} onUpdate={updateUser} />
          )}

          {activeTab === 'audit' && isPrivileged && (
            <AuditLogPanel logs={auditLogs} page={auditPage} onPageChange={setAuditPage} />
          )}

          {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />}
        </section>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function BlogPanel({ posts, view, onViewChange, form, editingId, onTitleChange, onFieldChange, onUploadCover, onSubmit, onNew, onCancelEdit, onEdit, onDelete }) {
  return (
    <section className={styles.inventorySection}>
      <div className={styles.subTabs}>
        <button type="button" className={`${styles.subTabButton} ${view === 'list' ? styles.subTabActive : ''}`} onClick={() => onViewChange('list')}>Posts</button>
        <button
          type="button"
          className={`${styles.subTabButton} ${view === 'form' ? styles.subTabActive : ''}`}
          onClick={() => { if (view !== 'form') onNew(); else onViewChange('form'); }}
        >
          {editingId ? 'Edit post' : 'Add post'}
        </button>
      </div>

      {view === 'form' && (
        <form className={`${styles.contactForm} ${styles.adminForm}`} onSubmit={onSubmit}>
          <h2>{editingId ? 'Edit post' : 'Add post'}</h2>
          <AdminInput label="Title" value={form.title} onChange={onTitleChange} required />
          <AdminInput label="URL slug" value={form.slug} onChange={(value) => onFieldChange('slug', slugifyWhileTyping(value))} required />
          <label>
            Excerpt (shown on blog listing and search results)
            <textarea value={form.excerpt} maxLength={320} onChange={(event) => onFieldChange('excerpt', event.target.value)} />
            <span className={styles.charCount}>{form.excerpt.length}/320</span>
          </label>
          <label>
            Content
            <textarea className={styles.contentArea} value={form.content} onChange={(event) => onFieldChange('content', event.target.value)} required />
          </label>
          <AdminInput label="Cover image URL" value={form.coverImage} onChange={(value) => onFieldChange('coverImage', value)} />
          <label>Upload cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUploadCover} /></label>
          <AdminInput label="Tags (comma separated)" value={form.tags} onChange={(value) => onFieldChange('tags', value)} />
          <div className={styles.formRow}>
            <label>
              Meta title (SEO)
              <input value={form.metaTitle} maxLength={70} onChange={(event) => onFieldChange('metaTitle', event.target.value)} />
              <span className={styles.charCount}>{form.metaTitle.length}/70</span>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => onFieldChange('status', event.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label>
            Meta description (SEO)
            <textarea value={form.metaDescription} maxLength={160} onChange={(event) => onFieldChange('metaDescription', event.target.value)} />
            <span className={styles.charCount}>{form.metaDescription.length}/160</span>
          </label>
          <button type="submit">{editingId ? 'Update post' : form.status === 'published' ? 'Publish post' : 'Save draft'}</button>
          {editingId && <button className={styles.adminSecondary} type="button" onClick={onCancelEdit}>Cancel edit</button>}
        </form>
      )}

      {view === 'list' && (
        <div className={styles.adminTablePanel}>
          <h2>Blog posts</h2>
          <div className={styles.adminTableWrap}>
            <table className={styles.adminTable}>
              <thead>
                <tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <strong>{post.title}</strong>
                      <span>/blog/{post.slug}</span>
                    </td>
                    <td><span className={`${styles.badge} ${post.status === 'published' ? styles.badgeActive : styles.badgeInactive}`}>{post.status}</span></td>
                    <td>{new Date(post.updatedAt).toLocaleString('en-GB')}</td>
                    <td>
                      {post.status === 'published' && <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"><button type="button">View</button></a>}
                      <button type="button" onClick={() => onEdit(post)}>Edit</button>
                      <button type="button" onClick={() => onDelete(post)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={4}>No blog posts yet. Create your first SEO post.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function OverviewPanel({ enquiries, financeQuotes, partExchange, chatLeads, trucks }) {
  const recentLeads = [...chatLeads].slice(0, 5);
  return (
    <section className={styles.adminGrid}>
      <div className={styles.adminTablePanel}>
        <h2>Recent chat leads</h2>
        <p className={styles.adminNote}>Newest qualified leads from the website chatbot.</p>
        <div className={styles.leadList}>
          {recentLeads.length === 0 && <p className={styles.adminNote}>No chatbot leads yet.</p>}
          {recentLeads.map((lead) => (
            <article key={lead.id}>
              <span><strong>Name</strong>{lead.name}</span>
              <span><strong>Priority</strong>{lead.temperature} · {lead.leadScore}/100</span>
              <span><strong>Requirement</strong>{lead.requirement}</span>
            </article>
          ))}
        </div>
      </div>
      <div className={styles.adminTablePanel}>
        <h2>Snapshot</h2>
        <p className={styles.adminNote}>Everything else in one place.</p>
        <div className={styles.leadList}>
          <article><span><strong>Live stock</strong>{trucks.filter((t) => t.status === 'available').length} available of {trucks.filter((t) => t.status !== 'archived').length} listed</span></article>
          <article><span><strong>Website enquiries</strong>{enquiries.length} logged</span></article>
          <article><span><strong>Finance quotes</strong>{financeQuotes.length} requested</span></article>
          <article><span><strong>Part exchange</strong>{partExchange.length} requested</span></article>
        </div>
      </div>
    </section>
  );
}

function NotificationBell({ notifications, unread, open, onToggle, onMarkRead }) {
  return (
    <div className={styles.notifWrap}>
      <button type="button" className={styles.notifButton} onClick={onToggle} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className={styles.notifBadge}>{unread}</span>}
      </button>
      {open && (
        <div className={styles.notifDropdown}>
          <h3>Notifications</h3>
          {notifications.length === 0 && <p className={styles.adminNote}>You&apos;re all caught up.</p>}
          {notifications.map((item) => (
            <article key={item.id} className={`${styles.notifItem} ${item.is_read ? '' : styles.notifUnread}`}>
              <strong>{item.link ? <a href={item.link}>{item.title}</a> : item.title}</strong>
              <p>{item.message}</p>
              <div className={styles.notifMeta}>
                <time>{new Date(item.created_at).toLocaleString('en-GB')}</time>
                {!item.is_read && <button type="button" onClick={() => onMarkRead(item.id)}>Mark read</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPanel({ users, currentUser, onCreate, onUpdate }) {
  const isAdmin = currentUser.role === 'admin';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'salesperson' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await onCreate(form);
      setForm({ name: '', email: '', password: '', role: 'salesperson' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className={styles.adminGrid}>
      {isAdmin && (
        <form className={`${styles.contactForm} ${styles.adminForm}`} onSubmit={submit}>
          <h2>Add team member</h2>
          <AdminInput label="Name" value={form.name} onChange={(value) => setForm((f) => ({ ...f, name: value }))} required />
          <AdminInput label="Email" type="email" value={form.email} onChange={(value) => setForm((f) => ({ ...f, email: value }))} required />
          <AdminInput label="Temporary password" type="password" value={form.password} onChange={(value) => setForm((f) => ({ ...f, password: value }))} required />
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}>
              <option value="salesperson">Salesperson</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {error && <p className={`${styles.formStatus} ${styles.formError}`}>{error}</p>}
          <button type="submit">Create user</button>
        </form>
      )}

      <div className={styles.adminTablePanel}>
        <h2>Team members</h2>
        <div className={styles.adminTableWrap}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </td>
                  <td>
                    {isAdmin && member.id !== currentUser.id ? (
                      <select value={member.role} onChange={(event) => onUpdate(member.id, { role: event.target.value })}>
                        <option value="salesperson">Salesperson</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`${styles.badge} ${styles['role-' + member.role]}`}>{member.role}</span>
                    )}
                  </td>
                  <td><span className={`${styles.badge} ${member.active ? styles.badgeActive : styles.badgeInactive}`}>{member.active ? 'Active' : 'Disabled'}</span></td>
                  {isAdmin && (
                    <td>
                      {member.id !== currentUser.id && (
                        <button type="button" onClick={() => onUpdate(member.id, { active: !member.active })}>
                          {member.active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={isAdmin ? 4 : 3}>No team members found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AuditLogPanel({ logs, page, onPageChange }) {
  return (
    <section className={styles.adminTablePanel}>
      <h2>Audit log</h2>
      <p className={styles.adminNote}>Every sensitive admin action, newest first.</p>
      <div className={styles.adminTableWrap}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString('en-GB')}</td>
                <td>{log.user_name || 'System'}</td>
                <td><span className={styles.badge}>{log.action}</span></td>
                <td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4}>No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>Previous</button>
        <span>Page {page}</span>
        <button disabled={logs.length < 25} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </section>
  );
}

function LeadList({ title, items, fields }) {
  return (
    <div className={styles.adminTablePanel}>
      <h2>{title}</h2>
      <div className={styles.leadList}>
        {items.length === 0 && <p className={styles.adminNote}>No records yet.</p>}
        {items.map((item) => (
          <article key={`${title}-${item.id}`}>
            {fields.map((field) => (
              <span key={field}>
                <strong>{field}</strong>
                {String(item[field] || '')}
              </span>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function ChatLeadCard({ lead, onUpdated, onOpen }) {
  const [status, setStatus] = useState(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo || '');
  const [salesNotes, setSalesNotes] = useState(lead.salesNotes || '');
  const [followUpAt, setFollowUpAt] = useState(() => toDateTimeLocal(lead.followUpAt));
  const [saveState, setSaveState] = useState({ status: 'idle', text: '' });

  async function save() {
    setSaveState({ status: 'saving', text: 'Saving…' });
    try {
      await api.updateChatLead(lead.id, {
        status,
        assignedTo,
        salesNotes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null
      });
      setSaveState({ status: 'saved', text: 'Saved.' });
      onUpdated();
    } catch (error) {
      setSaveState({ status: 'error', text: error.message });
    }
  }

  return <article className={styles.pipelineCard}>
    <header><div><span className={`${styles.temperature} ${styles[lead.temperature]}`}>{lead.temperature} · {lead.leadScore}/100</span><h3>{lead.name}</h3><p>{lead.company || 'Private buyer'} · {lead.postcode || 'Postcode not supplied'}</p></div><time>{new Date(lead.createdAt).toLocaleString('en-GB')}</time></header>
    <div className={styles.leadFacts}>
      <a href={`tel:${lead.phone}`}>Call: {lead.phone}</a><a href={`mailto:${lead.email}`}>Email: {lead.email || 'No email'}</a><a target="_blank" rel="noreferrer" href={`https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '44')}?text=${encodeURIComponent(`Hello ${lead.name}, this is MidLand Trucks regarding your enquiry.`)}`}>WhatsApp</a>
      <span>Budget: {lead.budget ? `£${Number(lead.budget).toLocaleString('en-GB')} ${lead.budgetVat}` : 'Not supplied'}</span>
      <span>Timeline: {lead.purchaseTimeline || 'Not supplied'}</span><span>Vehicle: {lead.vehicleType || 'Open requirement'}</span>
      <span>{lead.financeRequired ? 'Finance required' : 'No finance request'} · {lead.partExchange ? 'Part exchange' : 'No part exchange'}</span>
    </div>
    <p className={styles.requirement}>{lead.requirement}</p>
    <div className={styles.pipelineControls}>
      <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="viewing-booked">Viewing booked</option><option value="won">Won</option><option value="lost">Lost</option></select></label>
      <label>Assigned to<input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Salesperson" /></label>
      <label>Follow-up<input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} /></label>
      <label>Sales notes<textarea value={salesNotes} onChange={(e) => setSalesNotes(e.target.value)} /></label>
      <button type="button" onClick={onOpen}>Details & transcript</button>
      <button type="button" onClick={save} disabled={saveState.status === 'saving'}>Save lead</button>
      {saveState.text && <p className={`${styles.formStatus} ${saveState.status === 'error' ? styles.formError : ''}`}>{saveState.text}</p>}
    </div>
  </article>;
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: 'admin@midlandtrucks.co.uk', password: '' }); const [error, setError] = useState(''); const [forgot, setForgot] = useState(false);
  async function submit(e) { e.preventDefault(); setError(''); try { if (forgot) { const r = await api.forgotPassword(form.email); setError(r.message); return; } const r = await api.login(form); adminToken.set(r.token); onLogin(r.user); } catch (err) { setError(err.message); } }
  return <section className={styles.loginShell}><form onSubmit={submit} className={styles.loginCard}><p className="eyebrow">Secure administration</p><h1>{forgot ? 'Reset password' : 'Welcome back'}</h1><label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>{!forgot && <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}{error && <p className={styles.formStatus}>{error}</p>}<button type="submit">{forgot ? 'Send reset instructions' : 'Log in securely'}</button><button className={styles.linkButton} type="button" onClick={() => setForgot(!forgot)}>{forgot ? 'Back to login' : 'Forgot password?'}</button></form></section>;
}

function LeadDetail({ lead, onClose }) { return <div className={styles.modalBackdrop} role="dialog" aria-modal="true"><section className={styles.leadDetail}><header><div><p className="eyebrow">Lead #{lead.id}</p><h2>{lead.name}</h2></div><button onClick={onClose}>Close</button></header><h3>Conversation transcript</h3><div className={styles.transcript}>{lead.transcript?.length ? lead.transcript.map((m, i) => <p key={i}><strong>{m.sender}</strong>{m.text}</p>) : <p>No transcript captured.</p>}</div><h3>Status history</h3><div className={styles.history}>{lead.history?.length ? lead.history.map((h) => <p key={h.id}><strong>{h.from_status} → {h.to_status}</strong><span>{h.changed_by_name} · {new Date(h.created_at).toLocaleString('en-GB')}</span></p>) : <p>No status changes yet.</p>}</div></section></div>; }
