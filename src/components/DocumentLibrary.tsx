import { useState, useEffect } from 'react';
import { FileText, Loader2, Trash2, Upload, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { UploadModal } from './UploadModal';

interface Document {
  id: string;
  title: string;
  original_filename: string;
  summary_text: string | null;
  processing_status: string;
}

interface DocumentLibraryProps {
  onDocumentSelect: (document: Document) => void;
}

export function DocumentLibrary({ onDocumentSelect }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await api.documents.getAll();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const interval = setInterval(fetchDocuments, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  const deleteDocument = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete "${doc.title}"?`)) return;

    try {
      await api.documents.delete(doc.id);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDocumentClick = async (doc: Document) => {
    if (doc.processing_status !== 'completed') {
      alert('This document is still being processed. Please wait.');
      return;
    }

    if (!doc.summary_text) {
      alert('Document processing incomplete. Please wait.');
      return;
    }

    onDocumentSelect(doc as any);
  };

  const regenerateSummary = async (doc: Document, e: React.MouseEvent, length: number) => {
    e.stopPropagation();

    setRegeneratingId(doc.id);
    try {
      await api.documents.regenerateSummary(doc.id, length);
      await fetchDocuments();
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('Failed to regenerate summary. Please ensure Hugging Face API is configured.');
    } finally {
      setRegeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Audiobooks</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Upload PDFs and listen to AI-powered summaries by Hugging Face BART
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Upload className="w-5 h-5" />
            Upload PDF
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Upload your first PDF to get started</p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleDocumentClick(doc)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-10 h-10 text-blue-600" />
                    <button
                      onClick={(e) => deleteDocument(doc, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{doc.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{doc.original_filename}</p>

                  {doc.processing_status !== 'completed' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-600">Processing...</span>
                    </div>
                  )}

                  {doc.processing_status === 'completed' && doc.summary_text && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">AI Summary Ready</span>
                      </div>

                      {regeneratingId === doc.id ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Regenerating...
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => regenerateSummary(doc, e, 300)}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            Short
                          </button>
                          <button
                            onClick={(e) => regenerateSummary(doc, e, 500)}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            Medium
                          </button>
                          <button
                            onClick={(e) => regenerateSummary(doc, e, 800)}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            Long
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={fetchDocuments}
        />
      )}
    </>
  );
}
