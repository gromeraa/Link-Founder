import { useRef } from 'react';
import { motion } from 'motion/react';
import {
  Bookmark, ChevronRight, CloudUpload, Copy, Download, FolderClosed, Link2, Palette, RotateCcw, Upload,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { copyText, useUI } from '../lib/ui';
import type { Library, ThemeMode } from '../lib/types';
import { Page, TopBar } from '../components/Layout';
import { Segmented, softSpring } from '../components/primitives';
import { plural } from '../lib/utils';

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function isLibrary(x: unknown): x is Library {
  const l = x as Library;
  return !!l && Array.isArray(l.collections) && Array.isArray(l.links) &&
    l.collections.every((c) => typeof c.id === 'string' && typeof c.name === 'string') &&
    l.links.every((k) => typeof k.id === 'string' && typeof k.url === 'string' && typeof k.collection === 'string');
}

function Group({ title, children, note, delay = 0 }: { title: string; children: React.ReactNode; note?: React.ReactNode; delay?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay }}>
      <div className="overline">{title}</div>
      <div className="card group">{children}</div>
      {note && <p className="group-note">{note}</p>}
    </motion.section>
  );
}

export function Settings() {
  const store = useStore();
  const { prefs, setPrefs, links, collections, pendingChanges } = store;
  const { showToast, confirm } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const json = () => JSON.stringify(store.exportLibrary(), null, 2) + '\n';

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isLibrary(data)) throw new Error('formato');
      store.importLibrary(data);
      showToast(`${plural(data.links.length, 'link importado', 'links importados')}`);
    } catch {
      showToast('Arquivo inválido — use um library.json');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Page>
      <TopBar title="Ajustes" />
      <div className="container" style={{ maxWidth: 1040 }}>
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="large-title">Ajustes</h1>
            <p className="page-sub">Aparência, backup e publicação.</p>
          </div>
        </div>

        <div className="settings-cols">
          <div>
            <Group title="Aparência">
              <div className="row">
                <span className="row-icon" data-color="indigo"><Palette /></span>
                <div className="row-text"><div className="row-title">Tema</div></div>
              </div>
              <div style={{ padding: '0 16px 14px' }}>
                <Segmented<ThemeMode>
                  id="theme"
                  value={prefs.theme}
                  onChange={(theme) => setPrefs({ theme })}
                  options={[
                    { value: 'auto', label: 'Automático' },
                    { value: 'light', label: 'Claro' },
                    { value: 'dark', label: 'Escuro' },
                  ]}
                />
              </div>
            </Group>

            <Group title="Biblioteca" delay={0.05}>
              <div className="row">
                <span className="row-icon" data-color="blue"><Link2 /></span>
                <div className="row-text"><div className="row-title">Links</div></div>
                <span className="row-value">{links.length}</span>
              </div>
              <div className="row">
                <span className="row-icon" data-color="teal"><FolderClosed /></span>
                <div className="row-text"><div className="row-title">Coleções</div></div>
                <span className="row-value">{collections.length}</span>
              </div>
              <div className="row">
                <span className="row-icon" data-color="orange"><Bookmark /></span>
                <div className="row-text"><div className="row-title">Salvos</div></div>
                <span className="row-value">{links.filter((l) => l.favorite).length}</span>
              </div>
            </Group>
          </div>

          <div>
            <Group
              title="Publicar no site"
              delay={0.1}
              note={
                <>
                  O que você cria aqui fica salvo neste navegador. Para publicar para todo mundo (e em outros aparelhos):
                  baixe o <code>library.json</code>, substitua o arquivo <code>src/data/library.json</code> no GitHub e faça
                  commit — a Vercel publica sozinha em ~1 min.
                </>
              }
            >
              <div className="row">
                <span className="row-icon" data-color={pendingChanges ? 'orange' : 'green'}><CloudUpload /></span>
                <div className="row-text">
                  <div className="row-title">Alterações não publicadas</div>
                  <div className="row-sub">{pendingChanges ? 'Exporte para levar ao GitHub' : 'Tudo igual ao site publicado'}</div>
                </div>
                <span className="row-value" style={{ fontWeight: 600, color: pendingChanges ? 'var(--label)' : undefined }}>{pendingChanges}</span>
              </div>
              <button className="row" onClick={() => { download('library.json', json()); showToast('library.json baixado'); }}>
                <span className="row-icon" data-color="blue"><Download /></span>
                <div className="row-text"><div className="row-title">Baixar library.json</div></div>
                <ChevronRight className="row-chevron" />
              </button>
              <button className="row" onClick={async () => { if (await copyText(json())) showToast('JSON copiado'); }}>
                <span className="row-icon" data-color="indigo"><Copy /></span>
                <div className="row-text">
                  <div className="row-title">Copiar JSON</div>
                  <div className="row-sub">Para colar direto no editor do GitHub</div>
                </div>
                <ChevronRight className="row-chevron" />
              </button>
            </Group>

            <Group title="Backup" delay={0.15}>
              <button className="row" onClick={() => fileRef.current?.click()}>
                <span className="row-icon" data-color="green"><Upload /></span>
                <div className="row-text">
                  <div className="row-title">Importar library.json</div>
                  <div className="row-sub">Substitui a biblioteca neste navegador</div>
                </div>
                <ChevronRight className="row-chevron" />
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
              <button
                className="row danger"
                disabled={!pendingChanges}
                style={{ opacity: pendingChanges ? 1 : 0.45 }}
                onClick={() =>
                  confirm({
                    title: 'Descartar alterações?',
                    message: `As ${plural(pendingChanges, 'alteração local', 'alterações locais')} serão apagadas e a biblioteca volta a ser a publicada.`,
                    confirmLabel: 'Descartar',
                    onConfirm: () => { store.resetLocal(); showToast('Biblioteca restaurada'); },
                  })
                }
              >
                <span className="row-icon" data-color="red"><RotateCcw /></span>
                <div className="row-text"><div className="row-title">Descartar alterações locais</div></div>
              </button>
            </Group>
          </div>
        </div>

        <p className="footer-note">
          Curadoria · hospedado grátis no GitHub + Vercel
          <br />
          Atalho: pressione <b>/</b> para buscar
        </p>
      </div>
    </Page>
  );
}
