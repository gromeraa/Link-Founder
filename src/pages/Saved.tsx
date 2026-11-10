import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, SearchX } from 'lucide-react';
import { useStore } from '../lib/store';
import { matchesQuery } from '../lib/utils';
import { Page, TopBar } from '../components/Layout';
import { Empty, SearchBar } from '../components/primitives';
import { LinkGrid } from '../components/LinkList';

export function Saved() {
  const { links, collectionById } = useStore();
  const [q, setQ] = useState('');
  const favs = links.filter((l) => l.favorite);
  const visible = favs.filter((l) => matchesQuery(l, q, collectionById(l.collection)?.name));

  return (
    <Page>
      <TopBar title="Salvos" />
      <div className="container">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="large-title">Salvos</h1>
            <p className="page-sub">Seus links favoritos, de todas as coleções.</p>
          </div>
        </div>
        {favs.length > 0 && <SearchBar value={q} onChange={setQ} placeholder="Buscar nos salvos…" />}
        <LinkGrid
          links={visible}
          empty={
            favs.length === 0 ? (
              <Empty
                icon={<Bookmark />}
                title="Nenhum link salvo"
                text="Toque no ícone de marcador em qualquer card para guardar aqui."
                action={<Link to="/" className="btn btn-secondary">Explorar links</Link>}
              />
            ) : (
              <Empty icon={<SearchX />} title="Nada encontrado" text={`Nenhum salvo corresponde a “${q}”.`} />
            )
          }
        />
      </div>
    </Page>
  );
}
