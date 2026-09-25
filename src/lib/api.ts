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
        const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
          'summarize-text',
          {
            body: { text, maxLength: 500 },
          }
        );

        if (summaryError) {
          throw summaryError;
        }

        if (summaryData?.summary) {
          await supabase
            .from('documents')
            .update({ summary_text: summaryData.summary })
            .eq('id', doc.id);

          doc.summary_text = summaryData.summary;
        }
      } catch {
        console.error('Failed to generate summary');
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
    },

    regenerateSummary: async (id: string, maxLength: number = 500) => {
      const doc = await api.documents.getById(id);

      if (!doc.full_text) {
        throw new Error('Document has no text to summarize');
      }

      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'summarize-text',
        {
          body: { text: doc.full_text, maxLength },
        }
      );

      if (summaryError) {
        throw new Error('Failed to regenerate summary');
      }

      if (summaryData?.summary) {
        await supabase
          .from('documents')
          .update({ summary_text: summaryData.summary })
          .eq('id', id);

        return summaryData.summary;
      }

      throw new Error('No summary returned');
    }
  }
};
