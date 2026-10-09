import { useEffect, useState } from 'react';
import { KeyRound, UserPlus, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PortalLayout from '../../layout/PortalLayout';
import { API_BASE } from '../../../api';
import './Access.css';

const API = `${API_BASE}/login`;

async function request(path, options) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensagem || 'Não foi possível concluir a operação.');
  }
  return data;
}

function Access() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ login: '', senha: '' });
  const [registration, setRegistration] = useState({
    id_funcionario: '',
    login: '',
    senha: '',
    confirmarSenha: '',
  });
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    request('/verificar')
      .then((data) => {
        if (active && data.logado) setUser(data.usuario);
      })
      .catch((requestError) => {
        if (requestError.message !== 'Usuário não está logado.') {
          if (active) setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setUser(data.usuario);
      setForm({ login: '', senha: '' });
      const destination = location.state?.from || '/';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function startRegistration() {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const employees = await request('/colaboradores-disponiveis');
      setAvailableEmployees(employees);
      setRegistering(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function register(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (registration.senha !== registration.confirmarSenha) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setSaving(true);
    try {
      const data = await request('/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_funcionario: Number(registration.id_funcionario),
          login: registration.login,
          senha: registration.senha,
        }),
      });
      setForm({ login: registration.login, senha: '' });
      setRegistration({ id_funcionario: '', login: '', senha: '', confirmarSenha: '' });
      setRegistering(false);
      setMessage(data.mensagem);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function showLogin() {
    setRegistering(false);
    setRecoveringPassword(false);
    setError('');
    setMessage('');
  }

  return (
    <PortalLayout active="acesso" contentClassName="management-content access-content">
      <section className="management-heading">
        <p className="home-eyebrow">ACESSO AO SISTEMA</p>
        <h1>{user ? 'Minha conta' : 'Entrar'}</h1>
        <p>{user ? `Sessão iniciada como ${user.nome}.` : 'Acesse sua conta ou cadastre um novo acesso ao sistema.'}</p>
      </section>

      {loading ? (
        <section className="management-panel"><p className="management-empty">Verificando sessão...</p></section>
      ) : user ? (
        <section className="management-panel">
          <div className="management-panel-heading">
            <div className="management-panel-title">
              <span className="management-panel-icon"><UserRound size={20} /></span>
              <div><h2>Sessão ativa</h2><p>Você está conectado como {user.nome}.</p></div>
            </div>
          </div>
          <p className="management-empty">Use o menu da sua conta no cabeçalho para trocar a senha ou sair do sistema.</p>
        </section>
      ) : recoveringPassword ? (
        <section className="management-panel">
          <div className="management-panel-heading">
            <div className="management-panel-title">
              <span className="management-panel-icon"><KeyRound size={20} /></span>
              <div><h2>Recuperar senha</h2><p>Redefinição feita pelo administrador do sistema.</p></div>
            </div>
          </div>
          <div className="access-recovery-message">
            <p>
              Para proteger sua conta, a senha não pode ser redefinida automaticamente.
              Entre em contato com o administrador Dorcas para solicitar a redefinição.
            </p>
          </div>
          <div className="management-actions">
            <button className="management-button management-button--secondary" onClick={showLogin} type="button">
              Voltar ao login
            </button>
          </div>
        </section>
      ) : registering ? (
        <section className="management-panel">
          <div className="management-panel-heading">
            <div className="management-panel-title">
              <span className="management-panel-icon"><UserPlus size={20} /></span>
              <div><h2>Criar conta de acesso</h2><p>Associe a conta a um colaborador cadastrado.</p></div>
            </div>
          </div>
          <form className="access-form" onSubmit={register}>
            <div className="management-form-grid access-form-grid access-form-grid--registration">
              <label className="management-field" htmlFor="account-employee">
                Colaborador
                <select
                  id="account-employee"
                  required
                  value={registration.id_funcionario}
                  onChange={(event) => setRegistration((current) => ({ ...current, id_funcionario: event.target.value }))}
                >
                  <option value="">Selecione um colaborador</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id_pessoa} value={employee.id_pessoa}>
                      {employee.nome} — {employee.matricula}
                    </option>
                  ))}
                </select>
              </label>
              <label className="management-field" htmlFor="new-account-login">
                Login
                <input
                  id="new-account-login"
                  autoComplete="username"
                  maxLength="100"
                  required
                  value={registration.login}
                  onChange={(event) => setRegistration((current) => ({ ...current, login: event.target.value }))}
                />
              </label>
              <div className="access-password-fields">
                <label className="management-field" htmlFor="new-account-password">
                  Senha
                  <input
                    id="new-account-password"
                    autoComplete="new-password"
                    minLength="6"
                    required
                    type="password"
                    value={registration.senha}
                    onChange={(event) => setRegistration((current) => ({ ...current, senha: event.target.value }))}
                  />
                  <span className="access-field-hint">Mínimo de 6 caracteres.</span>
                </label>
                <label className="management-field" htmlFor="confirm-account-password">
                  Confirmar senha
                  <input
                    id="confirm-account-password"
                    autoComplete="new-password"
                    minLength="6"
                    required
                    type="password"
                    value={registration.confirmarSenha}
                    onChange={(event) => setRegistration((current) => ({ ...current, confirmarSenha: event.target.value }))}
                  />
                </label>
              </div>
            </div>
            {availableEmployees.length === 0 && (
              <p className="management-empty">Não há colaboradores disponíveis para criar uma conta.</p>
            )}
            <div className="management-actions">
              <button className="management-button management-button--primary" disabled={saving || availableEmployees.length === 0} type="submit">
                {saving ? 'Criando...' : 'Criar conta'}
              </button>
              <button className="management-button management-button--secondary" disabled={saving} onClick={showLogin} type="button">
                Voltar ao login
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="management-panel">
          <div className="management-panel-heading">
            <div className="management-panel-title">
              <span className="management-panel-icon"><UserRound size={20} /></span>
              <div><h2>Entrar na conta</h2><p>Informe seu login e sua senha.</p></div>
            </div>
          </div>
          <form className="access-form" onSubmit={signIn}>
            <div className="management-form-grid access-form-grid">
              <label className="management-field" htmlFor="account-login">
                Login
                <input id="account-login" autoComplete="username" required value={form.login} onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))} />
              </label>
              <label className="management-field" htmlFor="account-password">
                Senha
                <input id="account-password" autoComplete="current-password" required type="password" value={form.senha} onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))} />
              </label>
            </div>
            <div className="management-actions">
              <button className="management-button management-button--primary" disabled={saving} type="submit">{saving ? 'Entrando...' : 'Entrar'}</button>
              <button className="management-button management-button--secondary" disabled={saving} onClick={startRegistration} type="button">
                Criar conta
              </button>
            </div>
          </form>
          <button
            className="access-forgot-link"
            disabled={saving}
            onClick={() => {
              setError('');
              setMessage('');
              setRecoveringPassword(true);
            }}
            type="button"
          >
            Esqueci minha senha
          </button>
        </section>
      )}

      {error && <p aria-live="polite" className="management-notice management-notice--error">{error}</p>}
      {message && <p aria-live="polite" className="management-notice management-notice--success">{message}</p>}
    </PortalLayout>
  );
}

export default Access;
