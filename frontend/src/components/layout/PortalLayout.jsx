import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../pages/home/Home.css';
import './management.css';

const navigation = [
  { label: 'Início', href: '/', key: 'home' },
  { label: 'Gestantes', href: '/gestante', key: 'gestantes' },
  { label: 'Produtos', href: '/produtos', key: 'produtos' },
];

function PortalLayout({ active, children, contentClassName = '' }) {
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