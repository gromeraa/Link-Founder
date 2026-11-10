import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, RefreshCw, User, WifiOff } from 'lucide-react';
import { useStore } from '../lib/store';
import { APP_NAME } from '../lib/config';
import { useUI } from '../lib/ui';
import { Sheet } from './Sheet';
import { Logo } from './Layout';
import { softSpring } from './primitives';

/** Entrar no modo de edição: nome + código de acesso. */
export function LoginSheet() {
  const { login, userName } = useStore();
  const { close, showToast } = useUI();
  const [code, setCode] = useState('');
  const [name, setName] = useState(userName);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = !!code.trim() && !!name.trim() && !busy;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await login(code, name);
      close();
      showToast(`Olá, ${name.trim()}! Edição liberada`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={close}
      title="Entrar para editar"
      left={<button className="btn-ghost btn cancel" onClick={close}>Cancelar</button>}
      right={<span />}
      footer={
        <button className="btn btn-primary btn-block" onClick={() => submit()} disabled={!ready}>
          {busy ? 'Entrando…' : <>Entrar <ArrowRight /></>}
        </button>
      }
    >
      <form className="sheet-body" onSubmit={submit}>
        <div className="gate-intro">
          <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={softSpring} className="gate-logo">
            <Logo />
          </motion.div>
          <p className="page-sub" style={{ textAlign: 'center', margin: 0 }}>
            Qualquer pessoa pode ver os links do {APP_NAME}. Para adicionar, editar ou apagar, use o código de acesso.
          </p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="g-name">Seu nome</label>
          <div className="input-wrap">
            <User />
            <input id="g-name" className="input" placeholder="Ex.: Gui" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={30} />
          </div>
          <span className="field-hint">Aparece nos links que você adicionar.</span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="g-code">Código de acesso</label>
          <div className="input-wrap">
            <KeyRound />
            <input
              id="g-code"
              className="input"
              type="password"
              placeholder="O código que vocês combinaram"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} className="field-error">
              {error}
            </motion.span>
          ) : (
            <span className="field-hint">Fica salvo neste aparelho. Você só digita uma vez.</span>
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

export function LoadingScreen() {
  return (
    <div className="gate">
      <motion.div className="gate-logo pulse" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <Logo />
      </motion.div>
    </div>
  );
}

export function ErrorScreen() {
  const { bootError, refresh } = useStore();
  return (
    <div className="gate">
      <div className="card gate-card" style={{ textAlign: 'center' }}>
        <div className="empty-icon" style={{ margin: '0 auto' }}><WifiOff /></div>
        <h1 className="gate-title" style={{ fontSize: 22 }}>Não foi possível carregar</h1>
        <p className="page-sub">{bootError}</p>
        <button className="btn btn-primary btn-block" onClick={() => refresh()}>
          <RefreshCw /> Tentar de novo
        </button>
      </div>
    </div>
  );
}
