// scripts/main.js
import { supabase } from './supabase.js';
import { seedAdminIfEmpty, login, getSession, logout } from './auth.js';

// UI helpers
const $ = (s)=>document.querySelector(s);
const show = (el)=>el && el.classList.remove('hidden');
const hide = (el)=>el && el.classList.add('hidden');
function toast(msg, t=2000){ const root = $('#toastRoot'); root.innerHTML = `<div class="toast">${msg}</div>`; setTimeout(()=>root.innerHTML='', t); }

// navigation
function navigateTo(name){
  ['#homeScreen','#loginScreen','#dashScreen','#moduleScreen'].forEach(sel=>hide($(sel)));
  if(name === 'home') show($('#homeScreen'));
  if(name === 'login') show($('#loginScreen'));
  if(name === 'dashboard') show($('#dashScreen'));
  if(name === 'module') show($('#moduleScreen'));
}

// build modules grid
function buildModulesGrid(){
  const modules = [
    {id:'notices', label:'Notification Board'},
    {id:'calendar', label:'Calendar & Events'},
    {id:'gallery', label:'Gallery'},
    {id:'attendance', label:'Attendance'},
    {id:'fees', label:'Fees'},
    {id:'users', label:'Users (Admin)'},
    {id:'settings', label:'Settings'}
  ];
  const grid = $('#modulesGrid');
  grid.innerHTML = '';
  modules.forEach(m=>{
    const node = document.createElement('div');
    node.className = 'module fade-in';
    node.innerHTML = `<div style="font-size:22px">🔹</div><h4>${m.label}</h4>`;
    node.addEventListener('click', ()=> openModule(m.id));
    grid.appendChild(node);
  });
}

// open module (load module script dynamically)
async function openModule(name){
  navigateTo('module');
  $('#moduleContent').innerHTML = `<div class="card"><h3>Loading ${name}...</h3></div>`;
  try{
    const mod = await import(`../modules/${name}.js`);
    if(mod && mod.mount) await mod.mount({ supabase, session: getSession(), ui: { $, show, hide, toast } });
  }catch(e){
    console.error('module load error', e);
    $('#moduleContent').innerHTML = `<div class="card"><h3>Error loading ${name}</h3><pre>${e.message}</pre></div>`;
  }
}

// render dashboard modules (role based)
function renderDashboard(session){
  $('#dashTitle').textContent = session.name || session.id;
  $('#dashRole').textContent = (session.role||'user').toUpperCase();
  $('#signedUser').textContent = session.username || session.id;
  const container = $('#dashModules');
  container.innerHTML = '';
  const role = session.role;
  const adminHtml = `<div class="card"><div class="section-title"><h3>Admin — Master Control</h3></div>
    <div style="height:10px"></div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
      <button class="btn" onclick="openModule('users')">Users</button>
      <button class="btn" onclick="openModule('attendance')">Attendance</button>
      <button class="btn" onclick="openModule('fees')">Fees</button>
      <button class="btn" onclick="openModule('calendar')">Calendar</button>
      <button class="btn" onclick="openModule('notices')">Notices</button>
      <button class="btn" onclick="openModule('gallery')">Gallery</button>
    </div></div>`;
  const teacherHtml = `<div class="card"><div class="section-title"><h3>Teacher — Tools</h3></div>
    <div style="height:10px"></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
    <button class="btn" onclick="openModule('attendance')">Attendance</button>
    <button class="btn" onclick="openModule('notices')">Notices</button>
    <button class="btn" onclick="openModule('gallery')">Resources</button>
    </div></div>`;
  const studentHtml = `<div class="card"><div class="section-title"><h3>Student — Overview</h3></div>
    <div style="height:10px"></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
    <button class="btn" onclick="openModule('attendance')">Attendance</button>
    <button class="btn" onclick="openModule('notices')">Notices</button>
    <button class="btn" onclick="openModule('calendar')">Calendar</button>
    </div></div>`;

  if(role === 'admin') container.innerHTML = adminHtml;
  else if(role === 'teacher') container.innerHTML = teacherHtml;
  else container.innerHTML = studentHtml;
}

