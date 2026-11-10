import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Copy, MoreHorizontal } from 'lucide-react';
import type { LinkItem } from '../lib/types';
import { useStore } from '../lib/store';
import { copyText, useUI } from '../lib/ui';
import { domainOf, relativeDate } from '../lib/utils';
import { Favicon, softSpring } from './primitives';

interface Props {
  link: LinkItem;
  index?: number;
  showCollection?: boolean;
}

export const LinkCard = forwardRef<HTMLElement, Props>(function LinkCard(
  { link, index = 0, showCollection = true },
  ref,
) {
  const { collectionById, toggleFavorite } = useStore();
  const { openActions, showToast } = useUI();
  const col = collectionById(link.collection);
  const domain = domainOf(link.url);

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ ...softSpring, delay: Math.min(index, 10) * 0.035 }}
      className="card link-card"
      data-color={col?.color}
    >
      <a className="link-card-hit" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${link.title}`} />
      <div className="link-card-head">
        <Favicon url={link.url} color={col?.color} />
        <span className="domain">{domain}</span>
        {showCollection && col && <span className="badge">{col.name}</span>}
      </div>
      <h3 className="link-title">{link.title}</h3>
      {link.description && <p className="link-desc">{link.description}</p>}
      {!!link.tags?.length && (
        <div className="tags">
          {link.tags.map((t) => (
            <span key={t} className="tag-txt">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="link-foot">
        <span className="link-date">Adicionado {relativeDate(link.addedAt).toLowerCase()}</span>
        <button
          className="icon-btn plain"
          aria-label="Copiar link"
          onClick={async () => {
            if (await copyText(link.url)) showToast('Link copiado');
          }}
        >
          <Copy />
        </button>
        <motion.button
          whileTap={{ scale: 0.8 }}
          className={`icon-btn plain ${link.favorite ? 'fav-on' : ''}`}
          aria-label={link.favorite ? 'Remover dos salvos' : 'Salvar'}
          aria-pressed={!!link.favorite}
          onClick={() => {
            toggleFavorite(link.id);
            showToast(link.favorite ? 'Removido dos salvos' : 'Salvo nos favoritos');
          }}
        >
          <Bookmark />
        </motion.button>
        <button className="icon-btn plain" aria-label="Mais ações" onClick={() => openActions(link)}>
          <MoreHorizontal />
        </button>
      </div>
    </motion.article>
  );
});
