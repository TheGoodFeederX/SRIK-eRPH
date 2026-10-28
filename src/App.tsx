import { useState } from 'react';
import { useRecords } from './hooks/useRecords';
import { RPHForm } from './components/RPHForm';
import { RPHRecords } from './components/RPHRecords';
import { DSKPManager } from './components/DSKPManager';
import { AdminPanel } from './components/AdminPanel';
import type { Tab, RPHRecord } from './types';
import { List, PlusCircle, LogOut, Settings as SettingsIcon, Database, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { Settings as SettingsComponent } from './components/Settings';
import { errorMessage } from './lib/apiClient';

function AppContent() {
  const { user, profile, signOut, loading: authLoading, error: authError, refresh } = useAuth();
  const {
    records,
    loading,
    error: recordsError,
    totalCount,
    page,
    setPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    addRecord,
    updateRecord,
    deleteRecord
  } = useRecords();
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [editingRecord, setEditingRecord] = useState<RPHRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Memuatkan...</p>
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Sambungan pelayan gagal</h2>
          <p style={{ marginBottom: '1rem' }}>{authError}</p>
          <button onClick={() => void refresh()} className="btn btn-primary">Cuba lagi</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = profile?.role === 'admin' && profile.status === 'active';
  const isActive = profile?.status === 'active';

  const handleEdit = (record: RPHRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  const handleSubmit = async (data: Omit<RPHRecord, 'id'>) => {
    setSubmitError(null);
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, data);
        setEditingRecord(null);
      } else {
        await addRecord(data);
      }
      setActiveTab('records');
    } catch (err) {
      setSubmitError(errorMessage(err));
    }
  };

  return (
    <div className="container font-jawi">
      <header style={{ marginBottom: '3rem', textAlign: 'center', position: 'relative' }} className="no-print">
        <div style={{ position: 'absolute', right: 0, top: 0 }}>
          <button
            onClick={() => void signOut()}
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
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: 600, marginTop: '1rem' }}
        >
          Selamat Kembali, {profile?.name || user.name || user.email.split('@')[0]}.
        </motion.p>
      </header>

      {!isActive ? (
        <main className="no-print" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Akaun menunggu kelulusan</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
            Akaun anda telah didaftarkan tetapi belum diluluskan oleh pentadbir sekolah.
            Sila hubungi pentadbir untuk pengaktifan akses.
          </p>
        </main>
      ) : (
        <>
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
                className={`tab ${activeTab === 'dskp' ? 'active' : ''}`}
                onClick={() => setActiveTab('dskp')}
              >
                <Database size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                DSKP
              </button>
              <button
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <SettingsIcon size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Tetapan
              </button>
              {isAdmin && (
                <button
                  className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  <ShieldCheck size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Pengguna
                </button>
              )}
            </div>
          </div>

          {(submitError || recordsError) && (
            <div role="alert" className="no-print" style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              {submitError ?? recordsError}
            </div>
          )}

          <main className="no-print">
            <AnimatePresence mode="wait">
              {activeTab === 'form' ? (
                <RPHForm
                  key="form"
                  currentUserId={user.id}
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
                  totalCount={totalCount}
                  page={page}
                  setPage={setPage}
                  pageSize={pageSize}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onDelete={deleteRecord}
                  onEdit={handleEdit}
                />
              ) : activeTab === 'dskp' ? (
                <DSKPManager key="dskp" isAdmin={isAdmin} />
              ) : activeTab === 'admin' && isAdmin ? (
                <AdminPanel key="admin" />
              ) : (
                <SettingsComponent key="settings" />
              )}
            </AnimatePresence>
          </main>
        </>
      )}

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
