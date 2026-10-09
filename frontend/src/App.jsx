import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Home from './components/pages/home/Home';
import ModulePage from './components/pages/modules/ModulePage';
import Pregnants from './components/pages/pregnants/Pregnants';
import Products from './components/pages/products/Products';
import Eventos from './components/pages/events/Eventos';
import Access from './components/pages/auth/Access';
import { API_BASE } from './api';
import { canAccessPath } from './accessControl';

const SESSION_API = `${API_BASE}/login/verificar`;

function ProtectedRoute() {
  const location = useLocation();
  const [session, setSession] = useState({
    path: null,
    status: 'checking',
    error: '',
    user: null,
  });

  useEffect(() => {
    let active = true;

    fetch(SESSION_API, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          if (active) {
            setSession({
              path: location.pathname,
              status: 'unauthenticated',
              error: '',
              user: null,
            });
          }
          return;
        }
        if (!response.ok) {
          throw new Error(data.mensagem || 'Não foi possível verificar sua sessão.');
        }
        if (active) {
          setSession({
            path: location.pathname,
            status: data.logado ? 'authenticated' : 'unauthenticated',
            error: '',
            user: data.logado ? data.usuario : null,
          });
        }
      })
      .catch((requestError) => {
        if (active) {
          setSession({
            path: location.pathname,
            status: 'error',
            error: requestError.message,
            user: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const status = session.path === location.pathname ? session.status : 'checking';

  if (status === 'checking') {
    return <main className="auth-route-status" role="status">Verificando sua autenticação...</main>;
  }

  if (status === 'error') {
    return (
      <main className="auth-route-status auth-route-status--error" role="alert">
        <p>{session.error}</p>
        <Link to="/acesso">Ir para a tela de acesso</Link>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/acesso" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessPath(session.user, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={{ user: session.user }} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/acesso" element={<Access />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/gestante" element={<Pregnants />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/colaboradores" element={<ModulePage module="colaboradores" />} />
          <Route path="/doacoes" element={<ModulePage module="doacoes" />} />
          <Route path="/estoque" element={<ModulePage module="estoque" />} />
          <Route path="/fila-prioridade" element={<ModulePage module="fila" />} />
          <Route path="/kits" element={<ModulePage module="kits" />} />
          <Route path="/triagem" element={<ModulePage module="triagem" />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
