// modules/users.js
export async function mount({ supabase, session, ui }){
  const { $ , show, hide, toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Users</h3></div>
    <div style="margin-top:8px" class="row">
      <button id="btnAddUser" class="btn">Add User</button>
      <input id="userSearch" placeholder="Search id or name" style="width:240px;margin-left:12px"/>
    </div>
    <div style="margin-top:10px;overflow:auto">
    <table><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Class/Subject</th><th>Actions</th></tr></thead><tbody id="usersTbody"></tbody></table>
    </div>
  </div>`;
  const tbody = $('#usersTbody');

  async function loadUsers(){
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending:false });
    if(error) { console.error(error); toast('Error loading users'); return; }
    tbody.innerHTML = data.map(u=>`<tr>
      <td>${u.id}</td>
      <td>${u.name||''}</td>
      <td>${u.role||''}</td>
      <td>${u.class||u.subject||''}</td>
      <td>
        <button class="btn outline" data-edit="${u.id}">Edit</button>
        ${u.id==='admin' ? '' : `<button class="btn" data-del="${u.id}">Delete</button>`}
      </td>
    </tr>`).join('') || `<tr><td colspan="5" class="muted">No users</td></tr>`;
    // attach events
    tbody.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-edit');
      const u = data.find(x=>x.id===id);
      const name = prompt('Name:', u.name||'');
      if(name===null) return;
      const updates = { name };
      await supabase.from('users').update(updates).eq('id', id);
      toast('Updated'); loadUsers();
    }));
    tbody.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-del');
      if(!confirm('Delete user '+id+'?')) return;
      await supabase.from('users').delete().eq('id', id);
      toast('Deleted'); loadUsers();
    }));
  }

  $('#btnAddUser').addEventListener('click', async ()=>{
    const role = prompt('Role (admin/teacher/student):','student'); if(!role) return;
    const id = prompt('User ID (unique):'); if(!id) return;
    const name = prompt('Name:','');
    const pass = prompt('Password:','123456');
    const extra = role==='student' ? { class: prompt('Class (e.g. 5A):',''), roll_no: prompt('Roll no:','') } : (role==='teacher' ? { subject: prompt('Subject:',''), class: prompt('Class assigned:','') } : {});
    await supabase.from('users').insert([{ id, username:id, password:pass, role, name, ...extra }]);
    toast('User added'); loadUsers();
  });

  $('#userSearch').addEventListener('input', async (e)=>{
    const q = e.target.value.toLowerCase();
    const { data } = await supabase.from('users').select('*');
    const rows = (data||[]).filter(u=> (u.id||'').toLowerCase().includes(q) || (u.name||'').toLowerCase().includes(q));
    tbody.innerHTML = rows.map(u=>`<tr><td>${u.id}</td><td>${u.name||''}</td><td>${u.role||''}</td><td>${u.class||u.subject||''}</td><td><button class="btn outline" data-edit="${u.id}">Edit</button></td></tr>`).join('');
  });

  await loadUsers();
}

