import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, FolderX, Link2, MoreHorizontal, Pencil, Plus, SearchX } from 'lucide-react';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui';
import { iconFor } from '../lib/icons';
import { matchesQuery, plural, relativeDate, sortLinks } from '../lib/utils';
import { Page, TopBar } from '../components/Layout';
import { Empty, SearchBar } from '../components/primitives';
import { LinkGrid, TagChips } from '../components/LinkList';

export function CollectionDetail() {
  const { id = '' } = useParams();
  const { collectionById, links } = useStore();
  const { openLink, openCollection, openCollectionActions } = useUI();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const c = collectionById(id);

  const items = useMemo(() => links.filter((l) => l.collection === id), [links, id]);
  const tags = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of items) for (const t of l.tags ?? []) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  if (!c) {
    return (
      <Page>
        <TopBar title="Coleção" />
        <div className="container">
          <Empty
            icon={<FolderX />}
            title="Coleção não encontrada"
            text="Ela pode ter sido excluída ou renomeada."
            action={<Link className="btn btn-secondary" to="/colecoes">Ver coleções</Link>}
          />
        </div>
      </Page>
    );
  }

  const Icon = iconFor(c.icon);
  const visible = items.filter((l) => (!tag || l.tags?.includes(tag)) && matchesQuery(l, q));
  const last = sortLinks(items, 'recent')[0];

  return (
    <Page>
      <TopBar title={c.name}>
        <button className="icon-btn glassy" onClick={() => openCollectionActions(c)} aria-label="Opções da coleção">
          <MoreHorizontal />
        </button>
      </TopBar>
      <div className="container" data-color={c.color}>
        <Link to="/colecoes" className="back">
          <ChevronLeft /> Coleções
        </Link>

        <section className="card hero">
          <div className="hero-top">
            <span className="hero-icon"><Icon /></span>
            <div style={{ minWidth: 0 }}>
              <div className="hero-kicker">Coleção</div>
              <h1 className="hero-title">{c.name}</h1>
              <div className="hero-meta">
                {plural(items.length, 'link', 'links')}
                {last && ` · atualizada ${relativeDate(last.addedAt).toLowerCase()}`}
              </div>
            </div>
          </div>
          {c.description && <p className="hero-desc">{c.description}</p>}
          <div className="hero-actions">
            <button className="hero-action primary" onClick={() => openLink({ collectionId: c.id })}>
              <Plus /> Novo link
            </button>
            <button className="hero-action" onClick={() => openCollection(c)}>
              <Pencil /> Editar
            </button>
            <button className="hero-action" onClick={() => openCollectionActions(c)}>
              <MoreHorizontal /> Mais
            </button>
          </div>
        </section>

        <SearchBar value={q} onChange={setQ} placeholder={`Buscar em ${c.name}…`} />
        <TagChips tags={tags} value={tag} onChange={setTag} />

        <LinkGrid
          links={visible}
          showCollection={false}
          empty={
            items.length === 0 ? (
              <Empty
                icon={<Link2 />}
                title="Nenhum link ainda"
                text={`Comece a montar a lista “${c.name}”.`}
                action={<button className="btn btn-primary" onClick={() => openLink({ collectionId: c.id })}><Plus /> Adicionar link</button>}
              />
            ) : (
              <Empty
                icon={<SearchX />}
                title="Nada encontrado"
                text="Tente outra palavra ou limpe o filtro de marcador."
                action={<button className="btn btn-secondary" onClick={() => { setQ(''); setTag(''); }}>Limpar filtros</button>}
              />
            )
          }
        />
      </div>
    </Page>
  );
}
