// scripts/supabase.js
// Supabase client config — replace if you change projects
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://bpwhliuhkcuhunsofppg.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd2hsaXVoa2N1aHVuc29mcHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjY0MDcsImV4cCI6MjA3MjgwMjQwN30.XSJ-PZnH60wIMkbp9bt4C7wmgOUvytEGES7uZn4OXKE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

