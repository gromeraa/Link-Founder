import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useStore } from './lib/store';
import { useUI } from './lib/ui';
import { Ambient, Sidebar, TabBar, Toast } from './components/Layout';
import { SheetHost } from './components/Sheets';
import { useMediaQuery } from './components/primitives';
import { Explore } from './pages/Explore';
import { Collections } from './pages/Collections';
import { CollectionDetail } from './pages/CollectionDetail';
import { Saved } from './pages/Saved';
import { Settings } from './pages/Settings';

function useTheme() {
  const { prefs } = useStore();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && prefersDark);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#F2F2F7');
  }, [dark]);
}

export default function App() {
  useTheme();
  const location = useLocation();
  const { openLink } = useUI();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Atalho "n" = novo link
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' && !document.querySelector('.sheet')) {
        e.preventDefault();
        openLink();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openLink]);

  const showFab = location.pathname.startsWith('/colecoes/');

  return (
    <>
      <Ambient />
      <div className="app">
        <Sidebar />
        <main className="main">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Explore />} />
              <Route path="/colecoes" element={<Collections />} />
              <Route path="/colecoes/:id" element={<CollectionDetail />} />
              <Route path="/salvos" element={<Saved />} />
              <Route path="/ajustes" element={<Settings />} />
              <Route path="*" element={<Explore />} />
            </Routes>
          </AnimatePresence>
        </main>
        <AnimatePresence>
          {showFab && (
            <motion.button
              className="fab"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => openLink({ collectionId: location.pathname.split('/')[2] })}
            >
              <Plus /> Novo link
            </motion.button>
          )}
        </AnimatePresence>
        <TabBar />
      </div>
      <SheetHost />
      <Toast />
    </>
  );
}
