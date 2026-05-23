// ============================================================
// NexusVault — Student Cloud Workspace
// app.js
// ============================================================

// ============================================================
// STATE MANAGEMENT
// ============================================================
const STATE = {
  currentVault: null,
  currentPage: 'home',
  currentFolder: null,
  isDark: true,
  viewMode: 'grid',
  sortMode: 'name',
  logoTapCount: 0,
  logoTapTimer: null,
  chatHistory: [],
  starred: [],
  announcement: null,
  searchQuery: '',
};

// Global storage key prefix
const VAULT_PREFIX = 'nx_vault_';
const ADMIN_KEY = 'nx_admin';
const ANNOUNCE_KEY = 'nx_announcement';

// File type mappings
const FILE_ICONS = {
  pdf:'📕', doc:'📘', docx:'📘', txt:'📄', md:'📝', rtf:'📄',
  jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🎞️', webp:'🖼️', svg:'🎨', bmp:'🖼️',
  mp4:'🎬', mov:'🎬', avi:'🎬', mkv:'🎬', webm:'🎬',
  mp3:'🎵', wav:'🎵', ogg:'🎵', m4a:'🎵', flac:'🎵', aac:'🎵',
  zip:'📦', rar:'📦', tar:'📦', gz:'📦', '7z':'📦',
  js:'💛', ts:'💙', py:'🐍', html:'🌐', css:'🎨', json:'🔧', xml:'🔧',
  java:'☕', cpp:'⚙️', c:'⚙️', php:'🐘', rb:'💎', go:'🐹', rs:'🦀',
  xls:'📊', xlsx:'📊', csv:'📊', ppt:'📑', pptx:'📑',
  exe:'⚙️', dmg:'💿', iso:'💿', sh:'🔧',
  default:'📄'
};
const FILE_FOLDERS = {
  pdf:'Documents', doc:'Documents', docx:'Documents', txt:'Documents', md:'Documents', rtf:'Documents', xls:'Documents', xlsx:'Documents', csv:'Documents', ppt:'Documents', pptx:'Documents',
  jpg:'Pictures', jpeg:'Pictures', png:'Pictures', gif:'Pictures', webp:'Pictures', svg:'Pictures', bmp:'Pictures', ico:'Pictures',
  mp4:'Videos', mov:'Videos', avi:'Videos', mkv:'Videos', webm:'Videos',
  mp3:'Audio', wav:'Audio', ogg:'Audio', m4a:'Audio', flac:'Audio', aac:'Audio',
  zip:'Downloads', rar:'Downloads', tar:'Downloads', gz:'Downloads', '7z':'Downloads', exe:'Downloads', dmg:'Downloads', iso:'Downloads',
  js:'Projects', ts:'Projects', py:'Projects', html:'Projects', css:'Projects', json:'Projects', xml:'Projects', java:'Projects', cpp:'Projects', c:'Projects', php:'Projects', rb:'Projects', go:'Projects', rs:'Projects',
};
const FOLDER_INFO = [
  {name:'Documents', icon:'📄', desc:'PDFs, Word docs, spreadsheets', color:'#60a5fa', cls:'folder-docs'},
  {name:'Pictures', icon:'🖼️', desc:'Images, photos, graphics', color:'#f472b6', cls:'folder-pics'},
  {name:'Videos', icon:'🎬', desc:'Video files, recordings', color:'#a78bfa', cls:'folder-vids'},
  {name:'Audio', icon:'🎵', desc:'Music, podcasts, recordings', color:'#34d399', cls:'folder-audio'},
  {name:'Projects', icon:'🚀', desc:'Code, web, dev files', color:'#fb923c', cls:'folder-projects'},
  {name:'Assignments', icon:'📝', desc:'Homework, submissions', color:'#fbbf24', cls:'folder-assignments'},
  {name:'Downloads', icon:'⬇️', desc:'Archives, installers, misc', color:'#38bdf8', cls:'folder-downloads'},
];

let currentPreviewFile = null;
let currentCtxFile = null;
let appLogoTaps = 0;
let appLogoTimer = null;

