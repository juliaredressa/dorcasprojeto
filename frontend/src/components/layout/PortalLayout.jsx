import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Gift,
  HandHeart,
  Heart,
  Home,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  PackageOpen,
  PanelLeftClose,
  Save,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../pages/home/Home.css';
import { API_BASE } from '../../api';
import { isAssistenteSocial } from '../../accessControl';
import './management.css';
import './account.css';
import './sidebar.css';

const navigationItems = [
  { key: 'home', label: 'Início', href: '/', icon: LayoutDashboard },
  { key: 'gestantes', label: 'Gestantes', href: '/gestante', icon: UsersRound },
  { key: 'produtos', label: 'Produtos', href: '/produtos', icon: PackageOpen },
  { key: 'colaboradores', label: 'Colaboradores', href: '/colaboradores', icon: UsersRound },
  { key: 'doacoes', label: 'Doações', href: '/doacoes', icon: HandHeart },
  { key: 'estoque', label: 'Estoque', href: '/estoque', icon: Warehouse },
  { key: 'fila', label: 'Fila de prioridade', href: '/fila-prioridade', icon: ListOrdered },
  { key: 'kits', label: 'Kits maternidade', href: '/kits', icon: Gift },
  { key: 'triagem', label: 'Triagens sociais', href: '/triagem', icon: ClipboardCheck },
  { key: 'eventos', label: 'Eventos', href: '/eventos', icon: CalendarDays },
];

