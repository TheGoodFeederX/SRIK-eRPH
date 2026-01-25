import { useState } from 'react';
import { useRecords } from './hooks/useRecords';
import { RPHForm } from './components/RPHForm';
import { RPHRecords } from './components/RPHRecords';
import { DSKPManager } from './components/DSKPManager';
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
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Sambungan gagal.</h2>
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
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Menyemak sambungan...</p>
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
      <header style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }} className="no-print">
        <div style={{
          position: 'absolute',
          right: '-0.5rem',
          top: '-0.5rem',
          zIndex: 10
        }}>
          <button
            onClick={signOut}
            title="Log Keluar"
            className="logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={18} />
            <span className="logout-text" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Log Keluar</span>
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}
        >
          <div style={{ backgroundColor: 'white', padding: '0.4rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo SRI Al-Khairiah" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', textAlign: 'left', lineHeight: 1.1 }}>
            eRPH <span style={{ color: 'var(--primary)', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>SRI Al-Khairiah</span>
          </h1>
        </motion.div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aplikasi Rekod Pengajaran Harian</p>

        {/* Desktop Title Layout (Hidden on mobile via simple JS or CSS if needed, but let's make it responsive) */}
        <style>{`
          @media (min-width: 768px) {
            header { margin-bottom: 3.5rem !important; }
            h1 { fontSize: 2.25rem !important; lineHeight: 1.2 !important; }
            h1 span { display: inline !important; fontSize: inherit !important; }
            img { width: 60px !important; height: 60px !important; }
            header p { fontSize: 1.1rem !important; }
            .logout-btn { 
              padding: 0.5rem 1rem !important; 
              width: auto !important; 
              height: auto !important; 
              border-radius: 0.5rem !important;
              gap: 0.5rem;
            }
            .logout-text { display: inline !important; }
          }
          .logout-text { display: none; }
        `}</style>

        {user && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: 'var(--primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginTop: '0.75rem'
            }}
          >
            Hai, {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cikgu'}.
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
              onCancel={() => {
                setEditingRecord(null);
                setActiveTab('records');
              }}
              initialData={editingRecord || undefined}
            />
          ) : activeTab === 'records' ? (
            <RPHRecords
              key="records"
              records={records}
              loading={loading}
              onDelete={deleteRecord}
              onEdit={handleEdit}
            />
          ) : activeTab === 'dskp' ? (
            <DSKPManager key="dskp" />
          ) : (
            <SettingsComponent key="settings" />
          )}
        </AnimatePresence>
      </main>

      {/* PDF Functionality Removed */}

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
