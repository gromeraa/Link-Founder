import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, RefreshCw, User, WifiOff } from 'lucide-react';
import { useStore } from '../lib/store';
import { APP_NAME, APP_TAGLINE } from '../lib/config';
import { Logo } from './Layout';
import { softSpring } from './primitives';

/** Tela de acesso: código compartilhado + nome de quem está usando. */
export function LoginScreen() {
  const { login, userName } = useStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState(userName);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await login(code, name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <motion.form
        className="card gate-card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={softSpring}
      >
        <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...softSpring, delay: 0.1 }} className="gate-logo">
          <Logo />
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <h1 className="gate-title">{APP_NAME}</h1>
          <p className="page-sub">{APP_TAGLINE}</p>
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
          {error && (
            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} className="field-error">
              {error}
            </motion.span>
          )}
        </div>

        <button className="btn btn-primary btn-block" disabled={busy || !code.trim() || !name.trim()}>
          {busy ? 'Entrando…' : <>Entrar <ArrowRight /></>}
        </button>
        <p className="field-hint" style={{ textAlign: 'center' }}>
          O código fica salvo neste aparelho. Você só digita uma vez.
        </p>
      </motion.form>
    </div>
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