// ============================================================
// VAULT DATA
// ============================================================
function getVaultKey(vault) { return VAULT_PREFIX + btoa(unescape(encodeURIComponent(vault))).replace(/=/g,''); }
function loadVault(vault) {
  const key = getVaultKey(vault);
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function saveVault(vault, data) {
  const key = getVaultKey(vault);
  localStorage.setItem(key, JSON.stringify(data));
  updateAdminRegistry(vault, data);
}
function initVaultData() {
  return { files: [], starred: [], created: Date.now(), lastActive: Date.now() };
}
function getCurrentVault() { return loadVault(STATE.currentVault) || initVaultData(); }
function updateCurrentVault(fn) {
  const data = getCurrentVault();
  fn(data);
  data.lastActive = Date.now();
  saveVault(STATE.currentVault, data);
}

function updateAdminRegistry(vault, data) {
  try {
    const reg = JSON.parse(localStorage.getItem('nx_registry') || '{}');
    reg[vault] = { files: data.files.length, storage: data.files.reduce((a,f)=>a+f.size,0), lastActive: Date.now(), created: data.created };
    localStorage.setItem('nx_registry', JSON.stringify(reg));
  } catch {}
}

// ============================================================
// LOGIN
// ============================================================
function handleLogin() {
  const pw = document.getElementById('login-password').value.trim();
  if (!pw) { showToast('Enter a vault password', 'error'); return; }
  loginWithPassword(pw);
}
function quickLogin(pw) {
  document.getElementById('login-password').value = pw;
  loginWithPassword(pw);
}
function loginWithPassword(pw) {
  STATE.currentVault = pw;
  let data = loadVault(pw);
  if (!data) {
    data = initVaultData();
    saveVault(pw, data);
    showToast('New vault created! 🎉', 'success');
  } else {
    showToast('Welcome back! 🔓', 'success');
  }
  STATE.starred = data.starred || [];
  bootApp(pw);
}
function bootApp(pw) {
  document.getElementById('screen-login').style.display = 'none';
  const app = document.getElementById('app');
  app.classList.add('visible');
  
  document.getElementById('user-avatar').textContent = pw[0].toUpperCase();
  document.getElementById('settings-vault-id').textContent = '••••' + pw.slice(-3);
  
  const h = new Date().getHours();
  document.getElementById('greeting-time').textContent = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  document.getElementById('greeting-date').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  
  const saved = localStorage.getItem('nx_theme');
  if (saved) { STATE.isDark = saved === 'dark'; applyTheme(); }
  
  const ann = localStorage.getItem(ANNOUNCE_KEY);
  if (ann) showAnnouncement(ann);

  renderAll();
  showPage('home');
  checkMobile();
}
function handleLogout() {
  STATE.currentVault = null;
  STATE.chatHistory = [];
  document.getElementById('app').classList.remove('visible');
  document.getElementById('screen-login').style.display = 'flex';
  document.getElementById('login-password').value = '';
}
function togglePw(id, btn) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.textContent = el.type === 'password' ? '👁' : '🙈';
}

// ============================================================
// LOGO TAP (LOGIN)
// ============================================================
let loginLogoTaps = 0;
let loginLogoTimer = null;
document.getElementById('logo-tap').addEventListener('click', () => {
  loginLogoTaps++;
  clearTimeout(loginLogoTimer);
  loginLogoTimer = setTimeout(() => { loginLogoTaps = 0; }, 3000);
  if (loginLogoTaps >= 17) {
    loginLogoTaps = 0;
    openAdminLogin();
  }
});

// In-app logo tap
function handleLogoTap() {
  appLogoTaps++;
  clearTimeout(appLogoTimer);
  appLogoTimer = setTimeout(() => { appLogoTaps = 0; }, 3000);
  if (appLogoTaps >= 17) {
    appLogoTaps = 0;
    openAdminLogin();
  }
}

