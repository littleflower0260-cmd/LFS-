// scripts/auth.js
import { supabase } from './supabase.js';

const LS_SESSION = 'lfs_session';

export async function seedAdminIfEmpty(){
  try{
    const { data } = await supabase.from('users').select('*').limit(1);
    if (!data || data.length===0){
      await supabase.from('users').insert([{ id:'admin', username:'admin', password:'admin123', role:'admin', name:'School Admin', created_at: new Date() }]);
      console.log('Seeded admin account: id=admin password=admin123');
    }
  }catch(e){ console.error('seedAdmin error', e); }
}

export async function login(id, pwd){
  // we look up by id or username (we assume id column exists)
  const { data, error } = await supabase.from('users').select('*').or(`id.eq.${id},username.eq.${id}`).limit(1);
  if (error) throw error;
  if (!data || data.length===0) return { ok:false, msg:'User not found' };
  const u = data[0];
  if (u.password !== pwd) return { ok:false, msg:'Invalid credentials' };
  const session = { id: u.id, username:u.username, role:u.role, name:u.name };
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
  return { ok:true, session };
}

export function getSession(){
  return JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
}

export function logout(){
  localStorage.removeItem(LS_SESSION);
}