function PortalLayout({ active, children, contentClassName = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const accountMenuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/login/verificar`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) return;
        if (!response.ok) {
          throw new Error(data.mensagem || 'Não foi possível carregar a conta.');
        }
        if (active && data.logado) setUser(data.usuario);
      })
      .catch((error) => {
        if (active) setAccountError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!passwordDialogOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !savingPassword) setPasswordDialogOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [passwordDialogOpen, savingPassword]);

  async function signOut() {
    setAccountError('');
    setLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE}/login/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.mensagem || 'Não foi possível encerrar a sessão.');
      }
      navigate('/acesso', { replace: true });
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setLoggingOut(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.novaSenha !== passwords.confirmarSenha) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`${API_BASE}/login/alterar-senha`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: passwords.senhaAtual,
          novaSenha: passwords.novaSenha,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.mensagem || 'Não foi possível alterar a senha.');
      }
      setPasswords({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setPasswordMessage(data.mensagem);
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className={`home-page${user && sidebarOpen ? ' home-page--sidebar-open' : ''}`}>
      {user && (
        <>
          {sidebarOpen && (
            <button
              aria-label="Fechar menu lateral"
              className="sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
              type="button"
            />
          )}
          <aside aria-label="Navegação principal" className={`portal-sidebar${sidebarOpen ? ' portal-sidebar--open' : ''}`}>
            <div className="portal-sidebar-heading">
              <span className="portal-sidebar-title">Navegação</span>
              <button
                aria-label="Fechar menu lateral"
                className="portal-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="portal-sidebar-nav">
              {navigationItems
                .filter(({ href }) => !isAssistenteSocial(user) || ['/', '/gestante', '/triagem', '/kits', '/fila-prioridade', '/eventos'].includes(href))
                .map(({ key, label, href, icon: Icon }) => (
                  <Link
                    aria-current={active === key ? 'page' : undefined}
                    className={`portal-sidebar-link${active === key ? ' portal-sidebar-link--active' : ''}`}
                    key={key}
                    onClick={() => setSidebarOpen(false)}
                    to={href}
                  >
                    <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
                    <span>{label}</span>
                  </Link>
                ))}
            </nav>
          </aside>
        </>
      )}
      <header className={`home-topbar${user ? ' home-topbar--with-sidebar' : ''}`}>
        {user && (
          <button
            aria-label={sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <Menu size={20} />}
          </button>
        )}
        <Link className="home-brand" aria-label="Ir para a página principal" to="/">
          <span className="home-brand-mark"><Heart size={19} fill="currentColor" strokeWidth={1.8} /></span>
          <span className="home-brand-copy">
            <strong>Dorcas</strong>
            <small>gestão com cuidado</small>
          </span>
        </Link>

        <div className="home-topbar-account">
          {user ? (
            <>
            {location.pathname !== '/' && (
              <Link className="account-home-link" to="/">
                <Home aria-hidden="true" size={17} />
                <span>Menu principal</span>
              </Link>
            )}
            <div className="account-menu" ref={accountMenuRef}>
              <button
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="account-menu-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="account-avatar"><UserRound size={18} /></span>
                <span className="account-identity">
                  <strong>{user.nome}</strong>
                  <small>{user.cargo || 'Colaborador'}</small>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`account-menu-chevron${accountMenuOpen ? ' account-menu-chevron--open' : ''}`}
                  size={16}
                />
              </button>
              {accountMenuOpen && (
                <div className="account-menu-panel" role="menu">
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setPasswordError('');
                      setPasswordMessage('');
                      setPasswordDialogOpen(true);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <KeyRound size={16} /> Trocar senha
                  </button>
                  <button disabled={loggingOut} onClick={signOut} role="menuitem" type="button">
                    <LogOut size={16} /> {loggingOut ? 'Saindo...' : 'Sair'}
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <span className="home-topbar-note"><span aria-hidden="true" /> Projeto Dorcas</span>
          )}
          {accountError && <span className="account-error" role="alert">{accountError}</span>}
        </div>
      </header>

      <main className={`home-main ${contentClassName}`.trim()}>{children}</main>

      {passwordDialogOpen && (
        <div
          className="account-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !savingPassword) {
              setPasswordDialogOpen(false);
            }
          }}
        >
          <section aria-labelledby="account-password-title" aria-modal="true" className="account-dialog" role="dialog">
            <div className="account-dialog-heading">
              <span className="management-panel-icon"><KeyRound size={19} /></span>
              <div>
                <h2 id="account-password-title">Trocar senha</h2>
                <p>Defina uma nova senha para sua conta.</p>
              </div>
              <button
                aria-label="Fechar"
                className="account-dialog-close"
                disabled={savingPassword}
                onClick={() => setPasswordDialogOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form className="account-password-form" onSubmit={changePassword}>
              <label className="management-field" htmlFor="account-current-password">
                Senha atual
                <input
                  autoComplete="current-password"
                  id="account-current-password"
                  minLength="6"
                  required
                  type="password"
                  value={passwords.senhaAtual}
                  onChange={(event) => setPasswords((current) => ({ ...current, senhaAtual: event.target.value }))}
                />
              </label>
              <label className="management-field" htmlFor="account-new-password">
                Nova senha
                <input
                  autoComplete="new-password"
                  id="account-new-password"
                  minLength="6"
                  required
                  type="password"
                  value={passwords.novaSenha}
                  onChange={(event) => setPasswords((current) => ({ ...current, novaSenha: event.target.value }))}
                />
              </label>
              <label className="management-field" htmlFor="account-confirm-password">
                Confirmar nova senha
                <input
                  autoComplete="new-password"
                  id="account-confirm-password"
                  minLength="6"
                  required
                  type="password"
                  value={passwords.confirmarSenha}
                  onChange={(event) => setPasswords((current) => ({ ...current, confirmarSenha: event.target.value }))}
                />
              </label>
              {passwordError && <p className="account-dialog-notice account-dialog-notice--error" role="alert">{passwordError}</p>}
              {passwordMessage && <p className="account-dialog-notice account-dialog-notice--success" role="status">{passwordMessage}</p>}
              <div className="account-dialog-actions">
                <button className="management-button management-button--secondary" disabled={savingPassword} onClick={() => setPasswordDialogOpen(false)} type="button">
                  Cancelar
                </button>
                <button className="management-button management-button--primary" disabled={savingPassword} type="submit">
                  <Save size={15} /> {savingPassword ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="home-footer">
        <span><Heart size={13} fill="currentColor" /> Projeto Dorcas</span>
        <span>Cuidado, respeito e dignidade.</span>
      </footer>
    </div>
  );
}

export default PortalLayout;