// ============================================================
// ADMIN
// ============================================================
function openAdminLogin() {
  document.getElementById('screen-admin-login').classList.add('open');
}
function closeAdminLogin() {
  document.getElementById('screen-admin-login').classList.remove('open');
  document.getElementById('admin-password').value = '';
}
function handleAdminLogin() {
  const pw = document.getElementById('admin-password').value;
  if (pw === 'nexusadmin') {
    closeAdminLogin();
    openAdmin();
  } else {
    showToast('Wrong admin password', 'error');
    document.getElementById('admin-password').value = '';
  }
}
function openAdmin() {
  document.getElementById('admin-panel').classList.add('open');
  refreshAdminData();
}
function closeAdmin() {
  document.getElementById('admin-panel').classList.remove('open');
}
function refreshAdminData() {
  try {
    const reg = JSON.parse(localStorage.getItem('nx_registry') || '{}');
    const vaults = Object.keys(reg);
    let totalFiles = 0, totalStorage = 0, allFiles = [];
    
    document.getElementById('a-vaults').textContent = vaults.length;
    document.getElementById('a-active').textContent = vaults.filter(v => Date.now() - reg[v].lastActive < 30*60*1000).length;
    
    const tbody = document.getElementById('admin-vault-body');
    tbody.innerHTML = '';
    vaults.forEach(vault => {
      const v = reg[vault];
      totalFiles += v.files;
      totalStorage += v.storage;
      const isActive = Date.now() - v.lastActive < 30*60*1000;
      tbody.innerHTML += `<tr>
        <td><code style="background:var(--glass2);padding:2px 8px;border-radius:6px;font-size:12px">${vault.substring(0,3)+'••••'}</code></td>
        <td>${v.files}</td>
        <td>${formatSize(v.storage)}</td>
        <td>${timeAgo(v.lastActive)}</td>
        <td><span class="badge ${isActive?'badge-green':'badge-red'}">${isActive?'● Active':'○ Idle'}</span></td>
      </tr>`;
      
      try {
        const data = loadVaultByKey(vault);
        if (data) data.files.forEach(f => allFiles.push({...f, vault}));
      } catch {}
    });
    
    document.getElementById('a-files').textContent = totalFiles;
    document.getElementById('a-storage').textContent = formatSize(totalStorage);
    
    const ftbody = document.getElementById('admin-files-body');
    ftbody.innerHTML = '';
    allFiles.slice(0,50).forEach(f => {
      ftbody.innerHTML += `<tr>
        <td><span style="font-size:16px">${getFileIcon(f.name)}</span> ${f.name}</td>
        <td><span class="badge badge-blue">${f.ext || 'file'}</span></td>
        <td><code style="font-size:11px">${f.vault.substring(0,3)+'••••'}</code></td>
        <td>${f.folder || 'Uncategorized'}</td>
        <td>${formatSize(f.size)}</td>
        <td>${timeAgo(f.uploaded)}</td>
      </tr>`;
    });
    
    const proj = document.getElementById('admin-projects-grid');
    proj.innerHTML = '';
    allFiles.filter(f=>f.folder==='Projects').forEach(f => {
      proj.innerHTML += `<div class="glass file-card"><div class="file-card-icon">${getFileIcon(f.name)}</div><div class="file-card-name">${f.name}</div><div class="file-card-meta">${f.vault.substring(0,3)+'••••'} • ${formatSize(f.size)}</div></div>`;
    });
    if (!allFiles.filter(f=>f.folder==='Projects').length) proj.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:16px">No project files yet</div>';
    
  } catch(e) { console.error(e); }
}
function loadVaultByKey(vault) {
  try {
    return JSON.parse(localStorage.getItem(getVaultKey(vault)) || 'null');
  } catch { return null; }
}
function sendAnnouncement() {
  const txt = document.getElementById('announce-text').value.trim();
  if (!txt) { showToast('Write an announcement first', 'error'); return; }
  localStorage.setItem(ANNOUNCE_KEY, txt);
  document.getElementById('active-announcement').textContent = '✅ Active: ' + txt;
  showAnnouncement(txt);
  showToast('Announcement sent!', 'success');
}
function clearAnnouncement() {
  localStorage.removeItem(ANNOUNCE_KEY);
  document.getElementById('active-announcement').textContent = 'No active announcement';
  document.getElementById('announce-text').value = '';
  document.getElementById('announcement-banner').style.display = 'none';
  showToast('Announcement cleared', 'info');
}
function showAnnouncement(txt) {
  STATE.announcement = txt;
  document.getElementById('announcement-text').textContent = txt;
  document.getElementById('announcement-banner').style.display = 'flex';
}

