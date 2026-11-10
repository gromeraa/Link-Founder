import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, Link2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui';
import { matchesQuery } from '../lib/utils';
import { Page, TopBar } from '../components/Layout';
import { Empty, SearchBar } from '../components/primitives';
import { CollectionChips, LinkGrid } from '../components/LinkList';

export function Explore() {
  const { links, collections, collectionById, canEdit } = useStore();
  const { openCollection, openLink } = useUI();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const filter = params.get('c') ?? 'all';
  const active = filter !== 'all' && collectionById(filter) ? filter : 'all';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && !(key === 'c' && value === 'all')) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // links que batem com a busca (antes do filtro de coleção) → contadores dos chips
  const searched = useMemo(
    () => links.filter((l) => matchesQuery(l, q, collectionById(l.collection)?.name)),
    [links, q, collectionById],
  );
  const counts = useMemo(() => {
    const m = new Map<string, number>([['all', searched.length]]);
    for (const l of searched) m.set(l.collection, (m.get(l.collection) ?? 0) + 1);
    return m;
  }, [searched]);
  const visible = active === 'all' ? searched : searched.filter((l) => l.collection === active);

  return (
    <Page>
      <TopBar title="Explorar" />
      <div className="container">
        <div className="page-head">
          <div className="page-head-text">
            <h1 className="large-title">Explorar</h1>
            <p className="page-sub">
              {links.length} links em {collections.length} coleções
            </p>
          </div>
        </div>
        <SearchBar value={q} onChange={(v) => set('q', v)} placeholder="Buscar links ou #tags…" shortcut />
        <div style={{ marginTop: 12 }}>
          <CollectionChips value={active} onChange={(id) => set('c', id)} onAdd={canEdit ? () => openCollection() : undefined} counts={counts} />
        </div>
        <LinkGrid
          links={visible}
          showCollection={active === 'all'}
          empty={
            q ? (
              <Empty
                icon={<SearchX />}
                title="Nada encontrado"
                text={`Nenhum link corresponde a “${q}”${active !== 'all' ? ' nesta coleção' : ''}.`}
                action={<button className="btn btn-secondary" onClick={() => set('q', '')}>Limpar busca</button>}
              />
            ) : (
              <Empty
                icon={<Link2 />}
                title="Coleção vazia"
                text={canEdit ? 'Adicione o primeiro link desta lista.' : 'Ainda não há links nesta lista.'}
                action={
                  canEdit && <button className="btn btn-primary" onClick={() => openLink({ collectionId: active === 'all' ? undefined : active })}>
                    Adicionar link
                  </button>
                }
              />
            )
          }
        />
      </div>
    </Page>
  );
}
