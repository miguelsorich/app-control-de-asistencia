import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qeprszftroxkabwfputq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcHJzemZ0cm94a2Fid2ZwdXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODc1NDMsImV4cCI6MjEwMjQ2MzU0M30.R9vw3gfTXED53azW1Jof5FSQRy7D-FtmJJD_uLcQlCk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  projectId: 'qeprszftroxkabwfputq',
};
