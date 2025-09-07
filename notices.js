// modules/notices.js
export async function mount({ supabase, session, ui }){
  const { $ , toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Notices</h3></div>
    <div style="margin-top:8px" class="row">
      <input id="nTitle" placeholder="Title"/>
      <input id="nDate" placeholder="dd-mm-yyyy"/>
      <select id="nScope"><option value="all">All</option><option value="student">Students</option><option value="teacher">Teachers</option></select>
      <button id="btnPostNotice" class="btn">Post</button>
    </div>
    <textarea id="nContent" placeholder="Content" style="margin-top:10px"></textarea>
    <div style="margin-top:12px;overflow:auto"><table><thead><tr><th>Date</th><th>Title</th><th>Scope</th><th>Actions</th></tr></thead><tbody id="noticesTbody"></tbody></table></div>
  </div>`;
  const tbody = $('#noticesTbody');

  async function loadNotices(){
    const { data } = await supabase.from('notices').select('*').order('date', { ascending:false });
    tbody.innerHTML = (data||[]).map(n=>`<tr><td>${n.date}</td><td>${n.title}</td><td>${n.scope||'all'}</td><td><button class="btn" data-del="${n.id}">Delete</button></td></tr>`).join('');
    tbody.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-del');
      if(!confirm('Delete notice?')) return;
      await supabase.from('notices').delete().eq('id', id);
      toast('Deleted'); loadNotices();
    }));
  }

  $('#btnPostNotice').addEventListener('click', async ()=>{
    const title = $('#nTitle').value.trim(); const date = $('#nDate').value.trim(); const content = $('#nContent').value.trim(); const scope = $('#nScope').value;
    if(!title || !date || !content) return toast('All fields required');
    await supabase.from('notices').insert([{ id:'n_'+Date.now(), title, content, date, scope }]);
    toast('Posted'); $('#nTitle').value=''; $('#nContent').value=''; loadNotices();
  });

  await loadNotices();
}

