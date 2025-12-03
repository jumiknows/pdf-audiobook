import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_path: string;
  full_text: string | null;
  summary_text: string | null;
  text_length: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  current_position: number;
  created_at: string;
  updated_at: string;
}
