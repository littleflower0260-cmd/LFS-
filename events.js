// modules/events.js
export async function mount({ supabase, session, ui }){
  const { $ , toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Calendar & Events</h3></div>
    <div style="margin-top:10px" class="row">
      <input id="evTitle" placeholder="Title"/>
      <input id="evDate" placeholder="dd-mm-yyyy"/>
      <select id="evType"><option value="holiday">Holiday</option><option value="exam">Exam</option><option value="activity">Activity</option></select>
      <button id="btnSaveEvent" class="btn">Save</button>
    </div>
    <div style="margin-top:12px;overflow:auto"><table><thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Actions</th></tr></thead><tbody id="eventsTbody"></tbody></table></div>
  </div>`;
  const tbody = $('#eventsTbody');
  async function loadEvents(){
    const { data } = await supabase.from('events').select('*').order('date', { ascending:true });
    tbody.innerHTML = (data||[]).map(e=>`<tr><td>${e.date}</td><td>${e.title}</td><td>${e.type||''}</td><td><button class="btn" data-del="${e.id}">Delete</button></td></tr>`).join('');
    tbody.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', async (ev)=>{
      const id = ev.target.getAttribute('data-del');
      if(!confirm('Delete event?')) return;
      await supabase.from('events').delete().eq('id', id);
      toast('Deleted'); loadEvents();
    }));
  }

  $('#btnSaveEvent').addEventListener('click', async ()=>{
    const title = $('#evTitle').value.trim();
    const date = $('#evDate').value.trim();
    const type = $('#evType').value;
    if(!title || !date) return toast('Title & date required');
    await supabase.from('events').insert([{ id:'e_'+Date.now(), title, date, type }]);
    toast('Event saved'); $('#evTitle').value=''; $('#evDate').value=''; loadEvents();
  });

  await loadEvents();
}

