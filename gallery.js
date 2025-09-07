// modules/gallery.js
export async function mount({ supabase, session, ui }){
  const { $, toast } = ui;
  const root = $('#moduleContent');
  root.innerHTML = `<div class="card"><div class="section-title"><h3>Gallery (links)</h3></div>
    <div style="margin-top:8px" class="row">
      <input id="gTitle" placeholder="Title"/>
      <input id="gLink" placeholder="Link (Google Drive / URL)"/>
      <input id="gCat" placeholder="Category"/>
      <button id="btnAddGallery" class="btn">Add</button>
    </div>
    <div style="margin-top:12px;overflow:auto"><table><thead><tr><th>Title</th><th>Category</th><th>Link</th><th>Actions</th></tr></thead><tbody id="galleryTbody"></tbody></table></div>
  </div>`;
  const tbody = $('#galleryTbody');
  async function load(){
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending:false });
    tbody.innerHTML = (data||[]).map(g=>`<tr><td>${g.title}</td><td>${g.category||''}</td><td><a href="${g.link}" target="_blank">Open</a></td><td><button class="btn" data-del="${g.id}">Delete</button></td></tr>`).join('');
    tbody.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-del');
      if(!confirm('Delete?')) return;
      await supabase.from('gallery').delete().eq('id', id);
      toast('Deleted'); load();
    }));
  }
  $('#btnAddGallery').addEventListener('click', async ()=>{
    const title = $('#gTitle').value.trim(), link = $('#gLink').value.trim(), cat = $('#gCat').value.trim();
    if(!title || !link) return toast('Title & link required');
    await supabase.from('gallery').insert([{ id:'g_'+Date.now(), title, link, category:cat }]);
    toast('Added'); $('#gTitle').value=''; $('#gLink').value=''; $('#gCat').value=''; load();
  });
  await load();
}

