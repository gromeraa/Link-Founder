import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
  Bookmark, ChevronRight, Cloud, KeyRound, Lock, UserRound, Copy, Download, FolderClosed, Link2, LogOut, Palette, RefreshCw, Upload,
} from 'lucide-react';
import { APP_NAME } from '../lib/config';
import { useStore } from '../lib/store';
import { copyText, useUI } from '../lib/ui';
import type { Library, ThemeMode } from '../lib/types';
import type { ReactNode } from 'react';
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

function timeAgo(t: number, now: number) {
  const s = Math.round((now - t) / 1000);
  if (s < 15) return 'agora mesmo';
  if (s < 60) return `há ${s} s`;
  const m = Math.round(s / 60);
  return m < 60 ? `há ${m} min` : `às ${new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function isLibrary(x: unknown): x is Library {
  const l = x as Library;
  return !!l && Array.isArray(l.collections) && Array.isArray(l.links) &&
    l.collections.every((c) => typeof c.id === 'string' && typeof c.name === 'string') &&
    l.links.every((k) => typeof k.id === 'string' && typeof k.url === 'string' && typeof k.collection === 'string');
}

function Group({ title, children, note, delay = 0 }: { title: string; children: ReactNode; note?: ReactNode; delay?: number }) {
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
  const { prefs, setPrefs, links, collections, syncing, lastSync, refresh, user, logout, canEdit } = store;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);
  const { showToast, confirm, openLogin, openPassword } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const json = () => JSON.stringify(store.exportLibrary(), null, 2) + '\n';

  const onImport = async (file?: File) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      data = null;
    }
    if (!isLibrary(data)) {
      showToast('Arquivo inválido: escolha um backup .json do Link Founder', 'error');
      return;
    }
    const lib = data;
    confirm({
      title: 'Restaurar backup?',
      message: `A biblioteca atual será trocada por ${plural(lib.links.length, 'link', 'links')} e ${plural(lib.collections.length, 'coleção', 'coleções')}, para todos que usam.`,
      confirmLabel: 'Restaurar',
      onConfirm: async () => {
        await store.importLibrary(lib);
        showToast('Backup restaurado');
      },
    });
  };

  return (
    <Page>
      <TopBar title="Ajustes" />
      <div className="container" style={{ maxWidth: 1040 }}>
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="large-title">Ajustes</h1>
            <p className="page-sub">Aparência, compartilhamento e backup.</p>
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
            {!canEdit && (
              <Group
                title="Conta"
                delay={0.1}
                note="Qualquer pessoa com o link pode ver. Só quem tem conta adiciona, edita e apaga."
              >
                <button className="row" onClick={() => openLogin()}>
                  <span className="row-icon" data-color="blue"><KeyRound /></span>
                  <div className="row-text">
                    <div className="row-title">Entrar</div>
                    <div className="row-sub">Com seu e-mail e senha</div>
                  </div>
                  <ChevronRight className="row-chevron" />
                </button>
              </Group>
            )}

            {canEdit && <Group
              title="Conta"
              delay={0.1}
              note="Qualquer pessoa com o link vê os links; só quem tem conta edita. As mudanças aparecem nos outros aparelhos em até 30 segundos."
            >
              <div className="row">
                <span className="row-icon" data-color={syncing ? 'blue' : 'green'}>
                  <Cloud />
                </span>
                <div className="row-text">
                  <div className="row-title">{syncing ? 'Sincronizando…' : 'Sincronizado'}</div>
                  <div className="row-sub">{lastSync ? `Atualizado ${timeAgo(lastSync, now)}` : 'Aguardando servidor'}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={async () => { await refresh(); showToast('Links atualizados'); }}>
                  <RefreshCw /> Atualizar
                </button>
              </div>
              <div className="row">
                <span className="row-icon" data-color="indigo"><UserRound /></span>
                <div className="row-text">
                  <div className="row-title">{user?.name ?? 'Conectado'}</div>
                  <div className="row-sub">{user?.email}</div>
                </div>
              </div>
              <button className="row" onClick={() => openPassword()}>
                <span className="row-icon" data-color="gray"><Lock /></span>
                <div className="row-text"><div className="row-title">Alterar senha</div></div>
                <ChevronRight className="row-chevron" />
              </button>
              <button
                className="row danger"
                onClick={() =>
                  confirm({
                    title: 'Sair da conta?',
                    message: 'Neste aparelho você continua vendo os links. Para editar, entre de novo com e-mail e senha.',
                    confirmLabel: 'Sair',
                    onConfirm: logout,
                  })
                }
              >
                <span className="row-icon" data-color="red"><LogOut /></span>
                <div className="row-text"><div className="row-title">Sair da conta</div></div>
              </button>
            </Group>}

            {canEdit && <Group title="Backup" delay={0.15}>
              <button className="row" onClick={() => { download(`link-founder-${new Date().toISOString().slice(0, 10)}.json`, json()); showToast('Backup baixado'); }}>
                <span className="row-icon" data-color="blue"><Download /></span>
                <div className="row-text">
                  <div className="row-title">Baixar backup (.json)</div>
                  <div className="row-sub">Cópia de todos os links e coleções</div>
                </div>
                <ChevronRight className="row-chevron" />
              </button>
              <button className="row" onClick={async () => { if (await copyText(json())) showToast('JSON copiado'); }}>
                <span className="row-icon" data-color="indigo"><Copy /></span>
                <div className="row-text"><div className="row-title">Copiar JSON</div></div>
                <ChevronRight className="row-chevron" />
              </button>
              <button className="row" onClick={() => fileRef.current?.click()}>
                <span className="row-icon" data-color="orange"><Upload /></span>
                <div className="row-text">
                  <div className="row-title">Restaurar backup</div>
                  <div className="row-sub">Substitui a biblioteca inteira, para todos</div>
                </div>
                <ChevronRight className="row-chevron" />
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
            </Group>}
          </div>
        </div>

        <p className="footer-note">
          {APP_NAME} · hospedado grátis no GitHub + Vercel
          <br />
          Atalho: pressione <b>/</b> para buscar
        </p>
      </div>
    </Page>
  );
}
