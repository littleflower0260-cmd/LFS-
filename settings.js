// modules/settings.js
export async function mount({ supabase, session, ui }){
  const { $, toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Settings</h3></div>
    <div style="margin-top:12px">
      <label>School Name</label><input id="sSchoolName" placeholder="School name"/>
      <label style="margin-top:8px">Logo URL</label><input id="sLogoUrl" placeholder="Image URL"/>
      <div style="margin-top:8px" class="row"><button id="btnSaveSettings" class="btn">Save</button></div>
    </div>
  </div>`;
  $('#btnSaveSettings').addEventListener('click', async ()=>{
    const name = $('#sSchoolName').value.trim(), logo = $('#sLogoUrl').value.trim();
    // For demo: store in settings table single row id=settings
    await supabase.from('settings').upsert([{ id:'settings', school_name:name, logo_url:logo, updated_at:new Date().toISOString() }]);
    toast('Saved.');
    if(logo) {
      const box = document.getElementById('logoBox');
      box.innerHTML = `<img src="${logo}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
    }
    if(name) document.getElementById('appTitle').textContent = name;
  });
  // load existing
  const { data } = await supabase.from('settings').select('*').eq('id','settings').limit(1);
  if(data && data.length){
    $('#sSchoolName').value = data[0].school_name || '';
    $('#sLogoUrl').value = data[0].logo_url || '';
  }
}

