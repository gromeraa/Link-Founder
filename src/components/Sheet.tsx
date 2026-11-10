import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'motion/react';
import { useMediaQuery } from './primitives';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  label?: string;
}

let lockCount = 0;

/**
 * Folha inferior no celular (arraste para baixo para fechar)
 * e modal centralizado a partir de 640px.
 */
export function Sheet({ open, onClose, title, left, right, header, footer, children, label }: Props) {
  const centered = useMediaQuery('(min-width: 640px)');
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const variants = centered
    ? { hidden: { opacity: 0, scale: 0.94, y: 12 }, shown: { opacity: 1, scale: 1, y: 0 } }
    : { hidden: { y: '100%' }, shown: { y: 0 } };

  useEffect(() => {
    if (!open) return;
    lockCount++;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount--;
      if (lockCount <= 0) document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;
  // Sem AnimatePresence aqui: quem controla a saída é o AnimatePresence do SheetHost
  return createPortal(
        <>
          <motion.div
            key="backdrop"
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div className="sheet-wrap" key="wrap">
            <motion.div
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={label ?? title}
              variants={variants}
              initial="hidden"
              animate="shown"
              exit="hidden"
              transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
              drag={centered ? false : 'y'}
              dragListener={false}
              dragControls={controls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 600) onClose();
              }}
            >
              <div onPointerDown={(e) => controls.start(e)} style={{ touchAction: 'none' }}>
                <div className="sheet-handle" />
                {header ??
                  (title && (
                    <div className="sheet-head">
                      <div>{left}</div>
                      <h2>{title}</h2>
                      <div style={{ justifySelf: 'end' }}>{right}</div>
                    </div>
                  ))}
              </div>
              {children}
              {footer && <div className="sheet-foot">{footer}</div>}
            </motion.div>
          </div>
        </>,
    document.body,
  );
}
