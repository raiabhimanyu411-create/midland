import { useEffect, useMemo, useRef, useState } from 'react';
import { api, apiAssetUrl, SESSION_EXPIRED_EVENT } from '../utils/api.js';
import styles from './AdminPage.module.css';
import { BrandMark } from '../components/BrandLogo.jsx';
import { truckDisplayTitle, truckDisplayPrice } from '../../../shared/truck.js';

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
  registration: '',
  vin: '',
  vatStatus: '',
  axle: '',
  grossWeight: '',
  payload: '',
  euroRating: '',
  cleanAir: '',
  motExpiry: '',
  serviceHistory: '',
  owners: '',
  warranty: '',
  fuelType: '',
  colour: '',
  tacho: '',
  videoUrl: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  featured: false,
  sortOrder: 0,
  soldAt: '',
  soldPrice: '',
  badge: '',
  cab: '',
  power: '',
  mot: '',
  description: '',
  image: '',
  images: [],
  status: 'available'
};

const MAX_TRUCK_IMAGES = 9;
const MAX_TRUCK_IMAGE_SIZE = 25 * 1024 * 1024;
const MAX_TRUCK_UPLOAD_SIZE = 950 * 1024;
const TRUCK_FORM_STEPS = [
  { id: 'basics', label: 'Basic details', hint: 'Price, status & registration' },
  { id: 'specs', label: 'Vehicle specs', hint: 'Technical details & history' },
  { id: 'photos', label: 'Photos & video', hint: 'Gallery & walkaround' },
  { id: 'description', label: 'Description & SEO', hint: 'Listing copy & search' }
];

function uniqueTruckImages(images) {
  return [...new Set((Array.isArray(images) ? images : [])
    .filter((image) => typeof image === 'string' && image.trim())
    .map((image) => image.trim()))];
}

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

async function compressTruckPhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be opened. Please choose another photo.');
  }
  // Keep every upload under ~0.95 MB: many hosts (e.g. Nginx by default) reject bodies over 1 MB with a 413.
  const attempts = [[1800, 0.82], [1800, 0.7], [1500, 0.7], [1280, 0.65], [1024, 0.6]];
  let blob = null;
  try {
    for (const [maxEdge, quality] of attempts) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Photo compression is unavailable in this browser.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not compress this photo.')), 'image/webp', quality));
      if (blob.size <= MAX_TRUCK_UPLOAD_SIZE) break;
    }
  } finally {
    bitmap.close?.();
  }
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'truck-photo';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

// UK adverts use miles: DVSA odometer readings can come back in km.
function toMilesLabel(value, unit) {
  const number = Number(String(value).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(number) || number <= 0) return String(value);
  const miles = /^k/i.test(String(unit || '')) ? Math.round(number * 0.621371) : Math.round(number);
  return `${miles.toLocaleString('en-GB')} miles`;
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
  { id: 'audit', label: 'Audit log', roles: ['admin', 'manager'] },
  { id: 'account', label: 'My account' }
];

