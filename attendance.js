// modules/attendance.js
export async function mount({ supabase, session, ui }){
  const { $ , toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Attendance</h3></div>
    <div style="height:10px"></div>
    <div class="row">
      <select id="attEntity"><option value="student">student</option><option value="teacher">teacher</option></select>
      <select id="attPerson"></select>
      <input id="attDate" placeholder="YYYY-MM-DD" />
      <select id="attStatus"><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option></select>
      <button id="btnMarkAtt" class="btn">Save</button>
    </div>
    <div style="margin-top:12px;overflow:auto"><table><thead><tr><th>Date</th><th>Who</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody id="attBody"></tbody></table></div>
  </div>`;

  const personSelect = $('#attPerson');
  const entitySelect = $('#attEntity');
  const attBody = $('#attBody');

  async function loadPeople(){
    const role = entitySelect.value;
    const { data } = await supabase.from('users').select('*').eq('role', role);
    personSelect.innerHTML = (data||[]).map(p=>`<option value="${p.id}">${p.name||p.id}</option>`).join('');
  }

  async function loadAttendance(){
    const { data } = await supabase.from('attendance').select('*').order('date', { ascending:false }).limit(200);
    attBody.innerHTML = (data||[]).map(a=>`<tr>
      <td>${a.date}</td><td>${a.who}</td><td>${a.role}</td><td>${a.status}</td>
      <td><button class="btn outline" data-del="${a.id}">Delete</button></td></tr>`).join('');
    attBody.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-del');
      if(!confirm('Delete?')) return;
      await supabase.from('attendance').delete().eq('id', id);
      toast('Deleted'); loadAttendance();
    }));
  }

  entitySelect.addEventListener('change', loadPeople);
  $('#btnMarkAtt').addEventListener('click', async ()=>{
    const who = personSelect.value;
    const role = entitySelect.value;
    const date = $('#attDate').value || new Date().toISOString().slice(0,10);
    const status = $('#attStatus').value;
    const id = Math.random().toString(36).substring(2,9);
    await supabase.from('attendance').insert([{ id, who, role, date, status }]);
    // if absent -> create notification to parent(s)
    if(status === 'absent'){
      // Try to find parent(s) by parentId relation in users table (if present)
      const { data:student } = await supabase.from('users').select('*').eq('id', who).limit(1);
      let parentMessage = `Your child (${student && student[0] ? student[0].name : who}) is marked absent on ${date}.`;
      // insert into notices or notifications table
      await supabase.from('notices').insert([{ id: 'n_'+Date.now(), title:'Absent Alert', content: parentMessage, date, scope:'parent' }]);
      toast('Attendance saved — parent notified (notice created).');
    }else{
      toast('Attendance saved.');
    }
    loadAttendance();
  });

  await loadPeople();
  await loadAttendance();
}

