import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mjnhmrazejpfbiamwyyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbmhtcmF6ZWpwZmJpYW13eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MjIxODQsImV4cCI6MjA1NjE5ODE4NH0.1d0Z_a62vIvV4h00PSmeVdgpdqlXufr_HXP3npBWvEI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
