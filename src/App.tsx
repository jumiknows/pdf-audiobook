import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { DocumentLibrary } from './components/DocumentLibrary';
import { AudioPlayer } from './components/AudioPlayer';
import { LogOut } from 'lucide-react';

export interface Document {
  id: string;
  title: string;
  originalFilename: string;
  fileSize: number;
  summaryText: string;
  fullText?: string;
  currentPosition: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await api.auth.logout();
    setUser(null);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (selectedDocument) {
    return (
      <AudioPlayer
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">PDF Audiobook</h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </header>
      <DocumentLibrary onDocumentSelect={setSelectedDocument} />
    </div>
  );
}

export default App;
