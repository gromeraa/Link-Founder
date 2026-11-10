import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, Clock, Layers, MoreHorizontal, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui';
import { iconFor } from '../lib/icons';
import { plural, relativeDate, sortLinks } from '../lib/utils';
import { Page, TopBar } from '../components/Layout';
import { Favicon, softSpring } from '../components/primitives';
import type { Collection } from '../lib/types';

function FolderCard({ c, index }: { c: Collection; index: number }) {
  const { links, canEdit } = useStore();
  const { openCollectionActions } = useUI();
  const Icon = iconFor(c.icon);
  const items = sortLinks(links.filter((l) => l.collection === c.id), 'recent');
  const last = items[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...softSpring, delay: index * 0.04 }}
      className="card folder-card"
      data-color={c.color}
    >
      <Link to={`/colecoes/${c.id}`} className="link-card-hit" aria-label={`Abrir ${c.name}`} />
      <div className="folder-preview">
        <span className="folder-badge"><Icon /></span>
        <div className="folder-favs">
          {items.slice(0, 3).map((l) => (
            <Favicon key={l.id} url={l.url} color={c.color} />
          ))}
        </div>
        <span className="folder-names">{items.length ? items.slice(0, 2).map((l) => l.title).join(', ') : 'Vazia'}</span>
      </div>
      <div className="folder-info">
        <div>
          <div className="folder-name">{c.name}</div>
          <div className="folder-count">
            {plural(items.length, 'link', 'links')}
            {last && ` · ${relativeDate(last.addedAt)}`}
          </div>
        </div>
        {canEdit && (
          <button className="icon-btn plain" aria-label={`Opções de ${c.name}`} onClick={() => openCollectionActions(c)}>
            <MoreHorizontal />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function Collections() {
  const { collections, links, setPrefs, canEdit } = useStore();
  const { openCollection } = useUI();
  const navigate = useNavigate();
  const favs = links.filter((l) => l.favorite).length;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recent = links.filter((l) => l.addedAt >= weekAgo).length;

  const smart = [
    { label: 'Todos', sub: 'Visão geral', n: links.length, icon: Layers, color: 'blue', to: '/' },
    { label: 'Salvos', sub: 'Favoritos', n: favs, icon: Bookmark, color: 'orange', to: '/salvos' },
    { label: 'Recentes', sub: 'Últimos 7 dias', n: recent, icon: Clock, color: 'indigo', to: '/' },
  ];

  return (
    <Page>
      <TopBar title="Coleções" />
      <div className="container">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="large-title">Coleções</h1>
            <p className="page-sub">
              {plural(collections.length, 'coleção', 'coleções')} · {plural(links.length, 'link curado', 'links curados')}
            </p>
          </div>
          {canEdit && (
            <motion.button whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={() => openCollection()}>
              <Plus /> Nova
            </motion.button>
          )}
        </div>

        <div className="overline">Pastas inteligentes</div>
        <div className="smart-grid">
          {smart.map((s, i) => (
            <motion.button
              key={s.label}
              className="card smart-tile"
              data-color={s.color}
              onClick={() => {
                if (s.label === 'Recentes') setPrefs({ sort: 'recent' });
                navigate(s.to);
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...softSpring, delay: i * 0.05 }}
            >
              <div className="smart-top">
                <span className="smart-icon"><s.icon /></span>
                <span className="smart-count">{s.n}</span>
              </div>
              <span className="smart-name">{s.label}</span>
              <span className="smart-sub">{s.sub}</span>
            </motion.button>
          ))}
        </div>

        <div className="section-head">
          <h2 className="section-title">
            Minhas coleções <span className="count">{collections.length}</span>
          </h2>
        </div>
        <div className="folder-grid">
          {collections.map((c, i) => (
            <FolderCard key={c.id} c={c} index={i} />
          ))}
          {canEdit && (
          <motion.button
            layout
            className="new-folder"
            onClick={() => openCollection()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: collections.length * 0.04 }}
          >
            <span><Plus /></span>
            Nova coleção
          </motion.button>
          )}
        </div>
      </div>
    </Page>
  );
}
