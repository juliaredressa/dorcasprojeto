import { ChevronDown, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../pages/home/Home.css';
import './management.css';
import { moduleConfig, moduleRoutes } from '../pages/modules/moduleConfig';

const navigation = [
  { label: 'Início', href: '/', key: 'home' },
  { label: 'Gestantes', href: '/gestante', key: 'gestantes' },
  { label: 'Produtos', href: '/produtos', key: 'produtos' },
];

function PortalLayout({ active, children, contentClassName = '' }) {
  const location = useLocation();
  const activeModule = moduleRoutes.some(({ href }) => href === location.pathname);

  return (
    <div className="home-page">
      <header className="home-topbar">
        <Link className="home-brand" to="/" aria-label="Dorcas, página inicial">
          <span className="home-brand-mark"><Heart size={19} fill="currentColor" strokeWidth={1.8} /></span>
          <span className="home-brand-copy">
            <strong>Dorcas</strong>
            <small>gestão com cuidado</small>
          </span>
        </Link>

        <nav className="home-nav" aria-label="Navegação principal">
          {navigation.map(({ label, href, key }) => (
            <Link
              aria-current={active === key ? 'page' : undefined}
              className={`home-nav-link${active === key ? ' home-nav-link--active' : ''}`}
              key={key}
              to={href}
            >
              {label}
            </Link>
          ))}
          <details className={`home-nav-more${activeModule ? ' home-nav-more--active' : ''}`}>
            <summary aria-label="Abrir outras áreas">
              Mais áreas <ChevronDown aria-hidden="true" size={13} />
            </summary>
            <div className="home-nav-menu">
              {moduleRoutes.map(({ key, href }) => (
                <Link aria-current={active === key ? 'page' : undefined} key={key} to={href}>
                  {moduleConfig[key].title}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <span className="home-topbar-note"><span aria-hidden="true" /> Projeto Dorcas</span>
      </header>

      <main className={`home-main ${contentClassName}`.trim()}>{children}</main>

      <footer className="home-footer">
        <span><Heart size={13} fill="currentColor" /> Projeto Dorcas</span>
        <span>Cuidado, respeito e dignidade.</span>
      </footer>
    </div>
  );
}

export default PortalLayout;