// ============================================================
// NAVIGATION / PAGES
// ============================================================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');
  STATE.currentPage = page;
  if (page === 'files') { STATE.currentFolder = null; renderFilesPage(); }
  if (page === 'recents') renderRecents();
  if (page === 'starred') renderStarred();
  if (page === 'home') renderHome();
  closeSidebar();
}
function openFolder(folder) {
  STATE.currentFolder = folder;
  showPage('files');
  setTimeout(() => renderFolderView(folder), 10);
}
function renderAll() {
  renderHome();
  renderFolderCounts();
  updateStorageDisplay();
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome() {
  const data = getCurrentVault();
  document.getElementById('stat-total-files').textContent = data.files.length;
  document.getElementById('stat-storage').textContent = formatSize(data.files.reduce((a,f)=>a+f.size,0));
  document.getElementById('stat-starred').textContent = (data.starred||[]).length;
  
  const hf = document.getElementById('home-folders');
  hf.innerHTML = FOLDER_INFO.map(f => {
    const cnt = data.files.filter(file => file.folder === f.name).length;
    return `<div class="glass folder-card" onclick="openFolder('${f.name}')" style="border-top:3px solid ${f.color}">
      <span class="folder-icon">${f.icon}</span>
      <div class="folder-name">${f.name}</div>
      <div class="folder-count">${cnt} file${cnt!==1?'s':''}</div>
    </div>`;
  }).join('');
  
  const hr = document.getElementById('home-recents');
  const recent = [...data.files].sort((a,b)=>b.uploaded-a.uploaded).slice(0,8);
  if (!recent.length) {
    hr.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:12px">📂</div>
      <p style="font-size:14px">No files yet. Upload some to get started!</p>
      <button class="btn btn-primary" style="margin-top:16px" onclick="showPage('files')">+ Upload Files</button>
    </div>`;
  } else {
    hr.innerHTML = `<div class="recent-grid">${recent.map(f=>fileCard(f)).join('')}</div>`;
  }
}

// ============================================================
// FILES / FOLDERS
// ============================================================
function renderFilesPage() {
  document.getElementById('folders-view').style.display = 'block';
  document.getElementById('folder-files-view').style.display = 'none';
  document.getElementById('files-title').textContent = 'My Vault';
  document.getElementById('breadcrumb').innerHTML = '<span class="breadcrumb-item" onclick="showPage(\'files\')">🏠 My Vault</span>';
  
  const mf = document.getElementById('main-folders');
  const data = getCurrentVault();
  mf.innerHTML = FOLDER_INFO.map(f => {
    const cnt = data.files.filter(file => file.folder === f.name).length;
    return `<div class="glass folder-card" onclick="openFolder('${f.name}')" style="border-top:3px solid ${f.color}">
      <span class="folder-icon">${f.icon}</span>
      <div class="folder-name">${f.name}</div>
      <div class="folder-count">${cnt} file${cnt!==1?'s':''}</div>
    </div>`;
  }).join('');
}

function renderFolderView(folder) {
  document.getElementById('folders-view').style.display = 'none';
  document.getElementById('folder-files-view').style.display = 'block';
  
  const info = FOLDER_INFO.find(f=>f.name===folder);
  document.getElementById('files-title').textContent = (info?.icon||'📁') + ' ' + folder;
  document.getElementById('breadcrumb').innerHTML = `
    <span class="breadcrumb-item" onclick="showPage('files')">🏠 My Vault</span>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-item" style="color:var(--text)">${info?.icon||'📁'} ${folder}</span>`;
  
  updateFileView();
}

function updateFileView() {
  if (!STATE.currentFolder) return;
  const data = getCurrentVault();
  let files = data.files.filter(f=>f.folder===STATE.currentFolder);
  const q = document.getElementById('folder-filter').value.toLowerCase();
  if (q) files = files.filter(f=>f.name.toLowerCase().includes(q));
  files = sortFileList(files);
  
  if (STATE.viewMode === 'grid') {
    document.getElementById('files-grid-view').style.display = 'block';
    document.getElementById('files-list-view').style.display = 'none';
    document.getElementById('files-grid').innerHTML = files.length
      ? files.map(f=>fileCard(f)).join('')
      : emptyState(STATE.currentFolder);
  } else {
    document.getElementById('files-grid-view').style.display = 'none';
    document.getElementById('files-list-view').style.display = 'block';
    document.getElementById('files-list').innerHTML = files.length
      ? files.map(f=>fileRow(f)).join('')
      : `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3)">${emptyState(STATE.currentFolder)}</td></tr>`;
  }
}

function fileCard(f) {
  const isStarred = (getCurrentVault().starred||[]).includes(f.id);
  return `<div class="glass file-card" onclick="previewFile('${f.id}')" oncontextmenu="showCtxMenu(event,'${f.id}')">
    <div class="file-card-actions">
      <button class="btn btn-icon btn-ghost" style="width:28px;height:28px;font-size:12px" onclick="event.stopPropagation();toggleStar('${f.id}')">${isStarred?'⭐':'☆'}</button>
      <button class="btn btn-icon btn-ghost" style="width:28px;height:28px;font-size:12px" onclick="event.stopPropagation();downloadFile('${f.id}')">⬇</button>
      <button class="btn btn-icon btn-ghost" style="width:28px;height:28px;font-size:12px;color:var(--red)" onclick="event.stopPropagation();deleteFile('${f.id}')">🗑</button>
    </div>
    <div class="file-card-icon">${getFileIcon(f.name)}</div>
    <div class="file-card-name" title="${f.name}">${f.name}</div>
    <div class="file-card-meta">${formatSize(f.size)} • ${timeAgo(f.uploaded)}</div>
  </div>`;
}

function fileRow(f) {
  const isStarred = (getCurrentVault().starred||[]).includes(f.id);
  return `<tr oncontextmenu="showCtxMenu(event,'${f.id}')">
    <td><div class="file-row-name" onclick="previewFile('${f.id}')"><span class="file-row-icon">${getFileIcon(f.name)}</span>${f.name}</div></td>
    <td style="font-size:12px;color:var(--text3)">${formatSize(f.size)}</td>
    <td style="font-size:12px;color:var(--text3)">${timeAgo(f.uploaded)}</td>
    <td><span class="badge badge-blue" style="font-size:10px">${f.ext||'—'}</span></td>
    <td><div class="file-actions">
      <button class="btn btn-icon btn-ghost" onclick="toggleStar('${f.id}')">${isStarred?'⭐':'☆'}</button>
      <button class="btn btn-icon btn-ghost" onclick="downloadFile('${f.id}')">⬇️</button>
      <button class="btn btn-icon btn-ghost" onclick="askAIAboutFile('${f.id}')">🤖</button>
      <button class="btn btn-icon btn-ghost" style="color:var(--red)" onclick="deleteFile('${f.id}')">🗑️</button>
    </div></td>
  </tr>`;
}

function emptyState(folder) {
  return `<div style="text-align:center;padding:60px;color:var(--text3);grid-column:1/-1">
    <div style="font-size:56px;margin-bottom:16px">${FOLDER_INFO.find(f=>f.name===folder)?.icon||'📁'}</div>
    <p style="font-size:15px;font-weight:500;margin-bottom:8px">No files in ${folder}</p>
    <p style="font-size:13px">Upload files and they'll be auto-sorted here</p>
    <button class="btn btn-primary" style="margin-top:20px" onclick="triggerUpload()">+ Upload Files</button>
  </div>`;
}

function renderFolderCounts() {
  const data = getCurrentVault();
  FOLDER_INFO.forEach(f => {
    const cnt = data.files.filter(file=>file.folder===f.name).length;
    const el = document.getElementById('cnt-'+f.name);
    if (el) el.textContent = cnt || '';
  });
}

function renderRecents() {
  const data = getCurrentVault();
  const recent = [...data.files].sort((a,b)=>b.uploaded-a.uploaded).slice(0,20);
  const grid = document.getElementById('recents-grid');
  grid.innerHTML = recent.length ? recent.map(f=>fileCard(f)).join('') : `<div style="text-align:center;padding:60px;color:var(--text3);grid-column:1/-1"><div style="font-size:48px">📂</div><p style="margin-top:12px">No recent files</p></div>`;
}

function renderStarred() {
  const data = getCurrentVault();
  const starred = data.files.filter(f=>(data.starred||[]).includes(f.id));
  const grid = document.getElementById('starred-grid');
  grid.innerHTML = starred.length ? starred.map(f=>fileCard(f)).join('') : `<div style="text-align:center;padding:60px;color:var(--text3);grid-column:1/-1"><div style="font-size:48px">⭐</div><p style="margin-top:12px">No starred files yet</p></div>`;
}

// ============================================================
// FILE UPLOAD
// ============================================================
function triggerUpload() { document.getElementById('file-input').click(); }
function handleDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('dragover'); }
function handleDragLeave() { document.getElementById('upload-zone').classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('dragover');
  handleFileSelect(e.dataTransfer.files);
}
function handleFileSelect(files) {
  if (!files || !files.length) return;
  Array.from(files).forEach(file => uploadFile(file));
}

function uploadFile(file) {
  const id = 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
  const ext = file.name.split('.').pop().toLowerCase();
  const folder = FILE_FOLDERS[ext] || (STATE.currentFolder || 'Downloads');
  
  const prog = document.createElement('div');
  prog.className = 'upload-item glass';
  prog.id = 'prog_' + id;
  prog.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:13px"><span>${getFileIcon(file.name)} ${file.name.length>25?file.name.substr(0,22)+'...':file.name}</span><span id="pct_${id}">0%</span></div><div class="progress-bar"><div class="progress-fill" id="fill_${id}" style="width:0%"></div></div>`;
  document.getElementById('upload-progress').appendChild(prog);
  
  const reader = new FileReader();
  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round(e.loaded/e.total*100);
      const fillEl = document.getElementById('fill_'+id);
      const pctEl = document.getElementById('pct_'+id);
      if (fillEl) fillEl.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
    }
  };
  reader.onload = (e) => {
    const fileData = {
      id, name: file.name, ext, folder,
      size: file.size, type: file.type,
      uploaded: Date.now(), data: e.target.result
    };
    updateCurrentVault(data => { data.files.unshift(fileData); });
    
    const fillEl = document.getElementById('fill_'+id);
    const pctEl = document.getElementById('pct_'+id);
    if (fillEl) fillEl.style.width = '100%';
    if (pctEl) pctEl.textContent = '✅';
    
    setTimeout(() => { document.getElementById('prog_'+id)?.remove(); }, 2000);
    
    showToast(`${file.name} uploaded to ${folder}`, 'success');
    renderAll();
    if (STATE.currentFolder) updateFileView();
  };
  reader.onerror = () => {
    document.getElementById('prog_'+id)?.remove();
    showToast('Failed to upload ' + file.name, 'error');
  };
  reader.readAsDataURL(file);
}

