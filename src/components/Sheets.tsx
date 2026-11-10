import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark, Check, ChevronDown, ClipboardPaste, Copy, ExternalLink, FolderInput, Link2, Pencil,
  Share, Trash2, CheckCircle2,
} from 'lucide-react';
import { Sheet } from './Sheet';
import { LoginSheet } from './Gate';
import { Favicon, Switch, spring } from './primitives';
import { useStore } from '../lib/store';
import { copyText, useUI } from '../lib/ui';
import { COLOR_NAMES, COLORS, ICONS, iconFor } from '../lib/icons';
import type { Collection, ColorName, LinkItem } from '../lib/types';
import { domainOf, isValidUrl, normalizeUrl, plural, todayISO, uniqueId } from '../lib/utils';

/* ------------------------------------------------------------------ */
/* Adicionar / editar link                                             */
/* ------------------------------------------------------------------ */
function titleFromDomain(url: string) {
  const d = domainOf(url).split('.')[0] ?? '';
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : '';
}

function LinkForm({ link, collectionId }: { link?: LinkItem; collectionId?: string }) {
  const { collections, links, saveLink, collectionById } = useStore();
  const { close, showToast, openCollection } = useUI();
  const editing = !!link;

  const [url, setUrl] = useState(link?.url ?? '');
  const [title, setTitle] = useState(link?.title ?? '');
  const [description, setDescription] = useState(link?.description ?? '');
  const [collection, setCollection] = useState(link?.collection ?? collectionId ?? collections[0]?.id ?? '');
  const [tags, setTags] = useState((link?.tags ?? []).join(', '));
  const [favorite, setFavorite] = useState(!!link?.favorite);
  const [touched, setTouched] = useState(false);

  const valid = isValidUrl(url);
  const normalized = valid ? normalizeUrl(url) : '';
  const duplicate = useMemo(() => {
    if (!valid) return undefined;
    const clean = (u: string) => normalizeUrl(u).replace(/\/+$/, '').replace('://www.', '://').toLowerCase();
    return links.find((l) => l.id !== link?.id && clean(l.url) === clean(normalized));
  }, [valid, normalized, links, link?.id]);
  const canSave = valid && !!collection;

  const paste = async () => {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      if (t) {
        setUrl(t);
        if (!title && isValidUrl(t)) setTitle(titleFromDomain(normalizeUrl(t)));
      }
    } catch {
      showToast('Permita o acesso à área de transferência');
    }
  };

  const save = () => {
    setTouched(true);
    if (!canSave) return;
    const taken = new Set(links.map((l) => l.id));
    const finalTitle = title.trim() || titleFromDomain(normalized);
    const item: LinkItem = {
      id: link?.id ?? uniqueId(finalTitle, taken),
      url: normalized,
      title: finalTitle,
      description: description.trim() || undefined,
      collection,
      tags: tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
      addedAt: link?.addedAt ?? todayISO(),
      favorite: favorite || undefined,
    };
    saveLink(item);
    close();
    showToast(editing ? 'Link atualizado' : `Adicionado em ${collectionById(collection)?.name ?? ''}`);
  };

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Editar link' : 'Novo link'}
      left={<button className="btn-ghost btn cancel" onClick={close}>Cancelar</button>}
      right={<button className="btn-ghost btn" onClick={save} disabled={!canSave}>{editing ? 'Salvar' : 'Adicionar'}</button>}
      footer={
        <button className="btn btn-primary btn-block" onClick={save} disabled={!canSave}>
          <CheckCircle2 /> {editing ? 'Salvar alterações' : 'Salvar link'}
        </button>
      }
    >
      <form className="sheet-body" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="field">
          <label className="field-label" htmlFor="f-url">URL do link</label>
          <div className="input-wrap">
            <Link2 />
            <input
              id="f-url"
              className="input with-action"
              type="url"
              inputMode="url"
              placeholder="https://exemplo.com"
              value={url}
              autoFocus={!editing && window.matchMedia('(min-width: 640px)').matches}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                setTouched(true);
                if (!title && isValidUrl(url)) setTitle(titleFromDomain(normalizeUrl(url)));
              }}
            />
            <button type="button" className="input-action" onClick={paste}>
              <ClipboardPaste /> Colar
            </button>
          </div>
          {touched && url && !valid && <span className="field-error">Digite um endereço válido, ex.: github.com</span>}
          {duplicate && (
            <span className="field-hint">
              Esse link já está em “{collectionById(duplicate.collection)?.name}” como “{duplicate.title}”.
            </span>
          )}
        </div>

        <AnimatePresence initial={false}>
          {valid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              style={{ overflow: 'hidden' }}
            >
              <div className="preview">
                <Favicon url={normalized} color={collectionById(collection)?.color} size="lg" />
                <div className="preview-text">
                  <div className="preview-status">
                    <i /> {domainOf(normalized)} · <b>Prévia</b>
                  </div>
                  <div className="preview-title">{title || titleFromDomain(normalized)}</div>
                  {description && <div className="domain">{description}</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="field">
          <label className="field-label" htmlFor="f-title">Título</label>
          <input id="f-title" className="input" placeholder="Nome que vai aparecer no card" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <span className="field-label">Coleção</span>
          <div className="chips" role="radiogroup" aria-label="Coleção">
            {collections.map((c) => {
              const Icon = iconFor(c.icon);
              const active = c.id === collection;
              return (
                <button type="button" key={c.id} role="radio" aria-checked={active} className={`chip ${active ? 'active' : ''}`} data-color={c.color} onClick={() => setCollection(c.id)}>
                  {active && <motion.span layoutId="form-chip" className="chip-bg" transition={spring} />}
                  <Icon /> {c.name}
                </button>
              );
            })}
            <button type="button" className="chip add" onClick={() => openCollection()}>+ Nova</button>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="f-desc">Descrição / notas</label>
          <textarea id="f-desc" className="textarea" placeholder="Por que esse link é útil?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="f-tags">Marcadores</label>
          <input id="f-tags" className="input" placeholder="ui, grátis, estudos" value={tags} onChange={(e) => setTags(e.target.value)} />
          <span className="field-hint">Separe por vírgula. Eles entram na busca e viram filtros dentro da coleção.</span>
        </div>

        <div className="card group" style={{ boxShadow: 'none' }}>
          <div className="row">
            <span className="row-icon" data-color="blue"><Bookmark /></span>
            <div className="row-text">
              <div className="row-title">Salvar nos favoritos</div>
              <div className="row-sub">Aparece na aba Salvos</div>
            </div>
            <Switch on={favorite} onChange={setFavorite} label="Salvar nos favoritos" />
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Criar / editar coleção (= novo "tipo de filtro")                    */
/* ------------------------------------------------------------------ */
function CollectionForm({ collection }: { collection?: Collection }) {
  const { collections, saveCollection } = useStore();
  const { close, showToast } = useUI();
  const editing = !!collection;
  const [name, setName] = useState(collection?.name ?? '');
  const [description, setDescription] = useState(collection?.description ?? '');
  const [icon, setIcon] = useState(collection?.icon ?? 'folder');
  const [color, setColor] = useState<ColorName>(collection?.color ?? 'blue');
  const Icon = iconFor(icon);
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const id = collection?.id ?? uniqueId(name, new Set(collections.map((c) => c.id)));
    saveCollection({ id, name: name.trim(), description: description.trim() || undefined, icon, color });
    close();
    showToast(editing ? 'Coleção atualizada' : `Coleção “${name.trim()}” criada`);
  };

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Editar coleção' : 'Nova coleção'}
      left={<button className="btn-ghost btn cancel" onClick={close}>Cancelar</button>}
      right={<button className="btn-ghost btn" onClick={save} disabled={!canSave}>{editing ? 'Salvar' : 'Criar'}</button>}
      footer={
        <button className="btn btn-primary btn-block" onClick={save} disabled={!canSave}>
          <CheckCircle2 /> {editing ? 'Salvar coleção' : 'Criar coleção'}
        </button>
      }
    >
      <form className="sheet-body" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="preview-col" data-color={color}>
          <motion.span key={icon + color} initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={spring} className="hero-icon">
            <Icon />
          </motion.span>
          <div className="preview-text">
            <div className="preview-title" style={{ fontSize: 17 }}>{name || 'Nome da coleção'}</div>
            <div className="domain">{description || 'Vira um filtro na tela inicial'}</div>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="c-name">Nome</label>
          <input id="c-name" className="input" placeholder="Ex.: Sites de IA" value={name} onChange={(e) => setName(e.target.value)} autoFocus={window.matchMedia('(min-width: 640px)').matches} maxLength={40} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="c-desc">Descrição (opcional)</label>
          <input id="c-desc" className="input" placeholder="Do que se trata essa lista?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Cor</span>
          <div className="swatches" role="radiogroup" aria-label="Cor">
            {COLOR_NAMES.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={COLORS[c].label} data-color={c} className={`swatch ${c === color ? 'on' : ''}`} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Ícone</span>
          <div className="picker" role="radiogroup" aria-label="Ícone" data-color={color}>
            {Object.entries(ICONS).map(([key, I]) => (
              <button type="button" key={key} role="radio" aria-checked={key === icon} aria-label={key} className={`pick ${key === icon ? 'on' : ''}`} onClick={() => setIcon(key)}>
                <I />
              </button>
            ))}
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Ações de um link                                                    */
/* ------------------------------------------------------------------ */
function LinkActions({ link }: { link: LinkItem }) {
  const { collections, collectionById, toggleFavorite, saveLink, deleteLink, links, canEdit } = useStore();
  const { close, showToast, openLink, confirm } = useUI();
  const [moving, setMoving] = useState(false);
  const current = links.find((l) => l.id === link.id) ?? link;
  const col = collectionById(current.collection);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: current.title, url: current.url });
      } catch { /* cancelado */ }
    } else if (await copyText(current.url)) {
      showToast('Link copiado');
    }
    close();
  };

  return (
    <Sheet
      open
      onClose={close}
      label={`Ações de ${current.title}`}
      header={
        <div className="actions-head">
          <Favicon url={current.url} color={col?.color} size="lg" />
          <div className="preview-text">
            <div className="preview-title" style={{ fontSize: 17 }}>{current.title}</div>
            <span className="domain">{domainOf(current.url)} · {col?.name}</span>
          </div>
        </div>
      }
    >
      <div className="actions-list sheet-body" style={{ gap: 0, padding: 8 }}>
        <a className="menu-item" href={current.url} target="_blank" rel="noopener noreferrer" onClick={close}>
          <ExternalLink /> Abrir em nova aba
        </a>
        <button className="menu-item" onClick={async () => { if (await copyText(current.url)) showToast('Link copiado'); close(); }}>
          <Copy /> Copiar link
        </button>
        <button className="menu-item" onClick={share}>
          <Share /> Compartilhar
        </button>
        {canEdit && (
          <>
        <button className="menu-item" onClick={() => { toggleFavorite(current.id); showToast(current.favorite ? 'Removido dos salvos' : 'Salvo nos favoritos'); close(); }}>
          <Bookmark className={current.favorite ? 'fav-on' : ''} style={current.favorite ? { fill: 'currentColor', color: 'var(--blue)' } : undefined} />
          {current.favorite ? 'Remover dos salvos' : 'Salvar nos favoritos'}
        </button>
        <div className="menu-sep" />
        <button className="menu-item" onClick={() => openLink({ link: current })}>
          <Pencil /> Editar
        </button>
        <button className="menu-item" onClick={() => setMoving((m) => !m)} aria-expanded={moving}>
          <FolderInput /> Mover para outra coleção
          <motion.span animate={{ rotate: moving ? 180 : 0 }} style={{ marginLeft: 'auto', display: 'grid' }}>
            <ChevronDown />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {moving && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} style={{ overflow: 'hidden', paddingLeft: 18 }}>
              {collections.map((c) => {
                const I = iconFor(c.icon);
                const here = c.id === current.collection;
                return (
                  <button
                    key={c.id}
                    className="menu-item"
                    data-color={c.color}
                    disabled={here}
                    onClick={() => {
                      saveLink({ ...current, collection: c.id });
                      showToast(`Movido para ${c.name}`);
                      close();
                    }}
                  >
                    <span className="row-icon" style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--tint)' }}>
                      <I style={{ width: 14, height: 14, color: '#fff' }} />
                    </span>
                    {c.name}
                    {here && <Check className="check" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="menu-sep" />
        <button
          className="menu-item danger"
          onClick={() =>
            confirm({
              title: 'Excluir link?',
              message: `“${current.title}” será removido para todos.`,
              confirmLabel: 'Excluir link',
              onConfirm: () => { deleteLink(current.id); showToast('Link excluído'); },
            })
          }
        >
          <Trash2 /> Excluir
        </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function CollectionActions({ collection }: { collection: Collection }) {
  const { countFor, deleteCollection } = useStore();
  const { close, openCollection, openLink, confirm, showToast } = useUI();
  const Icon = iconFor(collection.icon);
  const n = countFor(collection.id);
  return (
    <Sheet
      open
      onClose={close}
      label={`Ações de ${collection.name}`}
      header={
        <div className="actions-head" data-color={collection.color}>
          <span className="hero-icon" style={{ width: 48, height: 48, borderRadius: 14 }}><Icon style={{ width: 24, height: 24 }} /></span>
          <div className="preview-text">
            <div className="preview-title" style={{ fontSize: 17 }}>{collection.name}</div>
            <span className="domain">{plural(n, 'link', 'links')}</span>
          </div>
        </div>
      }
    >
      <div className="sheet-body" style={{ gap: 0, padding: 8 }}>
        <button className="menu-item" onClick={() => openLink({ collectionId: collection.id })}><Link2 /> Adicionar link aqui</button>
        <button className="menu-item" onClick={() => openCollection(collection)}><Pencil /> Editar nome, ícone e cor</button>
        <div className="menu-sep" />
        <button
          className="menu-item danger"
          onClick={() =>
            confirm({
              title: 'Excluir coleção?',
              message: n
                ? `“${collection.name}” e ${plural(n, 'link', 'links')} dentro dela serão removidos.`
                : `“${collection.name}” será removida.`,
              confirmLabel: 'Excluir coleção',
              onConfirm: () => {
                deleteCollection(collection.id);
                showToast('Coleção excluída');
                if (location.hash.includes(`/colecoes/${collection.id}`)) location.hash = '#/colecoes';
              },
            })
          }
        >
          <Trash2 /> Excluir coleção
        </button>
      </div>
    </Sheet>
  );
}

function Confirm({ title, message, confirmLabel, onConfirm }: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) {
  const { close } = useUI();
  return (
    <Sheet open onClose={close} label={title} header={<div style={{ height: 8 }} />}>
      <div className="sheet-body" style={{ textAlign: 'center', paddingTop: 8 }}>
        <div className="empty-icon" style={{ margin: '0 auto', background: 'rgba(255,59,48,.12)', color: 'var(--red)' }}><Trash2 /></div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>{title}</h2>
          <p style={{ color: 'var(--label-2)', margin: '6px 0 0', fontSize: 15 }}>{message}</p>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="btn btn-block" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => { onConfirm(); close(); }}>
            {confirmLabel}
          </button>
          <button className="btn btn-block btn-secondary" onClick={close}>Cancelar</button>
        </div>
      </div>
    </Sheet>
  );
}

/** Renderiza a folha ativa. */
export function SheetHost() {
  const { sheet } = useUI();
  return (
    <AnimatePresence>
      {sheet.kind === 'link' && <LinkForm key={`l-${sheet.link?.id ?? 'new'}`} link={sheet.link} collectionId={sheet.collectionId} />}
      {sheet.kind === 'collection' && <CollectionForm key={`c-${sheet.collection?.id ?? 'new'}`} collection={sheet.collection} />}
      {sheet.kind === 'actions' && <LinkActions key={`a-${sheet.link.id}`} link={sheet.link} />}
      {sheet.kind === 'collectionActions' && <CollectionActions key={`ca-${sheet.collection.id}`} collection={sheet.collection} />}
      {sheet.kind === 'confirm' && <Confirm key="confirm" {...sheet} />}
      {sheet.kind === 'login' && <LoginSheet key="login" />}
    </AnimatePresence>
  );
}