// attach DOM events and init
async function init(){
  // theme
  const theme = localStorage.getItem('lfs_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeSelect').value = theme;
  $('#themeSelect').addEventListener('change', e=>{ document.documentElement.setAttribute('data-theme', e.target.value); localStorage.setItem('lfs_theme', e.target.value); });

  // nav buttons
  $('#btnPrimaryLogin').addEventListener('click', ()=> navigateTo('login'));
  $('#btnLoginNav').addEventListener('click', ()=> navigateTo('login'));
  $('#btnCancelLogin').addEventListener('click', ()=> navigateTo('home'));
  $('#btnHome').addEventListener('click', ()=> navigateTo('home'));
  $('#btnMenu').addEventListener('click', ()=> {
    openMenu();
  });
  $('#btnOpenCalendarHome').addEventListener('click', ()=> openModule('calendar'));

  // login actions
  $('#btnLogin').addEventListener('click', async ()=>{
    const id = $('#inputId').value.trim();
    const pwd = $('#inputPwd').value;
    if(!id || !pwd){ toast('Enter id & password'); return; }
    try{
      const { data, error } = await supabase.from('users').select('*').or(`id.eq.${id},username.eq.${id}`).limit(1);
      if(error) { toast('Login error'); console.error(error); return; }
      if(!data || data.length===0){ toast('User not found'); return; }
      const u = data[0];
      if(u.password !== pwd){ toast('Invalid credentials'); return; }
      const session = { id:u.id, username:u.username, role:u.role, name:u.name };
      localStorage.setItem('lfs_session', JSON.stringify(session));
      renderDashboard(session);
      navigateTo('dashboard');
      toast('Welcome '+(u.name||u.id));
    }catch(e){ console.error(e); toast('Login failed') }
  });

  $('#btnLogout').addEventListener('click', ()=>{
    logout();
    navigateTo('home');
    toast('Logged out');
  });

  $('#btnDashHome').addEventListener('click', ()=> navigateTo('home'));

  $('#btnForgot').addEventListener('click', ()=> {
    const id = prompt('Enter admin ID to reset (e.g. admin):','admin');
    if(!id) return;
    const confirmCode = prompt('Type RESET to confirm password reset:');
    if(confirmCode !== 'RESET'){ alert('Cancelled'); return; }
    const newPwd = prompt('Enter new password:','admin123');
    if(!newPwd) return;
    supabase.from('users').update({ password: newPwd }).eq('id', id).then(res=>{
      if(res.error) alert('Error: '+res.error.message); else alert('Password updated');
    });
  });

  // build modules grid and home highlights
  buildModulesGrid();
  renderHomeHighlights();

  // seed admin if empty
  await seedAdminIfEmpty();

  // restore session
  const stored = JSON.parse(localStorage.getItem('lfs_session') || 'null');
  if(stored && stored.id){
    renderDashboard(stored);
    navigateTo('dashboard');
  } else navigateTo('home');
}

window.openModule = openModule; // expo for inline buttons
window.logout = ()=>{ localStorage.removeItem('lfs_session'); navigateTo('home'); toast('Logged out'); };
window.seedAdminIfEmpty = seedAdminIfEmpty;

// small menu
function openMenu(){
  const html = `<div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn" onclick="location.reload()">Refresh</button>
    <button class="btn" onclick="openModule('calendar')">Calendar</button>
    <button class="btn" onclick="openModule('notices')">Notices</button>
    <button class="btn" onclick="openModule('gallery')">Gallery</button>
    <button class="btn" onclick="openModule('settings')">Settings</button>
  </div>`;
  showModal('Menu', html);
}

// modal helper
function showModal(title, contentHtml, buttons=[{label:'Close'}]){
  const root = document.getElementById('modalRoot');
  root.classList.remove('hidden');
  root.innerHTML = `<div class="modal-back"><div class="modal"><h3>${title}</h3><div style="margin-top:10px">${contentHtml}</div><div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px" id="modalActions"></div></div></div>`;
  const act = document.getElementById('modalActions');
  buttons.forEach(b=>{
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = b.label;
    btn.onclick = ()=>{ if(b.cb) b.cb(); root.classList.add('hidden'); root.innerHTML=''; };
    act.appendChild(btn);
  });
}

// home highlights
async function renderHomeHighlights(){
  try{
    const { data:events } = await supabase.from('events').select('*').order('date', { ascending:true }).limit(1);
    $('#homeNextEvent').textContent = events && events.length ? `${events[0].date} — ${events[0].title}` : 'No upcoming events';
  }catch(e){ console.error(e) }
  try{
    const { data:notices } = await supabase.from('notices').select('*').order('date', { ascending:false }).limit(1);
    $('#homeNoticePreview').textContent = notices && notices.length ? `${notices[0].date} — ${notices[0].title}` : 'No notices';
  }catch(e){}
}

init();

