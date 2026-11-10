import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, RefreshCw, WifiOff } from 'lucide-react';
import { useStore } from '../lib/store';
import { APP_NAME } from '../lib/config';
import { useUI } from '../lib/ui';
import { Sheet } from './Sheet';
import { Logo } from './Layout';
import { softSpring } from './primitives';

function PasswordInput({ id, value, onChange, placeholder, autoComplete }: { id: string; value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <Lock />
      <input
        id={id}
        className="input with-action"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      <button type="button" className="input-action" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
        {show ? <EyeOff /> : <Eye />} {show ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}

/** Login com e-mail e senha (só quem tem conta pode editar). */
export function LoginSheet() {
  const { login } = useStore();
  const { close, showToast } = useUI();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = email.includes('@') && !!password && !busy;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      close();
      showToast(`Olá, ${u.name}!`);
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
      title="Entrar"
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
            Entre com sua conta para adicionar, editar e organizar os links do {APP_NAME}.
          </p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="g-email">E-mail</label>
          <div className="input-wrap">
            <Mail />
            <input id="g-email" className="input" type="email" inputMode="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="g-password">Senha</label>
          <PasswordInput id="g-password" value={password} onChange={setPassword} placeholder="Sua senha" autoComplete="current-password" />
          {error ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} className="field-error">
              {error}
            </motion.span>
          ) : (
            <span className="field-hint">Você continua conectado neste aparelho até sair.</span>
          )}
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/** Trocar a senha da conta logada. */
export function PasswordSheet() {
  const { changePassword, user } = useStore();
  const { close, showToast } = useUI();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmNext, setConfirmNext] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = !!confirmNext && next !== confirmNext;
  const short = !!next && next.length < 8;
  const ready = !!current && next.length >= 8 && next === confirmNext && !busy;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await changePassword(current, next);
      close();
      showToast('Senha alterada');
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
      title="Alterar senha"
      left={<button className="btn-ghost btn cancel" onClick={close}>Cancelar</button>}
      right={<span />}
      footer={
        <button className="btn btn-primary btn-block" onClick={() => submit()} disabled={!ready}>
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      }
    >
      <form className="sheet-body" onSubmit={submit}>
        <input type="email" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
        <div className="field">
          <label className="field-label" htmlFor="p-current">Senha atual</label>
          <PasswordInput id="p-current" value={current} onChange={setCurrent} placeholder="Senha atual" autoComplete="current-password" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="p-next">Nova senha</label>
          <PasswordInput id="p-next" value={next} onChange={setNext} placeholder="Pelo menos 8 caracteres" autoComplete="new-password" />
          {short && <span className="field-error">Use pelo menos 8 caracteres.</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="p-confirm">Repita a nova senha</label>
          <PasswordInput id="p-confirm" value={confirmNext} onChange={setConfirmNext} placeholder="Digite de novo" autoComplete="new-password" />
          {mismatch && <span className="field-error">As senhas não são iguais.</span>}
          {error && <span className="field-error">{error}</span>}
          {!mismatch && !error && <span className="field-hint">Seus outros aparelhos vão pedir a senha nova.</span>}
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