// ============================================================
// FILE PREVIEW
// ============================================================
function previewFile(id) {
  const data = getCurrentVault();
  const file = data.files.find(f=>f.id===id);
  if (!file) return;
  currentPreviewFile = id;
  
  document.getElementById('preview-title').textContent = file.name;
  document.getElementById('preview-icon').textContent = getFileIcon(file.name);
  
  const body = document.getElementById('preview-body');
  const type = file.type || '';
  
  if (type.startsWith('image/')) {
    body.innerHTML = `<img src="${file.data}" class="preview-image" alt="${file.name}">`;
  } else if (type.startsWith('video/')) {
    body.innerHTML = `<video src="${file.data}" class="preview-video" controls autoplay></video>`;
  } else if (type.startsWith('audio/')) {
    body.innerHTML = `<div style="text-align:center;padding:40px"><div style="font-size:64px;margin-bottom:20px">🎵</div><p style="font-size:16px;margin-bottom:20px">${file.name}</p><audio src="${file.data}" class="preview-audio" controls></audio></div>`;
  } else if (type === 'application/pdf') {
    body.innerHTML = `<iframe src="${file.data}" class="preview-pdf"></iframe>`;
  } else if (type.startsWith('text/') || ['json','xml','md','csv','js','ts','py','html','css','java','cpp','c','php','rb','go','rs','sh'].includes(file.ext)) {
    try {
      const b64 = file.data.split(',')[1];
      const text = decodeURIComponent(escape(atob(b64)));
      body.innerHTML = `<pre class="preview-text">${escHtml(text)}</pre>`;
    } catch {
      body.innerHTML = `<pre class="preview-text">Cannot decode file content</pre>`;
    }
  } else {
    body.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text3)">
      <div style="font-size:64px;margin-bottom:20px">${getFileIcon(file.name)}</div>
      <p style="font-size:16px;margin-bottom:8px">${file.name}</p>
      <p style="font-size:13px;margin-bottom:20px">${formatSize(file.size)} • ${file.type||'Unknown type'}</p>
      <button class="btn btn-primary" onclick="downloadFile('${id}')">⬇️ Download File</button>
    </div>`;
  }
  
  document.getElementById('preview-modal').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll('#preview-body video, #preview-body audio').forEach(m => m.pause());
}

function downloadFile(id) {
  const data = getCurrentVault();
  const file = data.files.find(f=>f.id===id);
  if (!file) return;
  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  a.click();
  showToast('Downloading ' + file.name, 'info');
}

// ============================================================
// FILE OPERATIONS
// ============================================================
function deleteFile(id) {
  if (!confirm('Delete this file permanently?')) return;
  updateCurrentVault(data => { data.files = data.files.filter(f=>f.id!==id); data.starred=(data.starred||[]).filter(s=>s!==id); });
  showToast('File deleted', 'info');
  renderAll();
  if (STATE.currentFolder) updateFileView();
  closeModal('preview-modal');
}
function toggleStar(id) {
  updateCurrentVault(data => {
    const idx = (data.starred||[]).indexOf(id);
    if (!data.starred) data.starred = [];
    if (idx>=0) { data.starred.splice(idx,1); showToast('Removed from starred', 'info'); }
    else { data.starred.push(id); showToast('Added to starred ⭐', 'success'); }
  });
  renderAll();
  if (STATE.currentFolder) updateFileView();
}
function filterFiles(q) { updateFileView(); }
function sortFiles(mode) { STATE.sortMode = mode; updateFileView(); }
function sortFileList(files) {
  return [...files].sort((a,b) => {
    if (STATE.sortMode==='name') return a.name.localeCompare(b.name);
    if (STATE.sortMode==='date') return b.uploaded-a.uploaded;
    if (STATE.sortMode==='size') return b.size-a.size;
    if (STATE.sortMode==='type') return (a.ext||'').localeCompare(b.ext||'');
    return 0;
  });
}
function setView(mode) {
  STATE.viewMode = mode;
  document.getElementById('view-grid-btn').classList.toggle('active', mode==='grid');
  document.getElementById('view-list-btn').classList.toggle('active', mode==='list');
  updateFileView();
}
function confirmClearVault() {
  if (!confirm('Delete ALL files in your vault? This cannot be undone!')) return;
  updateCurrentVault(data => { data.files = []; data.starred = []; });
  showToast('Vault cleared', 'info');
  renderAll();
}

// ============================================================
// CONTEXT MENU
// ============================================================
function showCtxMenu(e, id) {
  e.preventDefault();
  currentCtxFile = id;
  const menu = document.getElementById('ctx-menu');
  menu.style.left = Math.min(e.clientX, window.innerWidth-170) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight-220) + 'px';
  menu.classList.add('open');
}
function ctxAction(action) {
  document.getElementById('ctx-menu').classList.remove('open');
  if (!currentCtxFile) return;
  if (action==='open') previewFile(currentCtxFile);
  else if (action==='download') downloadFile(currentCtxFile);
  else if (action==='delete') deleteFile(currentCtxFile);
  else if (action==='rename') renameFile(currentCtxFile);
  else if (action==='copy') { showToast('Link copied!','success'); }
  else if (action==='share') { showToast('Share link generated','success'); }
  else if (action==='ai') askAIAboutFile(currentCtxFile);
}
function renameFile(id) {
  const data = getCurrentVault();
  const file = data.files.find(f=>f.id===id);
  if (!file) return;
  const newName = prompt('Rename file:', file.name);
  if (!newName || newName===file.name) return;
  updateCurrentVault(d => { const f=d.files.find(x=>x.id===id); if(f) f.name=newName; });
  showToast('File renamed','success');
  renderAll();
  if (STATE.currentFolder) updateFileView();
}
document.addEventListener('click', () => document.getElementById('ctx-menu').classList.remove('open'));
document.addEventListener('keydown', e => { if(e.key==='Escape'){closeModal('preview-modal');document.getElementById('ctx-menu').classList.remove('open');} });

// ============================================================
// SEARCH
// ============================================================
function handleGlobalSearch(q) {
  if (!q.trim()) { if(STATE.currentPage==='search') showPage('home'); return; }
  STATE.searchQuery = q;
  showPage('search');
  const data = getCurrentVault();
  const results = data.files.filter(f=>f.name.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('search-result-count').textContent = `${results.length} result${results!==1?'s':''} for "${q}"`;
  const list = document.getElementById('search-results-list');
  list.innerHTML = results.length ? results.map(f=>`
    <div class="search-result-item glass" onclick="previewFile('${f.id}')">
      <span style="font-size:24px">${getFileIcon(f.name)}</span>
      <div>
        <div class="search-result-name">${highlightMatch(f.name,q)}</div>
        <div class="search-result-path">${f.folder} • ${formatSize(f.size)} • ${timeAgo(f.uploaded)}</div>
      </div>
    </div>`).join('') : `<div style="text-align:center;padding:60px;color:var(--text3)"><div style="font-size:48px">🔍</div><p style="margin-top:12px">No files found for "${q}"</p></div>`;
}
function highlightMatch(name, q) {
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx<0) return escHtml(name);
  return escHtml(name.slice(0,idx)) + `<mark style="background:rgba(108,99,255,0.3);border-radius:3px;padding:0 2px">${escHtml(name.slice(idx,idx+q.length))}</mark>` + escHtml(name.slice(idx+q.length));
}

// ============================================================
// AI CHATBOT
// ============================================================
function sendSuggestion(msg) {
  document.getElementById('chat-input').value = msg;
  sendChat();
}
function listFilesForAI() {
  const data = getCurrentVault();
  const list = data.files.map(f=>`- ${f.name} (${f.folder})`).join('\n');
  const prompt = list ? `Here are my uploaded files:\n${list}\n\nCan you help me find something specific or tell me what I can do with these?` : 'I have no files uploaded yet. What kinds of files can I store in NexusVault?';
  document.getElementById('chat-input').value = prompt;
  sendChat();
}
function askAIAboutFile(id) {
  showPage('ai');
  const data = getCurrentVault();
  const f = data.files.find(x=>x.id===id);
  if (!f) return;
  document.getElementById('chat-input').value = `Can you help me with my file "${f.name}"? It's a ${f.ext} file in my ${f.folder} folder.`;
  setTimeout(sendChat, 300);
}
function handleChatKey(e) {
  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
function clearChat() {
  STATE.chatHistory = [];
  document.getElementById('chat-messages').innerHTML = `<div class="msg msg-ai"><div class="msg-avatar msg-ai-avatar">🤖</div><div><div class="msg-bubble">Chat cleared! How can I help you? 😊</div></div></div>`;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  
  input.value = '';
  input.style.height = '48px';
  document.getElementById('chat-suggestions').style.display = 'none';
  
  addMessage(msg, 'user');
  STATE.chatHistory.push({role:'user',content:msg});
  
  const typingId = addTyping();
  document.getElementById('chat-send-btn').disabled = true;
  
  try {
    const model = document.getElementById('model-select').value;
    const data = getCurrentVault();
    const fileList = data.files.slice(0,20).map(f=>`${f.name} (${f.folder})`).join(', ');
    
    const systemPrompt = `You are NexusAI, an intelligent assistant for NexusVault, a student cloud storage platform. You help students with assignments, coding, explanations, summaries, and learning.

The student's vault contains these files: ${fileList || 'No files yet'}

Be helpful, concise, and encouraging. Use emojis occasionally. Format code in markdown code blocks. For complex questions, structure your response clearly.`;
    
    const messages = [...STATE.chatHistory];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });
    
    removeTyping(typingId);
    
    if (!response.ok) {
      const err = await response.json().catch(()=>({}));
      throw new Error(err.error?.message || 'API error ' + response.status);
    }
    
    const result = await response.json();
    const reply = result.content?.map(c=>c.text||'').join('') || 'I could not generate a response.';
    
    addMessage(reply, 'ai');
    STATE.chatHistory.push({role:'assistant',content:reply});
    
  } catch(e) {
    removeTyping(typingId);
    addMessage(`❌ Error: ${e.message}\n\nThis AI feature requires an Anthropic API key configured in the deployment. The platform and storage features work fully without it!`, 'ai');
  }
  
  document.getElementById('chat-send-btn').disabled = false;
}