export function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [inventoryView, setInventoryView] = useState('stock');
  const [trucks, setTrucks] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
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
  const [truckFormStep, setTruckFormStep] = useState('basics');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stockSearch, setStockSearch] = useState('');
  const [stockSort, setStockSort] = useState({ key: 'title', dir: 'asc' });
  const [stockStatus, setStockStatus] = useState('all');
  const [leadFilters, setLeadFilters] = useState({ search: '', status: '', temperature: '', followUp: '', page: 1, limit: 10 });
  const [leadPagination, setLeadPagination] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadSearchInput, setLeadSearchInput] = useState('');
  const leadRequestRef = useRef(0);
  const draggedTruckImageRef = useRef(null);
  const csvInputRef = useRef(null);
  // Snapshot of the truck form when it was opened, to warn before unsaved changes are lost.
  const formSnapshotRef = useRef(JSON.stringify(emptyTruck));

  const isPrivileged = user ? ['admin', 'manager'].includes(user.role) : false;
  const canEditInventory = isPrivileged;

  const dashboardStats = useMemo(
    () => [
      ['Trucks', trucks.filter((truck) => truck.status !== 'archived').length],
      ['Enquiries', enquiries.length],
      ['Part exchange', partExchange.length],
      ['Chat leads', dashboard?.leads ?? leadPagination?.total ?? chatLeads.length]
    ],
    [enquiries.length, partExchange.length, trucks.length, chatLeads.length, dashboard, leadPagination]
  );

  const visibleTrucks = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();
    const filtered = query
      ? trucks.filter((truck) => [truck.title, truck.make, truck.type, truck.status, truck.registration].some((field) => String(field || '').toLowerCase().includes(query)))
      : trucks;
    const byStatus = stockStatus === 'all' ? filtered : filtered.filter((truck) => truck.status === stockStatus);
    const sorted = [...byStatus].sort((a, b) => {
      const dir = stockSort.dir === 'asc' ? 1 : -1;
      const key = stockSort.key;
      const av = key === 'price' ? Number(a.priceValue) : String(a[key] ?? '').toLowerCase();
      const bv = key === 'price' ? Number(b.priceValue) : String(b[key] ?? '').toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return sorted;
  }, [trucks, stockSearch, stockSort, stockStatus]);

  const stockCounts = useMemo(() => {
    const counts = { all: trucks.length };
    trucks.forEach((truck) => { counts[truck.status] = (counts[truck.status] || 0) + 1; });
    return counts;
  }, [trucks]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    if (!message || message.type === 'error') return undefined;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => { api.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setAuthLoading(false)); }, []);
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setSelectedLead(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);
  useEffect(() => { if (user) loadAdminData(); }, [user]);
  useEffect(() => {
    if (!user || !isPrivileged) return;
    api.getVehicleLookupStatus().then((response) => setLookupStatus(response.data)).catch(() => setLookupStatus({ dvla: false, dvsaMot: false }));
  }, [user, isPrivileged]);
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
      const [truckData, enquiryData, partExchangeData, dashboardData, notificationData] = await Promise.all([
        api.listAdminTrucks(),
        api.listEnquiries(),
        api.listPartExchange(),
        api.getDashboard(),
        api.listNotifications()
      ]);
      setTrucks(truckData.data || []);
      setEnquiries(enquiryData.data || []);
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

  async function logout() { try { await api.logout(); } catch { /* Session may already be gone. */ } finally { setUser(null); } }

  if (authLoading) return <section className={styles.loginShell}><p>Checking secure session…</p></section>;
  if (!user) return <AdminLogin onLogin={setUser} />;

  // Typing a price or mileage number fills the advert label too, unless it was written by hand.
  function updateForm(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'priceValue' && (!current.price || current.price === autoPriceLabel(current.priceValue))) next.price = autoPriceLabel(value);
      if (field === 'mileageValue' && (!current.mileage || current.mileage === autoMileageLabel(current.mileageValue))) next.mileage = autoMileageLabel(value);
      return next;
    });
  }

  const formIsDirty = () => JSON.stringify(form) !== formSnapshotRef.current;
  const confirmDiscard = () => !formIsDirty() || window.confirm('Discard your unsaved changes to this truck?');

  function resetTruckForm(view) {
    setEditingId(null);
    setForm(emptyTruck);
    formSnapshotRef.current = JSON.stringify(emptyTruck);
    setTruckFormStep('basics');
    setInventoryView(view);
  }

  function startNewTruck() {
    if (inventoryView === 'form' && !confirmDiscard()) return;
    setActiveTab('inventory');
    resetTruckForm('form');
  }

  function cancelTruckForm() {
    if (!confirmDiscard()) return;
    resetTruckForm('stock');
  }

  function goToTab(tab) {
    setActiveTab(tab);
    setMessage(null);
    setNotifOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async function openLead(lead) {
    try { setSelectedLead((await api.getChatLead(lead.id)).data); } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  function editTruck(truck) {
    if (inventoryView === 'form' && editingId !== truck.id && !confirmDiscard()) return;
    setActiveTab('inventory');
    setInventoryView('form');
    setEditingId(truck.id);
    setTruckFormStep('basics');
    const truckImages = uniqueTruckImages(truck.images?.length ? truck.images : [truck.image]);
    const next = {
      title: truck.title,
      make: truck.make,
      type: truck.type,
      location: truck.location,
      price: String(truck.price || '').replace(/^GBP\s*/i, '£'),
      priceValue: truck.priceValue || '',
      mileage: truck.mileage,
      mileageValue: truck.mileageValue || '',
      year: truck.year,
      gearbox: truck.gearbox,
      registration: truck.registration || '',
      vin: truck.vin || '',
      vatStatus: truck.vatStatus || '',
      axle: truck.axle || '',
      grossWeight: truck.grossWeight || '',
      payload: truck.payload || '',
      euroRating: truck.euroRating || '',
      cleanAir: truck.cleanAir || '',
      motExpiry: truck.motExpiry || '',
      serviceHistory: truck.serviceHistory || '',
      owners: truck.owners || '',
      warranty: truck.warranty || '',
      fuelType: truck.fuelType || '',
      colour: truck.colour || '',
      tacho: truck.tacho || '',
      videoUrl: truck.videoUrl || '',
      slug: truck.slug || '',
      metaTitle: truck.metaTitle || '',
      metaDescription: truck.metaDescription || '',
      featured: Boolean(truck.featured),
      sortOrder: truck.sortOrder || 0,
      soldAt: truck.soldAt ? String(truck.soldAt).slice(0, 10) : '',
      soldPrice: truck.soldPrice ?? '',
      badge: truck.badge || '',
      cab: truck.cab || '',
      power: truck.power || '',
      mot: truck.mot || '',
      description: truck.description || '',
      image: truck.image || truckImages[0] || '',
      images: truckImages,
      status: truck.status || 'available'
    };
    setForm(next);
    formSnapshotRef.current = JSON.stringify(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveTruck(event) {
    event.preventDefault();
    setMessage(null);
    const images = uniqueTruckImages([form.image, ...form.images]);
    const payload = {
      ...form,
      images,
      image: form.image || images[0],
      priceValue: Number(form.priceValue),
      mileageValue: Number(form.mileageValue)
    };

    if (uploadingImages) {
      setMessage({ type: 'error', text: 'Please wait for photo uploads to finish before saving.' });
      return;
    }

    try {
      if (editingId) {
        await api.updateTruck(editingId, payload);
        setMessage({ type: 'success', text: payload.status === 'archived' ? 'Truck updated and remains hidden from the website.' : 'Truck updated; the website listing is live.' });
      } else {
        await api.createTruck(payload);
        setMessage({ type: 'success', text: payload.status === 'archived' ? 'Truck saved as archived stock.' : 'Truck added; the website listing is live.' });
      }
      resetTruckForm('stock');
      await loadAdminData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function uploadImages(event) {
    const input = event.currentTarget;
    const files = Array.from(event.dataTransfer?.files || input.files || []);
    if ('value' in input) input.value = '';
    if (event.dataTransfer?.files?.length) event.preventDefault();
    if (files.length === 0) return;

    const existingImages = uniqueTruckImages([form.image, ...form.images]);
    const availableSlots = MAX_TRUCK_IMAGES - existingImages.length;
    if (files.length > availableSlots) {
      setMessage({ type: 'error', text: `You can add ${availableSlots} more photo${availableSlots === 1 ? '' : 's'}. A truck can have up to ${MAX_TRUCK_IMAGES}.` });
      return;
    }
    const unsupportedFile = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (unsupportedFile) {
      setMessage({ type: 'error', text: `${unsupportedFile.name} is not a supported image. Choose a JPEG, PNG or WebP file.` });
      return;
    }
    const oversizedFile = files.find((file) => file.size > MAX_TRUCK_IMAGE_SIZE);
    if (oversizedFile) {
      setMessage({ type: 'error', text: `${oversizedFile.name} is larger than 25 MB. Choose a smaller image.` });
      return;
    }

    setUploadingImages(true);
    let uploaded = 0;
    const failures = [];
    try {
      for (const [index, file] of files.entries()) {
        setMessage({ type: 'success', text: `Uploading photo ${index + 1} of ${files.length}…` });
        try {
          const compressedFile = await compressTruckPhoto(file);
          if (compressedFile.size > MAX_TRUCK_UPLOAD_SIZE) throw new Error('this photo is too detailed to shrink below 1 MB. Try a smaller or cropped version');
          const result = await api.uploadTruckImage(compressedFile);
          const imageUrl = apiAssetUrl(result.url);
          setForm((current) => {
            const images = uniqueTruckImages([current.image, ...current.images, imageUrl]);
            return { ...current, image: current.image || imageUrl, images };
          });
          uploaded += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
      }
      if (failures.length > 0) {
        setMessage({ type: 'error', text: `${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded; ${failures.length} failed. ${failures.join(' ')}` });
      } else {
        setMessage({ type: 'success', text: `${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded. Save the truck to publish the listing.` });
      }
    } finally {
      setUploadingImages(false);
    }
  }

  function removeTruckImage(imageUrl) {
    setForm((current) => {
      const images = uniqueTruckImages(current.images).filter((image) => image !== imageUrl);
      return { ...current, images, image: current.image === imageUrl ? images[0] || '' : current.image };
    });
  }

  function setPrimaryTruckImage(imageUrl) {
    setForm((current) => ({
      ...current,
      image: imageUrl,
      images: uniqueTruckImages([imageUrl, ...current.images])
    }));
  }

  function reorderTruckImage(sourceUrl, targetUrl) {
    if (!sourceUrl || !targetUrl || sourceUrl === targetUrl) return;
    setForm((current) => {
      const images = uniqueTruckImages([current.image, ...current.images]);
      const from = images.indexOf(sourceUrl);
      const to = images.indexOf(targetUrl);
      if (from < 0 || to < 0) return current;
      images.splice(from, 1);
      images.splice(to, 0, sourceUrl);
      return { ...current, image: images[0] || '', images };
    });
  }

  async function lookupRegistration() {
    if (!form.registration.trim()) {
      setMessage({ type: 'error', text: 'Enter the UK registration number first.' });
      return;
    }
    setLookupLoading(true);
    setMessage(null);
    try {
      const response = await api.lookupVehicleByRegistration(form.registration);
      const vehicle = response.data;
      setForm((current) => ({
        ...current,
        registration: vehicle.registration || current.registration,
        make: vehicle.make || current.make,
        year: vehicle.year || current.year,
        fuelType: vehicle.fuelType || current.fuelType,
        colour: vehicle.colour || current.colour,
        euroRating: vehicle.euroRating || current.euroRating,
        grossWeight: vehicle.grossWeight || current.grossWeight,
        motExpiry: vehicle.motExpiry || current.motExpiry,
        mot: vehicle.motStatus || current.mot,
        serviceHistory: vehicle.motHistory?.length
          ? vehicle.motHistory.slice(0, 12).map((item) => `${item.date || 'MOT'} · ${item.result || 'Result'}${item.expiryDate ? ` · expiry ${item.expiryDate}` : ''}${item.mileage ? ` · ${toMilesLabel(item.mileage, item.mileageUnit)}` : ''}`).join('\n')
          : current.serviceHistory
      }));
      setMessage({
        type: vehicle.lookupWarnings?.length ? 'error' : 'success',
        text: vehicle.lookupWarnings?.length
          ? `Details filled from the responding source. ${vehicle.lookupWarnings.join(' ')} Review fields manually before publishing.`
          : 'Vehicle details filled where official records were available. Check them before publishing.'
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally { setLookupLoading(false); }
  }

  async function duplicateTruck(truck) {
    try {
      const result = await api.duplicateTruck(truck.id);
      setMessage({ type: 'success', text: 'Draft copy created. Update its details and publish when ready.' });
      editTruck(result.data);
      await loadAdminData();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  async function exportTrucksCsv() {
    try {
      const blob = await api.exportTrucksCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'midland-trucks.csv';
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Truck CSV exported.' });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  }

  async function importTrucksCsv(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const result = await api.importTrucksCsv(await file.text());
      await loadAdminData();
      const rowErrors = result.failures?.slice(0, 5).map((failure) => `Row ${failure.row}: ${failure.message}`).join(' ');
      setMessage({ type: result.failed ? 'error' : 'success', text: `Imported ${result.imported}; ${result.failed} failed.${rowErrors ? ` ${rowErrors}` : ''}` });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
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
  const truckImages = uniqueTruckImages([form.image, ...form.images]);

  return (
    <div className={styles.adminApp}>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true"><BrandMark /></span>
          <span className={styles.brandText}><strong>Midland</strong><small>Commercials · Admin</small></span>
        </div>
        <ul className={styles.navList}>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.navButton} ${activeTab === item.id ? styles.navActive : ''}`}
                aria-current={activeTab === item.id ? 'page' : undefined}
                onClick={() => goToTab(item.id)}
              >
                <AdminNavGlyph name={item.id} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.sidebarFooter}>
          <span className={styles.userAvatar}>{initialsOf(user.name)}</span>
          <span className={styles.sidebarUser}><strong>{user.name}</strong><small>{user.role}</small></span>
        </div>
      </nav>

      <div className={styles.adminMain}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarEyebrow}>Midland Commercials <span>/</span> Workspace</p>
            <h1>{activeTab === 'inventory' && inventoryView === 'form' ? (editingId ? 'Edit truck' : 'Add truck') : activeNavLabel}</h1>
          </div>
          <div className={styles.topbarActions}>
            <NotificationBell
              notifications={notifications}
              unread={unreadCount}
              open={notifOpen}
              onToggle={() => setNotifOpen((v) => !v)}
              onClose={() => setNotifOpen(false)}
              onMarkRead={markNotificationRead}
            />
            <div className={styles.adminIdentity}>
              <button type="button" className={styles.toolbarButton} onClick={refreshAll} disabled={loading}><AdminIcon name="refresh" /> {loading ? 'Refreshing…' : 'Refresh'}</button>
              <button type="button" className={`${styles.toolbarButton} ${styles.signOutButton}`} onClick={logout}>Sign out</button>
            </div>
          </div>
        </header>

        <section className={styles.adminContent}>
          {loading && <div className={styles.loadingBar} role="progressbar" aria-label="Loading admin data" />}

          {activeTab === 'overview' && (
            <OverviewPanel
              trucks={trucks}
              enquiries={enquiries}
              partExchange={partExchange}
              chatLeads={chatLeads}
              dashboard={dashboard}
              totalLeads={dashboardStats[3][1]}
              canEditInventory={canEditInventory}
              onNavigate={goToTab}
              onAddTruck={startNewTruck}
              onOpenLead={openLead}
            />
          )}

          {activeTab === 'inventory' && (
            <section className={styles.inventorySection}>
              <div className={styles.subTabs}>
                <button type="button" className={`${styles.subTabButton} ${inventoryView === 'stock' ? styles.subTabActive : ''}`} onClick={() => setInventoryView('stock')}>Truck stock <span className={styles.tabCount}>{trucks.length}</span></button>
                {canEditInventory && (
                  <button
                    type="button"
                    className={`${styles.subTabButton} ${inventoryView === 'form' ? styles.subTabActive : ''}`}
                    onClick={() => { if (inventoryView !== 'form') startNewTruck(); }}
                  >
                    {editingId ? 'Edit truck' : 'Add truck'}
                  </button>
                )}
              </div>

              {inventoryView === 'form' && canEditInventory && (
              <div className={styles.truckEditor}>
              <form className={`${styles.contactForm} ${styles.adminForm}`} onSubmit={saveTruck}>
                <div className={styles.editorHead}>
                  <div>
                    <h2>{editingId ? `Edit: ${truckDisplayTitle(form)}` : 'Add a truck'}</h2>
                    <p className={styles.panelSub}>Every field is optional — save now and add the rest later. The preview updates as you type.</p>
                  </div>
                  {editingId && form.status !== 'draft' && form.status !== 'archived' && <a className={styles.ghostButton} href={`/truck/${editingId}${form.slug ? `-${form.slug}` : ''}`} target="_blank" rel="noreferrer"><AdminIcon name="external" />View live</a>}
                </div>
                <div className={styles.formSteps} role="group" aria-label="Truck form sections">
                  {TRUCK_FORM_STEPS.map((step, index) => (
                    <button key={step.id} type="button" className={`${styles.formStepButton} ${truckFormStep === step.id ? styles.formStepActive : ''}`} aria-pressed={truckFormStep === step.id} onClick={() => setTruckFormStep(step.id)}>
                      <span className={styles.formStepNumber}>{index + 1}</span>
                      <span className={styles.formStepCopy}><strong>{step.label}</strong><small>{step.hint}</small></span>
                    </button>
                  ))}
                </div>

                <div className={styles.formStepPanel}>
                  {truckFormStep === 'basics' && <>
                    <div className={styles.formWide}><AdminInput label="Title" value={form.title} onChange={(value) => updateForm('title', value)} maxLength={255} placeholder={[form.year, form.make, form.type].filter(Boolean).join(' ') || 'e.g. 2021 Scania R450 6x2 Tractor Unit'} /></div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Make" value={form.make} onChange={(value) => updateForm('make', value)} maxLength={100} />
                      <AdminInput label="Body type" value={form.type} onChange={(value) => updateForm('type', value)} maxLength={100} />
                    </div>
                    <div className={styles.formWide}><AdminInput label="Location" value={form.location} onChange={(value) => updateForm('location', value)} maxLength={180} /></div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Price (£, used for sorting & filters)" type="number" min={0} max={2000000000} step={1} value={form.priceValue} onChange={(value) => updateForm('priceValue', value)} placeholder="54950" />
                      <AdminInput label="Price shown on the advert" value={form.price} onChange={(value) => updateForm('price', value)} maxLength={50} placeholder="Fills in automatically, e.g. £54,950" />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Mileage in miles (number)" type="number" min={0} max={2000000000} step={1} value={form.mileageValue} onChange={(value) => updateForm('mileageValue', value)} placeholder="362000" />
                      <AdminInput label="Mileage shown on the advert" value={form.mileage} onChange={(value) => updateForm('mileage', value)} maxLength={50} placeholder="Fills in automatically, e.g. 362,000 miles" />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Year" value={form.year} onChange={(value) => updateForm('year', value)} maxLength={10} />
                      <AdminInput label="Gearbox" value={form.gearbox} onChange={(value) => updateForm('gearbox', value)} maxLength={80} />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Registration / plate" value={form.registration} onChange={(value) => updateForm('registration', value)} maxLength={40} />
                      <button className={styles.adminSecondary} type="button" onClick={lookupRegistration} disabled={lookupLoading || (!lookupStatus?.dvla && !lookupStatus?.dvsaMot)}>
                        {lookupLoading ? 'Checking registration…' : 'Auto-fill UK vehicle details'}
                      </button>
                    </div>
                    {lookupStatus && !lookupStatus.dvla && !lookupStatus.dvsaMot && <p className={`${styles.adminNote} ${styles.formWide}`}>DVLA/DVSA lookup is not configured on the server yet. Manual entry still works.</p>}
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <label>
                        Status
                        <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                          <option value="draft">Draft (hidden)</option>
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                          <option value="coming-soon">Coming Soon</option>
                          <option value="archived" disabled={user.role !== 'admin'}>Archived</option>
                        </select>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={form.featured} onChange={(event) => updateForm('featured', event.target.checked)} />
                        Featured / hot deal
                      </label>
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Homepage order (lower is first)" type="number" min={0} max={100000} step={1} value={form.sortOrder} onChange={(value) => updateForm('sortOrder', value)} />
                      {form.status === 'sold' && <AdminInput label="Sold price (£)" type="number" min={0} max={2000000000} step={1} value={form.soldPrice} onChange={(value) => updateForm('soldPrice', value)} />}
                    </div>
                    {form.status === 'sold' && <div className={styles.formWide}><AdminInput label="Sold date" type="date" value={form.soldAt} onChange={(value) => updateForm('soldAt', value)} /></div>}
                  </>}

                  {truckFormStep === 'specs' && <>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="VIN" value={form.vin} onChange={(value) => updateForm('vin', value)} maxLength={80} />
                      <AdminInput label="VAT status" value={form.vatStatus} onChange={(value) => updateForm('vatStatus', value)} maxLength={40} placeholder="For example: + VAT" />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Axle configuration" value={form.axle} onChange={(value) => updateForm('axle', value)} maxLength={100} />
                      <AdminInput label="Gross weight" value={form.grossWeight} onChange={(value) => updateForm('grossWeight', value)} maxLength={100} />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Payload" value={form.payload} onChange={(value) => updateForm('payload', value)} maxLength={100} />
                      <AdminInput label="Euro rating" value={form.euroRating} onChange={(value) => updateForm('euroRating', value)} maxLength={50} />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Fuel" value={form.fuelType} onChange={(value) => updateForm('fuelType', value)} maxLength={80} />
                      <AdminInput label="Colour" value={form.colour} onChange={(value) => updateForm('colour', value)} maxLength={80} />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Clean air / CAZ" value={form.cleanAir} onChange={(value) => updateForm('cleanAir', value)} maxLength={120} />
                      <AdminInput label="MOT expiry" value={form.motExpiry} onChange={(value) => updateForm('motExpiry', value)} maxLength={160} />
                    </div>
                    <label className={styles.formWide}>
                      Service history
                      <textarea maxLength={5000} value={form.serviceHistory} onChange={(event) => updateForm('serviceHistory', event.target.value)} />
                    </label>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Previous owners" value={form.owners} onChange={(value) => updateForm('owners', value)} maxLength={100} />
                      <AdminInput label="Tacho" value={form.tacho} onChange={(value) => updateForm('tacho', value)} maxLength={160} placeholder="For example: digital tachograph" />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Warranty" value={form.warranty} onChange={(value) => updateForm('warranty', value)} maxLength={160} />
                      <AdminInput label="Badge" value={form.badge} onChange={(value) => updateForm('badge', value)} maxLength={80} />
                    </div>
                    <div className={`${styles.formRow} ${styles.formWide}`}>
                      <AdminInput label="Cab" value={form.cab} onChange={(value) => updateForm('cab', value)} maxLength={120} />
                      <AdminInput label="Power" value={form.power} onChange={(value) => updateForm('power', value)} maxLength={80} />
                    </div>
                    <div className={styles.formWide}><AdminInput label="MOT" value={form.mot} onChange={(value) => updateForm('mot', value)} maxLength={160} /></div>
                  </>}

                  {truckFormStep === 'photos' && <>
                    <div className={styles.formWide}><AdminInput label="Walkaround video / YouTube URL" value={form.videoUrl} onChange={(value) => updateForm('videoUrl', value)} maxLength={500} placeholder="https://youtu.be/..." /></div>
                    <section className={`${styles.truckImageManager} ${styles.formWide}`} aria-label="Truck photos" onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }} onDrop={uploadImages}>
                  <div className={styles.truckImageHeader}>
                    <div>
                      <h3>Truck photos ({truckImages.length}/{MAX_TRUCK_IMAGES})</h3>
                      <p>Drop photos here or choose files. Up to 9 photos, auto-resized and converted to WebP. Drag cards to reorder; set any photo as cover.</p>
                    </div>
                    <label className={`${styles.truckImagePicker} ${uploadingImages || truckImages.length >= MAX_TRUCK_IMAGES ? styles.truckImagePickerDisabled : ''}`}>
                      {uploadingImages ? 'Uploading…' : 'Choose photos'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={uploadingImages || truckImages.length >= MAX_TRUCK_IMAGES}
                        onChange={uploadImages}
                      />
                    </label>
                  </div>
                  <AdminInput label="Optional cover image URL" value={form.image} onChange={(value) => updateForm('image', value)} maxLength={2000} />
                  {uploadingImages && <p className={styles.adminNote}>Keep this form open until all selected photos finish uploading.</p>}
                  {truckImages.length > 0 ? (
                    <div className={styles.truckImageGrid}>
                      {truckImages.map((image, index) => (
                        <article className={styles.truckImageItem} key={`${image}-${index}`} draggable onDragStart={(event) => { draggedTruckImageRef.current = image; event.dataTransfer.effectAllowed = 'move'; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.files.length) return; event.stopPropagation(); reorderTruckImage(draggedTruckImageRef.current, image); draggedTruckImageRef.current = null; }}>
                          <img src={image} alt={`Truck photo ${index + 1}`} loading="lazy" />
                          <strong>{image === form.image ? 'Cover photo' : `Photo ${index + 1}`}</strong>
                          <div>
                            <button type="button" disabled={index === 0} onClick={() => reorderTruckImage(image, truckImages[index - 1])} aria-label={`Move photo ${index + 1} earlier`}>↑</button>
                            <button type="button" disabled={index === truckImages.length - 1} onClick={() => reorderTruckImage(image, truckImages[index + 1])} aria-label={`Move photo ${index + 1} later`}>↓</button>
                            {image !== form.image && <button type="button" onClick={() => setPrimaryTruckImage(image)}>Set as cover</button>}
                            <button type="button" className={styles.removeTruckImage} onClick={() => removeTruckImage(image)} aria-label={`Remove photo ${index + 1}`}>Remove</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.adminNote}>No photos added yet. Add a cover photo for the stock listing.</p>
                  )}
                    </section>
                  </>}

                  {truckFormStep === 'description' && <>
                    <label className={styles.formWide}>
                      Description
                      <textarea maxLength={20000} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
                    </label>
                    <h3 className={styles.formWide}>Search engine details</h3>
                    <AdminInput label="URL slug" value={form.slug} onChange={(value) => updateForm('slug', value)} maxLength={220} placeholder="Auto-created from the truck title" />
                    <AdminInput label="Meta title" value={form.metaTitle} onChange={(value) => updateForm('metaTitle', value)} maxLength={70} />
                    <label className={styles.formWide}>
                      Meta description
                      <textarea maxLength={160} value={form.metaDescription} onChange={(event) => updateForm('metaDescription', event.target.value)} />
                    </label>
                  </>}
                </div>

                <div className={styles.formActions}>
                  <span>Section {TRUCK_FORM_STEPS.findIndex((step) => step.id === truckFormStep) + 1} of {TRUCK_FORM_STEPS.length}</span>
                  <div>
                    <button className={styles.adminSecondary} type="button" disabled={truckFormStep === TRUCK_FORM_STEPS[0].id} onClick={() => { const index = TRUCK_FORM_STEPS.findIndex((step) => step.id === truckFormStep); setTruckFormStep(TRUCK_FORM_STEPS[Math.max(0, index - 1)].id); }}>Back</button>
                    <button className={styles.adminSecondary} type="button" disabled={truckFormStep === TRUCK_FORM_STEPS[TRUCK_FORM_STEPS.length - 1].id} onClick={() => { const index = TRUCK_FORM_STEPS.findIndex((step) => step.id === truckFormStep); setTruckFormStep(TRUCK_FORM_STEPS[Math.min(TRUCK_FORM_STEPS.length - 1, index + 1)].id); }}>Next</button>
                    <button className={styles.adminSecondary} type="button" onClick={cancelTruckForm}>Cancel</button>
                    <button type="submit" disabled={uploadingImages}>{uploadingImages ? 'Uploading photos…' : editingId ? 'Save changes' : 'Add truck'}</button>
                  </div>
                </div>
              </form>
              <TruckPreview form={form} images={truckImages} />
              </div>
              )}

              {inventoryView === 'stock' && (
              <div className={styles.adminTablePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Truck stock</h2>
                    <p className={styles.panelSub}>{visibleTrucks.length} of {trucks.length} vehicles shown</p>
                  </div>
                  <div className={styles.stockHeaderActions}>
                    <label className={styles.searchField}>
                      <AdminIcon name="search" />
                      <input
                        className={styles.searchInput}
                        type="search"
                        aria-label="Search stock"
                        placeholder="Search title, make, type, registration…"
                        value={stockSearch}
                        onChange={(event) => setStockSearch(event.target.value)}
                      />
                    </label>
                    <button type="button" className={styles.ghostButton} onClick={exportTrucksCsv}>Export CSV</button>
                    {canEditInventory && <><button type="button" className={styles.ghostButton} onClick={() => csvInputRef.current?.click()}>Import CSV</button><input ref={csvInputRef} type="file" accept=".csv,text/csv" hidden onChange={importTrucksCsv} /></>}
                    {canEditInventory && <button type="button" className={styles.primaryButton} onClick={startNewTruck}><AdminIcon name="plus" />Add truck</button>}
                  </div>
                </div>

                <div className={styles.filterChips} role="group" aria-label="Filter stock by status">
                  {STOCK_FILTERS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.filterChip} ${stockStatus === key ? styles.filterChipActive : ''}`}
                      aria-pressed={stockStatus === key}
                      onClick={() => setStockStatus(key)}
                    >
                      {key === 'all' ? 'All' : truckStatusLabel(key)}
                      <span>{stockCounts[key] || 0}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.adminTableWrap}>
                  <table className={`${styles.adminTable} ${styles.stockTable}`}>
                    <thead>
                      <tr>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('title')}>Truck {stockSort.key === 'title' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('price')}>Price {stockSort.key === 'price' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('year')}>Year · Mileage {stockSort.key === 'year' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        <th><button type="button" className={styles.sortButton} onClick={() => toggleSort('status')}>Status {stockSort.key === 'status' ? (stockSort.dir === 'asc' ? '▲' : '▼') : ''}</button></th>
                        {canEditInventory && <th className={styles.actionsHead}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTrucks.map((truck) => {
                        const title = truckDisplayTitle(truck);
                        const isLive = truck.status !== 'archived' && truck.status !== 'draft';
                        return (
                          <tr key={truck.id}>
                            <td>
                              <div className={styles.truckCell}>
                                {truck.image ? <img className={styles.thumb} src={truck.image} alt="" loading="lazy" /> : <div className={styles.thumbPlaceholder}><AdminIcon name="truck" /></div>}
                                <div>
                                  <strong>{title}{truck.featured && <span className={styles.featuredTag} title="Featured on the homepage">★ Featured</span>}</strong>
                                  <span>{[truck.make, truck.type, truck.registration].filter(Boolean).join(' · ') || 'Details pending'}</span>
                                  <small>{truck.photoCount || 0} photo{truck.photoCount === 1 ? '' : 's'}</small>
                                </div>
                              </div>
                            </td>
                            <td><strong className={styles.priceCell}>{truckDisplayPrice(truck)}</strong></td>
                            <td className={styles.nowrapCell}><span>{[truck.year, truck.mileage].filter(Boolean).join(' · ') || '—'}</span></td>
                            <td><span className={`${styles.badge} ${styles[`status-${truck.status}`] || ''}`}>{truckStatusLabel(truck.status)}</span></td>
                            {canEditInventory && (
                              <td>
                                <div className={styles.rowActions}>
                                  <button type="button" className={styles.rowPrimary} onClick={() => editTruck(truck)}>Edit</button>
                                  <button type="button" className={styles.iconButton} title="Duplicate as a draft" aria-label={`Duplicate ${title}`} onClick={() => duplicateTruck(truck)}><AdminIcon name="copy" /></button>
                                  {isLive && <a className={styles.iconButton} href={`/truck/${truck.id}${truck.slug ? `-${truck.slug}` : ''}`} target="_blank" rel="noreferrer" title="View on the website" aria-label={`View ${title} on the website`}><AdminIcon name="external" /></a>}
                                  {user.role === 'admin' && truck.status !== 'archived' && <button type="button" className={`${styles.iconButton} ${styles.iconDanger}`} title="Archive (hide from the website)" aria-label={`Archive ${title}`} onClick={() => deleteTruck(truck)}><AdminIcon name="archive" /></button>}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {visibleTrucks.length === 0 && (
                        <tr className={styles.emptyRow}>
                          <td colSpan={canEditInventory ? 5 : 4}>
                            <EmptyState
                              icon="truck"
                              title={trucks.length === 0 ? 'No trucks yet' : 'No trucks match'}
                              copy={trucks.length === 0 ? 'Add your first truck and it will appear on the website straight away.' : 'Try a different search or status filter.'}
                              action={trucks.length > 0 && <button type="button" className={styles.ghostButton} onClick={() => { setStockSearch(''); setStockStatus('all'); }}>Clear filters</button>}
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </section>
          )}

          {activeTab === 'pipeline' && (
            <section className={styles.pipelineSection}>
              <div className={styles.pipelineSummary}>
                <div><span>All leads</span><strong>{dashboard?.leads ?? leadPagination?.total ?? chatLeads.length}</strong></div>
                <div className={styles.summaryHot}><span>Hot</span><strong>{dashboard?.hotLeads ?? '—'}</strong></div>
                <div><span>New</span><strong>{dashboard?.newLeads ?? '—'}</strong></div>
                <div className={styles.summaryDue}><span>Follow-ups due</span><strong>{dashboard?.followUps ?? '—'}</strong></div>
              </div>

              <div className={styles.adminTablePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Chat leads</h2>
                    <p className={styles.panelSub}>Newest first. Update the status as each lead moves forward.</p>
                  </div>
                </div>
                <div className={styles.leadFilters}>
                  <label className={styles.searchField}>
                    <AdminIcon name="search" />
                    <input type="search" aria-label="Search leads" placeholder="Search name, phone, email, postcode…" value={leadSearchInput} onChange={(e) => setLeadSearchInput(e.target.value)} />
                  </label>
                  <select aria-label="Filter by status" value={leadFilters.status} onChange={(e) => setLeadFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
                    <option value="">All statuses</option>
                    {LEAD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select aria-label="Filter by priority" value={leadFilters.temperature} onChange={(e) => setLeadFilters((f) => ({ ...f, temperature: e.target.value, page: 1 }))}>
                    <option value="">All priorities</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                  <label className={styles.toggleField}>
                    <input type="checkbox" checked={leadFilters.followUp === 'due'} onChange={(e) => setLeadFilters((f) => ({ ...f, followUp: e.target.checked ? 'due' : '', page: 1 }))} />
                    Follow-ups due
                  </label>
                </div>
              </div>

              <div className={styles.pipeline}>
                {chatLeads.length === 0 && (
                  <div className={styles.adminTablePanel}>
                    {leadSearchInput || leadFilters.status || leadFilters.temperature || leadFilters.followUp ? (
                      <EmptyState
                        icon="search"
                        title="No leads match these filters"
                        action={<button type="button" className={styles.ghostButton} onClick={() => { setLeadSearchInput(''); setLeadFilters((f) => ({ ...f, search: '', status: '', temperature: '', followUp: '', page: 1 })); }}>Clear filters</button>}
                      />
                    ) : (
                      <EmptyState icon="leads" title="No chat leads yet" copy="When a visitor asks the website assistant for a callback, the lead appears here." />
                    )}
                  </div>
                )}
                {chatLeads.map((lead) => (
                  <ChatLeadCard key={lead.id} lead={lead} onUpdated={() => Promise.all([loadChatLeads(), loadAdminData()])} onOpen={() => openLead(lead)} />
                ))}
              </div>

              {leadPagination && leadPagination.pages > 1 && (
                <div className={styles.pagination}>
                  <button type="button" disabled={leadPagination.page <= 1} onClick={() => setLeadFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
                  <span>Page {leadPagination.page} of {leadPagination.pages} · {leadPagination.total} leads</span>
                  <button type="button" disabled={leadPagination.page >= leadPagination.pages} onClick={() => setLeadFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'enquiries' && (
            <section className={styles.adminLeads}>
              <EnquiryList title="Website enquiries" subtitle="Contact form and stock alert sign-ups" items={enquiries} kind="enquiry" />
              <EnquiryList title="Part exchange requests" subtitle="Vehicles customers want to trade in" items={partExchange} kind="partExchange" />
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

          {activeTab === 'account' && <AccountSettingsPanel user={user} onUserUpdated={setUser} />}

          {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />}

          {message && (
            <div className={`${styles.toast} ${message.type === 'error' ? styles.toastError : styles.toastSuccess}`} role={message.type === 'error' ? 'alert' : 'status'}>
              <AdminIcon name={message.type === 'error' ? 'alert' : 'check'} />
              <span>{message.text}</span>
              <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message"><AdminIcon name="close" /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, type = 'text', required = false, revealable = false, placeholder = '', maxLength, minLength, min, max, step, autoComplete }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputType = revealable && type === 'password' && passwordVisible ? 'text' : type;
  return (
    <label>
      {label}
      {revealable && type === 'password' ? (
        <span className={styles.revealInput}>
          <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} maxLength={maxLength} minLength={minLength} min={min} max={max} step={step} autoComplete={autoComplete} />
          <button className={styles.passwordToggle} type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onMouseDown={(event) => event.preventDefault()} onClick={() => setPasswordVisible((visible) => !visible)}>
            {passwordVisible ? 'Hide' : 'Show'}
          </button>
        </span>
      ) : (
        <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} maxLength={maxLength} minLength={minLength} min={min} max={max} step={step} autoComplete={autoComplete} />
      )}
    </label>
  );
}

function AdminNavGlyph({ name }) {
  const glyphs = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    inventory: <><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" /><path d="M3 12.5 12 17l9-4.5M3 17.5 12 22l9-4.5" /></>,
    pipeline: <><path d="M3 18h4l3-7 4 4 3-8h4" /><path d="M17 7h4v4" /></>,
    enquiries: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    blog: <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h8" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1Z" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 15a4.5 4.5 0 0 1 3.5 4.4V20" /></>,
    audit: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r=".7" /><circle cx="4" cy="12" r=".7" /><circle cx="4" cy="18" r=".7" /></>,
    account: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>
  };
  return <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{glyphs[name] || glyphs.overview}</svg>;
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
            <small>Leave a blank line between paragraphs. Start a line with ## for a heading, ### for a sub-heading, - for a bullet point. Add a link like [used trucks](/trucks).</small>
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
                      {post.status === 'published' && <a className={styles.truckViewLink} href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">View</a>}
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

function AccountSettingsPanel({ user, onUserUpdated }) {
  const [form, setForm] = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const result = await api.updateMyCredentials(form);
      onUserUpdated(result.user);
      setForm({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', text: 'Login details updated. Your other signed-in devices will need to log in again.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.accountSettings}>
      <form className={`${styles.contactForm} ${styles.adminForm} ${styles.accountForm}`} onSubmit={submit}>
        <p className="eyebrow">Your account</p>
        <h2>Change login details</h2>
        <p className={styles.adminNote}>Update the email you use as your login ID, your password, or both. No email link is needed.</p>
        <div className={styles.accountCurrent}>
          <span>Current login ID</span>
          <strong>{user.email}</strong>
        </div>
        <div className={styles.accountFields}>
          <AdminInput label="New login ID (email)" type="email" value={form.newEmail} onChange={(value) => setForm((current) => ({ ...current, newEmail: value }))} placeholder="Leave blank to keep the current email" autoComplete="email" />
          <AdminInput label="Current password (required to save)" type="password" revealable value={form.currentPassword} onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))} required autoComplete="current-password" />
          <AdminInput label="New password" type="password" revealable value={form.newPassword} onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))} minLength={10} maxLength={72} placeholder="Leave blank to keep the current password" autoComplete="new-password" />
          <AdminInput label="Confirm new password" type="password" revealable value={form.confirmPassword} onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))} required={Boolean(form.newPassword)} minLength={10} maxLength={72} autoComplete="new-password" />
        </div>
        {feedback && <p className={`${styles.formStatus} ${feedback.type === 'error' ? styles.formError : ''}`} role="status">{feedback.text}</p>}
        <div className={styles.accountActions}>
          <span>For security, enter your current password before saving.</span>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save login details'}</button>
        </div>
      </form>

      <aside className={styles.adminTablePanel}>
        <h2>Account security</h2>
        <p className={styles.adminNote}>Your login changes are saved directly to this account. Other active sessions are signed out after a successful change; this session stays open.</p>
        <div className={styles.accountSecurityItem}>
          <span>Signed in as</span>
          <strong>{user.name}</strong>
          <small>{user.role}</small>
        </div>
      </aside>
    </section>
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

const TRUCK_STATUS_LABELS = { draft: 'Draft', available: 'Available', reserved: 'Reserved', sold: 'Sold', 'coming-soon': 'Coming soon', archived: 'Archived' };
const STOCK_FILTERS = ['all', 'available', 'reserved', 'coming-soon', 'sold', 'draft', 'archived'];
const LEAD_STATUSES = [['new', 'New'], ['contacted', 'Contacted'], ['qualified', 'Qualified'], ['viewing-booked', 'Viewing booked'], ['won', 'Won'], ['lost', 'Lost']];
const LEAD_STATUS_LABELS = Object.fromEntries(LEAD_STATUSES);
const COMPLETENESS_FIELDS = [
  ['title', 'Title'], ['make', 'Make'], ['type', 'Body type'], ['priceValue', 'Price'], ['year', 'Year'],
  ['mileageValue', 'Mileage'], ['gearbox', 'Gearbox'], ['registration', 'Registration'], ['euroRating', 'Euro rating'],
  ['motExpiry', 'MOT expiry'], ['image', 'Cover photo'], ['description', 'Description']
];

const truckStatusLabel = (status) => TRUCK_STATUS_LABELS[status] || status || 'Unknown';
const autoPriceLabel = (value) => (Number(value) > 0 ? `£${Number(value).toLocaleString('en-GB')}` : '');
const autoMileageLabel = (value) => (Number(value) > 0 ? `${Number(value).toLocaleString('en-GB')} miles` : '');
const phoneHref = (phone) => String(phone || '').replace(/[^\d+]/g, '');
const whatsappNumber = (phone) => String(phone || '').replace(/\D/g, '').replace(/^0/, '44');

function initialsOf(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AdminIcon({ name }) {
  const paths = {
    truck: <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
    leads: <><path d="M4 5h16v11H8l-4 4Z" /><path d="M8 9h8M8 12h5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    exchange: <><path d="M4 8h13l-3-3M20 16H7l3 3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
    chat: <><path d="M4 20l1.4-4A8 8 0 1 1 8 18.6Z" /><path d="M9 10h.01M12 10h.01M15 10h.01" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
    archive: <><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    alert: <><path d="M12 3 2 20h20Z" /><path d="M12 10v4M12 17h.01" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5M20 20v-4h-4" /></>
  };
  return <svg className={styles.adminIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.check}</svg>;
}

function EmptyState({ icon = 'check', title, copy, action }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}><AdminIcon name={icon} /></span>
      <strong>{title}</strong>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}

function OverviewPanel({ trucks, enquiries, partExchange, chatLeads, dashboard, totalLeads, canEditInventory, onNavigate, onAddTruck, onOpenLead }) {
  const count = (status) => trucks.filter((truck) => truck.status === status).length;
  const listed = trucks.filter((truck) => !['draft', 'archived'].includes(truck.status)).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastWeek = (items) => items.filter((item) => new Date(item.createdAt).getTime() >= weekAgo).length;
  const stockMix = ['available', 'reserved', 'coming-soon', 'sold', 'draft'].map((status) => [status, count(status)]).filter(([, total]) => total > 0);
  const stockTotal = stockMix.reduce((sum, [, total]) => sum + total, 0);
  const latestEnquiries = [...enquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const kpis = [
    { icon: 'truck', label: 'Live stock', value: count('available'), sub: `${count('reserved')} reserved · ${listed} listed`, tab: 'inventory' },
    { icon: 'leads', label: 'Chat leads', value: totalLeads, sub: dashboard ? `${dashboard.hotLeads} hot · ${dashboard.newLeads} new` : 'Loading…', tab: 'pipeline' },
    { icon: 'mail', label: 'Enquiries', value: enquiries.length, sub: `${lastWeek(enquiries)} in the last 7 days`, tab: 'enquiries' },
    { icon: 'exchange', label: 'Part exchange', value: partExchange.length, sub: `${lastWeek(partExchange)} in the last 7 days`, tab: 'enquiries' }
  ];
  const plural = (total, word) => `${total} ${word}${total === 1 ? '' : 's'}`;

  return (
    <>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <button type="button" key={kpi.label} className={styles.kpiCard} onClick={() => onNavigate(kpi.tab)}>
            <span className={styles.kpiIcon}><AdminIcon name={kpi.icon} /></span>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.sub}</small>
          </button>
        ))}
      </div>

      {dashboard && (dashboard.followUps > 0 || dashboard.unread > 0) && (
        <div className={styles.attentionStrip}>
          <AdminIcon name="alert" />
          <span><strong>Needs attention:</strong> {plural(dashboard.followUps, 'follow-up')} due · {plural(dashboard.unread, 'unread alert')}</span>
          <button type="button" onClick={() => onNavigate('pipeline')}>Open pipeline</button>
        </div>
      )}

      <div className={styles.overviewGrid}>
        <section className={styles.adminTablePanel}>
          <div className={styles.panelHeader}>
            <div><h2>Recent chat leads</h2><p className={styles.panelSub}>Newest leads from the website assistant</p></div>
            <button type="button" className={styles.ghostButton} onClick={() => onNavigate('pipeline')}>View all</button>
          </div>
          <div className={styles.recentList}>
            {chatLeads.length === 0 && <EmptyState icon="leads" title="No chat leads yet" copy="Leads from the website chat assistant will appear here." />}
            {chatLeads.slice(0, 6).map((lead) => (
              <button type="button" key={lead.id} className={styles.recentItem} onClick={() => onOpenLead(lead)}>
                <span className={styles.leadAvatar}>{initialsOf(lead.name)}</span>
                <span className={styles.recentText}>
                  <strong>{lead.name || 'Unnamed lead'}</strong>
                  <small>{lead.requirement || lead.vehicleType || 'No requirement given'}</small>
                </span>
                <span className={styles.recentMeta}>
                  <span className={`${styles.temperature} ${styles[lead.temperature] || ''}`}>{lead.temperature || 'lead'}</span>
                  <time dateTime={lead.createdAt} title={formatDateTime(lead.createdAt)}>{timeAgo(lead.createdAt)}</time>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.overviewSide}>
          <section className={styles.adminTablePanel}>
            <div className={styles.panelHeader}>
              <div><h2>Stock mix</h2><p className={styles.panelSub}>{plural(stockTotal, 'vehicle')} in the system</p></div>
            </div>
            {stockTotal === 0 ? (
              <EmptyState icon="truck" title="No stock yet" copy="Add your first truck to start selling." />
            ) : (
              <>
                <div className={styles.stockBar}>
                  {stockMix.map(([status, total]) => <span key={status} className={styles[`bar-${status}`]} style={{ flexGrow: total }} title={`${truckStatusLabel(status)}: ${total}`} />)}
                </div>
                <ul className={styles.stockLegend}>
                  {stockMix.map(([status, total]) => <li key={status}><i className={styles[`bar-${status}`]} />{truckStatusLabel(status)}<strong>{total}</strong></li>)}
                </ul>
              </>
            )}
          </section>
          <section className={styles.adminTablePanel}>
            <div className={styles.panelHeader}><div><h2>Quick actions</h2></div></div>
            <div className={styles.quickActions}>
              {canEditInventory && <button type="button" onClick={onAddTruck}><AdminIcon name="plus" />Add a truck</button>}
              <button type="button" onClick={() => onNavigate('pipeline')}><AdminIcon name="leads" />Work the pipeline</button>
              <button type="button" onClick={() => onNavigate('enquiries')}><AdminIcon name="mail" />Read enquiries</button>
              <a href="/" target="_blank" rel="noreferrer"><AdminIcon name="external" />Open the website</a>
            </div>
          </section>
        </div>
      </div>

      <section className={styles.adminTablePanel}>
        <div className={styles.panelHeader}>
          <div><h2>Latest website enquiries</h2><p className={styles.panelSub}>From the contact and stock alert forms</p></div>
          <button type="button" className={styles.ghostButton} onClick={() => onNavigate('enquiries')}>View all</button>
        </div>
        <div className={styles.recentList}>
          {latestEnquiries.length === 0 && <EmptyState icon="mail" title="No enquiries yet" copy="Messages sent through the website forms will appear here." />}
          {latestEnquiries.map((item) => (
            <div key={item.id} className={styles.recentItem}>
              <span className={styles.leadAvatar}>{initialsOf(item.name)}</span>
              <span className={styles.recentText}><strong>{item.name || 'No name'}</strong><small>{item.requirement}</small></span>
              <span className={styles.recentMeta}>
                {item.phone && <a href={`tel:${phoneHref(item.phone)}`}>{item.phone}</a>}
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</time>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function EnquiryList({ title, subtitle, items, kind }) {
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <section className={styles.adminTablePanel}>
      <div className={styles.panelHeader}>
        <div><h2>{title}</h2><p className={styles.panelSub}>{subtitle}</p></div>
        <span className={styles.countPill}>{items.length}</span>
      </div>
      <div className={styles.enquiryList}>
        {sorted.length === 0 && <EmptyState icon={kind === 'enquiry' ? 'mail' : 'exchange'} title="Nothing here yet" copy="New submissions from the website will appear here." />}
        {sorted.map((item) => (
          <article key={item.id} className={styles.enquiryCard}>
            <header>
              <span className={styles.leadAvatar}>{initialsOf(item.name)}</span>
              <div><strong>{item.name || 'No name'}</strong><time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</time></div>
            </header>
            <div className={styles.contactActions}>
              {item.phone && <a className={styles.contactButton} href={`tel:${phoneHref(item.phone)}`}><AdminIcon name="phone" />{item.phone}</a>}
              {item.email && <a className={styles.contactButton} href={`mailto:${item.email}`}><AdminIcon name="mail" />{item.email}</a>}
            </div>
            {kind === 'enquiry' ? (
              <>
                {item.truckId && <a className={styles.truckRef} href={`/truck/${item.truckId}`} target="_blank" rel="noreferrer">About truck #{item.truckId} <AdminIcon name="external" /></a>}
                {item.requirement && <p className={styles.enquiryText}>{item.requirement}</p>}
              </>
            ) : (
              <>
                <dl className={styles.factGrid}>
                  <div><dt>Registration</dt><dd>{item.registration || '—'}</dd></div>
                  <div><dt>Mileage</dt><dd>{item.mileage || '—'}</dd></div>
                </dl>
                {item.notes && <p className={styles.enquiryText}>{item.notes}</p>}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function TruckPreview({ form, images }) {
  const isFilled = ([key]) => {
    if (key === 'image') return images.length > 0;
    const value = form[key];
    if (key.endsWith('Value')) return Number(value) > 0;
    return String(value ?? '').trim() !== '';
  };
  const filled = COMPLETENESS_FIELDS.filter(isFilled);
  const missing = COMPLETENESS_FIELDS.filter((field) => !isFilled(field));
  const percent = Math.round((filled.length / COMPLETENESS_FIELDS.length) * 100);
  const cover = form.image || images[0];
  const chips = [form.year, form.mileage, form.gearbox, form.euroRating].filter((value) => String(value || '').trim());

  return (
    <aside className={styles.truckPreview} aria-label="Listing preview">
      <p className={styles.previewEyebrow}>Live preview</p>
      <div className={styles.previewCard}>
        <div className={styles.previewImage}>
          {cover ? <img src={cover} alt="" /> : <span>No cover photo yet</span>}
          {form.badge && <em>{form.badge}</em>}
        </div>
        <div className={styles.previewBody}>
          <small>{form.location || 'Location not set'}</small>
          <strong>{truckDisplayTitle(form)}</strong>
          {chips.length > 0 && <div className={styles.previewChips}>{chips.map((chip) => <span key={chip}>{chip}</span>)}</div>}
          <div className={styles.previewFooter}>
            <b>{truckDisplayPrice(form)}</b>
            <span className={`${styles.badge} ${styles[`status-${form.status}`] || ''}`}>{truckStatusLabel(form.status)}</span>
          </div>
        </div>
      </div>
      <div className={styles.completeness}>
        <div className={styles.completenessHead}><span>Listing completeness</span><strong>{percent}%</strong></div>
        <div className={styles.meter}><span style={{ width: `${percent}%` }} /></div>
        <p>{missing.length ? `Still to add: ${missing.map(([, label]) => label).join(', ')}.` : 'Everything buyers look for is filled in.'}</p>
      </div>
    </aside>
  );
}

function ChatLeadCard({ lead, onUpdated, onOpen }) {
  const serverDraft = {
    status: lead.status || 'new',
    assignedTo: lead.assignedTo || '',
    salesNotes: lead.salesNotes || '',
    followUpAt: toDateTimeLocal(lead.followUpAt)
  };
  const serverKey = JSON.stringify(serverDraft);
  const [draft, setDraft] = useState(serverDraft);
  const [saveState, setSaveState] = useState({ status: 'idle', text: '' });

  // Pick up fresh server values (e.g. after a save) without wiping edits on other cards.
  useEffect(() => { setDraft(JSON.parse(serverKey)); }, [serverKey]);
  useEffect(() => {
    if (saveState.status !== 'saved') return undefined;
    const timer = setTimeout(() => setSaveState({ status: 'idle', text: '' }), 2500);
    return () => clearTimeout(timer);
  }, [saveState.status]);

  const dirty = JSON.stringify(draft) !== serverKey;
  const score = Math.max(0, Math.min(100, Number(lead.leadScore) || 0));
  const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  async function save() {
    setSaveState({ status: 'saving', text: 'Saving…' });
    try {
      await api.updateChatLead(lead.id, {
        status: draft.status,
        assignedTo: draft.assignedTo,
        salesNotes: draft.salesNotes,
        followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null
      });
      setSaveState({ status: 'saved', text: 'Saved' });
      onUpdated();
    } catch (error) {
      setSaveState({ status: 'error', text: error.message });
    }
  }

  return (
    <article className={`${styles.pipelineCard} ${styles[`lead-${lead.temperature}`] || ''}`}>
      <header className={styles.leadHead}>
        <span className={styles.leadAvatar}>{initialsOf(lead.name)}</span>
        <div className={styles.leadIdentity}>
          <h3>{lead.name || 'Unnamed lead'}</h3>
          <p>{lead.company || 'Private buyer'}{lead.postcode ? ` · ${lead.postcode}` : ''}</p>
        </div>
        <div className={styles.leadMeta}>
          <span className={`${styles.temperature} ${styles[lead.temperature] || ''}`}>{lead.temperature || 'lead'}</span>
          <span className={styles.leadStatusPill}>{LEAD_STATUS_LABELS[lead.status] || lead.status}</span>
          <time dateTime={lead.createdAt} title={formatDateTime(lead.createdAt)}>{timeAgo(lead.createdAt)}</time>
        </div>
      </header>

      <div className={styles.scoreRow}>
        <span>Lead score</span>
        <div className={styles.meter}><span style={{ width: `${score}%` }} /></div>
        <strong>{score}/100</strong>
      </div>

      <div className={styles.contactActions}>
        {lead.phone && <a className={styles.contactButton} href={`tel:${phoneHref(lead.phone)}`}><AdminIcon name="phone" />{lead.phone}</a>}
        {lead.email && <a className={styles.contactButton} href={`mailto:${lead.email}`}><AdminIcon name="mail" />{lead.email}</a>}
        {lead.phone && (
          <a className={styles.contactButton} target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber(lead.phone)}?text=${encodeURIComponent(`Hello ${lead.name || ''}, this is Midland Commercials regarding your enquiry.`)}`}>
            <AdminIcon name="chat" />WhatsApp
          </a>
        )}
      </div>

      <dl className={styles.factGrid}>
        <div><dt>Budget</dt><dd>{lead.budget ? `£${Number(lead.budget).toLocaleString('en-GB')} ${lead.budgetVat || ''}` : 'Not given'}</dd></div>
        <div><dt>Timeline</dt><dd>{lead.purchaseTimeline || 'Not given'}</dd></div>
        <div><dt>Vehicle</dt><dd>{lead.vehicleType || 'Open requirement'}</dd></div>
        <div><dt>Part exchange</dt><dd>{lead.partExchange ? 'Yes' : 'No'}</dd></div>
        {lead.preferredCallback && <div><dt>Callback</dt><dd>{lead.preferredCallback}</dd></div>}
      </dl>

      {lead.requirement && <blockquote className={styles.requirementQuote}>{lead.requirement}</blockquote>}

      <div className={styles.leadControls}>
        <label>Status
          <select value={draft.status} onChange={update('status')}>
            {LEAD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Assigned to<input value={draft.assignedTo} onChange={update('assignedTo')} placeholder="Salesperson" maxLength={120} /></label>
        <label>Follow-up<input type="datetime-local" value={draft.followUpAt} onChange={update('followUpAt')} /></label>
        <label className={styles.leadNotes}>Sales notes<textarea value={draft.salesNotes} onChange={update('salesNotes')} placeholder="Calls, viewings, offers…" /></label>
      </div>

      <footer className={styles.leadFooter}>
        <span className={`${styles.saveHint} ${saveState.status === 'error' ? styles.saveHintError : ''} ${saveState.status === 'saved' ? styles.saveHintOk : ''}`}>
          {saveState.text || (dirty ? 'Unsaved changes' : '')}
        </span>
        <div>
          <button type="button" className={styles.ghostButton} onClick={onOpen}>Details & transcript</button>
          <button type="button" className={styles.primaryButton} onClick={save} disabled={!dirty || saveState.status === 'saving'}>
            {saveState.status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </footer>
    </article>
  );
}

function LeadDetail({ lead, onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={styles.leadDetail} role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
        <header>
          <div>
            <p className={styles.previewEyebrow}>Lead #{lead.id} · {formatDateTime(lead.createdAt)}</p>
            <h2 id="lead-detail-title">{lead.name || 'Unnamed lead'}</h2>
            <div className={styles.contactActions}>
              {lead.phone && <a className={styles.contactButton} href={`tel:${phoneHref(lead.phone)}`}><AdminIcon name="phone" />{lead.phone}</a>}
              {lead.email && <a className={styles.contactButton} href={`mailto:${lead.email}`}><AdminIcon name="mail" />{lead.email}</a>}
            </div>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close lead details"><AdminIcon name="close" /></button>
        </header>
        <h3>Conversation transcript</h3>
        <div className={styles.transcript}>
          {lead.transcript?.length
            ? lead.transcript.map((message, index) => (
              <p key={index} className={message.sender === 'user' ? styles.fromUser : styles.fromBot}>
                <strong>{message.sender === 'user' ? lead.name || 'Customer' : 'Assistant'}</strong>{message.text}
              </p>
            ))
            : <EmptyState icon="chat" title="No transcript captured" />}
        </div>
        <h3>Status history</h3>
        <div className={styles.history}>
          {lead.history?.length
            ? lead.history.map((entry) => (
              <p key={entry.id}>
                <strong>{LEAD_STATUS_LABELS[entry.from_status] || entry.from_status || 'New'} → {LEAD_STATUS_LABELS[entry.to_status] || entry.to_status}</strong>
                <span>{entry.changed_by_name || 'System'} · {formatDateTime(entry.created_at)}</span>
              </p>
            ))
            : <p className={styles.adminNote}>No status changes yet.</p>}
        </div>
      </section>
    </div>
  );
}

function NotificationBell({ notifications, unread, open, onToggle, onClose, onMarkRead }) {
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (!wrapRef.current?.contains(event.target)) onClose(); };
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={styles.notifWrap} ref={wrapRef}>
      <button type="button" className={styles.notifButton} onClick={onToggle} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className={styles.notifBadge}>{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className={styles.notifDropdown}>
          <h3>Notifications</h3>
          {notifications.length === 0 && <EmptyState icon="check" title="You’re all caught up" />}
          {notifications.map((item) => (
            <article key={item.id} className={`${styles.notifItem} ${item.is_read ? '' : styles.notifUnread}`}>
              <strong>{item.link ? <a href={item.link}>{item.title}</a> : item.title}</strong>
              <p>{item.message}</p>
              <div className={styles.notifMeta}>
                <time dateTime={item.created_at} title={formatDateTime(item.created_at)}>{timeAgo(item.created_at)}</time>
                {!item.is_read && <button type="button" onClick={() => onMarkRead(item.id)}>Mark read</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: 'admin@midlandtrucks.co.uk', password: '' });
  const [feedback, setFeedback] = useState(null);
  const [forgot, setForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      if (forgot) {
        const result = await api.forgotPassword(form.email);
        setFeedback({ type: 'success', text: result.message });
        return;
      }
      const result = await api.login(form);
      onLogin(result.user);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.loginShell}>
      <form onSubmit={submit} className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <span className={styles.loginMark}><BrandMark /></span>
          <span><strong>Midland</strong><small>Commercials · Admin</small></span>
        </div>
        <h1>{forgot ? 'Reset password' : 'Welcome back'}</h1>
        <p className={styles.adminNote}>{forgot ? 'Enter your login email and we will send reset instructions.' : 'Sign in to manage stock, leads and enquiries.'}</p>
        <label>Email<input type="email" required autoComplete="username" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        {!forgot && <label>Password<input type="password" required autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>}
        {feedback && <p className={`${styles.formStatus} ${feedback.type === 'error' ? styles.formError : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Please wait…' : forgot ? 'Send reset instructions' : 'Log in securely'}</button>
        <button className={styles.linkButton} type="button" onClick={() => { setForgot(!forgot); setFeedback(null); }}>{forgot ? 'Back to login' : 'Forgot password?'}</button>
      </form>
    </section>
  );
}
