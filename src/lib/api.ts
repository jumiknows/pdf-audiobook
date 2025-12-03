import { supabase } from './supabase';
import { extractTextFromPDF } from '../utils/pdfProcessor';

export const api = {
  auth: {
    register: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },

    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user };
    },

    getSession: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    }
  },

  documents: {
    upload: async (file: File, title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const text = await extractTextFromPDF(file);
      const textLength = text.length;

      const { data: doc, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          original_filename: file.name,
          file_path: uploadData.path,
          full_text: text,
          summary_text: null,
          text_length: textLength,
          processing_status: 'completed',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        console.log('Calling AI summarization...');
        const summaryResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-text`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, maxLength: 500 }),
          }
        );

        console.log('Summary response status:', summaryResponse.status);

        if (summaryResponse.ok) {
          const result = await summaryResponse.json();
          console.log('Summary result:', result);

          if (result.summary) {
            await supabase
              .from('documents')
              .update({ summary_text: result.summary })
              .eq('id', doc.id);

            doc.summary_text = result.summary;
          }
        } else {
          const errorText = await summaryResponse.text();
          console.error('Summary API error:', errorText);
        }
      } catch (summaryError) {
        console.error('Failed to generate summary:', summaryError);
      }

      return doc;
    },

    getAll: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { documents: data };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Document not found');
      return data;
    },

    updatePosition: async (id: string, currentPosition: number) => {
      const { error } = await supabase
        .from('documents')
        .update({ current_position: currentPosition })
        .eq('id', id);

      if (error) throw error;
    },

    delete: async (id: string) => {
      const doc = await api.documents.getById(id);

      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([doc.file_path]);

      if (storageError) console.error('Storage delete error:', storageError);

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  }
};
