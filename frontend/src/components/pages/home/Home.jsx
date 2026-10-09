import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  CalendarDays,
  Gift,
  HandHeart,
  Heart,
  PackageOpen,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import PortalLayout from '../../layout/PortalLayout';
import { isAssistenteSocial } from '../../../accessControl';
import './Home.css';

const areas = [
  {
    title: 'Gestantes',
    description: 'Acompanhe cadastros, situações e informações de cada gestante atendida.',
    eyebrow: 'ACOLHIMENTO',
    href: '/gestante',
    icon: UsersRound,
    className: 'home-access-card--gestantes',
    action: 'Acessar gestantes',
  },
  {
    title: 'Produtos',
    description: 'Organize os itens para doação, categorias e quantidades mínimas.',
    eyebrow: 'DOAÇÕES E ESTOQUE',
    href: '/produtos',
    icon: PackageOpen,
    className: 'home-access-card--produtos',
    action: 'Acessar produtos',
  },
  {
    title: 'Colaboradores',
    description: 'Mantenha os dados da equipe que acolhe e acompanha as famílias.',
    eyebrow: 'EQUIPE E ATENDIMENTO',
    href: '/colaboradores',
    icon: UsersRound,
    className: 'home-access-card--colaboradores',
    action: 'Acessar colaboradores',
  },
  {
    title: 'Doações',
    description: 'Registre doações recebidas e os itens que entram no estoque.',
    eyebrow: 'GESTOS DE SOLIDARIEDADE',
    href: '/doacoes',
    icon: HandHeart,
    className: 'home-access-card--doacoes',
    action: 'Acessar doações',
  },
  {
    title: 'Estoque',
    description: 'Registre entradas e retiradas de itens para manter as quantidades atualizadas.',
    eyebrow: 'ENTRADAS E SAÍDAS',
    href: '/estoque',
    icon: ArrowLeftRight,
    className: 'home-access-card--estoque',
    action: 'Movimentar estoque',
  },
  {
    title: 'Fila de prioridade',
    description: 'Organize as posições das gestantes priorizadas pelo atendimento.',
    eyebrow: 'ACOMPANHAMENTO PRIORITÁRIO',
    href: '/fila-prioridade',
    icon: ArrowDownToLine,
    className: 'home-access-card--fila',
    action: 'Acessar fila',
  },
  {
    title: 'Kits maternidade',
    description: 'Monte kits com itens disponíveis e acompanhe as entregas.',
    eyebrow: 'PREPARO E ENTREGA',
    href: '/kits',
    icon: Gift,
    className: 'home-access-card--kits',
    action: 'Acessar kits',
  },
  {
    title: 'Eventos',
    description: 'Organize encontros, palestras, participantes e entregas de kits.',
    eyebrow: 'ENCONTROS E ACOLHIMENTO',
    href: '/eventos',
    icon: CalendarDays,
    className: 'home-access-card--eventos',
    action: 'Acessar eventos',
  },
  {
    title: 'Triagens sociais',
    description: 'Registre avaliações e acompanhe as necessidades identificadas.',
    eyebrow: 'ESCUTA E ACOMPANHAMENTO',
    href: '/triagem',
    icon: ClipboardCheck,
    className: 'home-access-card--triagem',
    action: 'Acessar triagens',
  },
];

function Home() {
  const { user } = useOutletContext();
  const visibleAreas = isAssistenteSocial(user)
    ? areas.filter(({ href }) => ['/gestante', '/triagem', '/kits', '/fila-prioridade', '/eventos'].includes(href))
    : areas;

  return (
    <PortalLayout active="home">
        <section className="home-welcome" aria-labelledby="home-title">
          <div className="home-welcome-copy">
            <p className="home-eyebrow"><Sparkles size={15} /> PORTAL DE CUIDADO</p>
            <h1 id="home-title">Cuidar de perto.<br /><span>Transformar histórias.</span></h1>
            <p className="home-intro">
              Um espaço para organizar cada gesto de acolhimento e acompanhar quem mais precisa.
            </p>
            <Link className="home-primary-link" to="/gestante">
              <Heart size={17} />
              Acompanhar gestantes
              <ArrowUpRight className="home-primary-arrow" size={17} />
            </Link>
            <div className="home-welcome-signoff">
              <span className="home-signoff-line" />
              <span>Feito com carinho, para cuidar melhor.</span>
            </div>
          </div>

          <figure className="home-welcome-image">
            <img
              src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1400&q=85"
              alt="Pezinhos de recém-nascido envoltos em uma manta branca"
            />
            <figcaption>
              <span className="home-image-heart"><Heart size={17} fill="currentColor" /></span>
              <span><strong>Presença que acolhe</strong><small>Carinho desde o começo</small></span>
            </figcaption>
          </figure>
          <span className="home-welcome-flower" aria-hidden="true">✿</span>
        </section>

        <section className="home-access" aria-labelledby="home-access-title">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">SEU ESPAÇO DE TRABALHO</p>
              <h2 id="home-access-title">Por onde vamos começar?</h2>
            </div>
            <p>Escolha uma área para continuar.</p>
          </div>

          <div className="home-access-grid">
            {visibleAreas.map(({ title, description, eyebrow, href, icon: Icon, className, action }) => (
              <Link className={`home-access-card ${className}`} key={title} to={href}>
                <span className="home-card-icon"><Icon size={22} strokeWidth={1.8} /></span>
                <ArrowUpRight className="home-card-open" size={20} aria-hidden="true" />
                <span className="home-card-eyebrow">{eyebrow}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="home-card-action">{action}<ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </section>

    </PortalLayout>
  );
}

export default Home;