function addMessage(text, role) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  const isAI = role==='ai';
  div.innerHTML = `<div class="msg-avatar ${isAI?'msg-ai-avatar':'msg-user-avatar'}">${isAI?'🤖':'👤'}</div>
    <div><div class="msg-bubble">${formatMsgText(text)}</div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function addTyping() {
  const id = 'typing_' + Date.now();
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg msg-ai';
  div.id = id;
  div.innerHTML = `<div class="msg-avatar msg-ai-avatar">🤖</div><div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}
function removeTyping(id) { document.getElementById(id)?.remove(); }
function formatMsgText(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g,'<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/\n/g,'<br>');
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  STATE.isDark = !STATE.isDark;
  applyTheme();
  localStorage.setItem('nx_theme', STATE.isDark?'dark':'light');
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', STATE.isDark?'dark':'light');
  document.getElementById('theme-btn').textContent = STATE.isDark?'🌙':'☀️';
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.classList.toggle('on', STATE.isDark);
}

// ============================================================
// STORAGE DISPLAY
// ============================================================
function updateStorageDisplay() {
  const data = getCurrentVault();
  const used = data.files.reduce((a,f)=>a+f.size,0);
  const pct = Math.min(used/((1024*1024*1024)*2)*100, 100);
  const text = formatSize(used);
  document.getElementById('header-storage-fill').style.width = pct + '%';
  document.getElementById('header-storage-text').textContent = text;
  const ss = document.getElementById('settings-storage');
  if (ss) ss.textContent = text + ' / 2 GB';
  const ssb = document.getElementById('settings-storage-bar');
  if (ssb) ssb.style.width = pct + '%';
}

// ============================================================
// MOBILE
// ============================================================
function checkMobile() {
  const isMobile = window.innerWidth <= 768;
  document.getElementById('menu-toggle').style.display = isMobile ? 'flex' : 'none';
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
}
window.addEventListener('resize', checkMobile);
document.getElementById('main-content').addEventListener('click', closeSidebar);

// ============================================================
// UTILITIES
// ============================================================
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}
function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  if (bytes < 1024*1024*1024) return (bytes/1024/1024).toFixed(1) + ' MB';
  return (bytes/1024/1024/1024).toFixed(2) + ' GB';
}
function timeAgo(ts) {
  const diff = Date.now()-ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff/86400000) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showToast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span>${escHtml(msg)}`;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);},3000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-password').addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
  document.getElementById('admin-password').addEventListener('keydown', e => { if(e.key==='Enter') handleAdminLogin(); });
});
