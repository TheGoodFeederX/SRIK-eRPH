import { useState } from 'react';
import { useRecords } from './hooks/useRecords';
import { RPHForm } from './components/RPHForm';
import { RPHRecords } from './components/RPHRecords';
import { DSKPManager } from './components/DSKPManager';
import { PrintPreview } from './components/PrintPreview';
import type { Tab, RPHRecord } from './types';
import { List, PlusCircle, LogOut, Settings as SettingsIcon, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Settings as SettingsComponent } from './components/Settings';

function AppContent() {
  const { user, signOut, loading: authLoading, hasCredentials, connectionStatus, connectionError } = useAuth();
  console.log('AppContent: Render', { user: !!user, authLoading, connectionStatus, connectionError });
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRecords();
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [editingRecord, setEditingRecord] = useState<RPHRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<RPHRecord | null>(null);

  if (!hasCredentials) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Configuration Error</h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            Supabase credentials are missing. Please create a <code style={{ backgroundColor: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>.env</code> file in the project root with the following variables:
          </p>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'left',
            overflowX: 'auto'
          }}>
            {`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
          </pre>
          <p style={{ color: '#991b1b', marginTop: '1rem', fontSize: '0.875rem' }}>
            After adding the environment variables, restart the development server.
          </p>
        </div>
      </div>
    );
  }

  // Show connection error if present
  if (connectionStatus === 'error' && connectionError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Connection Error</h2>
          <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
            {connectionError}
          </p>
          <p style={{ color: '#991b1b', marginTop: '1rem', fontSize: '0.875rem' }}>
            Please check your <code style={{ backgroundColor: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>.env</code> file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading || connectionStatus === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.5rem' }}>Memuatkan...</p>
          {connectionStatus === 'checking' && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Testing Supabase connection...</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSubmit = (data: Omit<RPHRecord, 'id'>) => {
    if (editingRecord) {
      updateRecord(editingRecord.id, data);
      setEditingRecord(null);
      setActiveTab('records');
    } else {
      addRecord(data);
      setActiveTab('records');
    }
  };

  const handleEdit = (record: RPHRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem', textAlign: 'center', position: 'relative' }} className="no-print">
        <div style={{ position: 'absolute', right: 0, top: 0 }}>
          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            <LogOut size={16} /> Log Keluar
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}
        >
          <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo SRI Al-Khairiah" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', textAlign: 'left' }}>
            eRPH <span style={{ color: 'var(--primary)' }}>SRI Al-Khairiah</span>
          </h1>
        </motion.div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Rekod Pengajaran Harian Digital</p>
        {user && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: 'var(--primary)',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: '1rem'
            }}
          >
            Selamat Kembali, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna'}.
          </motion.p>
        )}
      </header>

      <div className="no-print">
        <div className="tab-container">
          <button
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('form');
              setEditingRecord(null);
            }}
          >
            <PlusCircle size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {editingRecord ? 'Kemaskini Rekod' : 'Rekod Baru'}
          </button>
          <button
            className={`tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <List size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Senarai Rekod
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Tetapan
          </button>
          <button
            className={`tab ${activeTab === 'dskp' ? 'active' : ''}`}
            onClick={() => setActiveTab('dskp')}
          >
            <Database size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
            DSKP
          </button>
        </div>
      </div>

      <main className="no-print">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <RPHForm
              key="form"
              onSubmit={handleSubmit}
              initialData={editingRecord || undefined}
            />
          ) : activeTab === 'records' ? (
            <RPHRecords
              key="records"
              records={records}
              loading={loading}
              onDelete={deleteRecord}
              onEdit={handleEdit}
              onPrint={setPrintingRecord}
            />
          ) : activeTab === 'dskp' ? (
            <DSKPManager key="dskp" />
          ) : (
            <SettingsComponent key="settings" />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {printingRecord && (
          <PrintPreview
            record={printingRecord}
            onClose={() => setPrintingRecord(null)}
          />
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }} className="no-print">
        &copy; {new Date().getFullYear()} eRPH SRI Al-Khairiah. Dibina oleh Cikgu Najmi. Hak Cipta Terpelihara.
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
