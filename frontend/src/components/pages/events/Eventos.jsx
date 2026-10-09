import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Pencil, Plus, Save, Trash2, UsersRound, X } from 'lucide-react';
import PortalLayout from '../../layout/PortalLayout';
import { API_BASE } from '../../../api';

const API = `${API_BASE}/eventos`;
const SEXO_BEBE = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
  AINDA_NAO_SEI: 'Ainda não sabe',
  NAO_INFORMADO: 'Não informado',
};

const eventoVazio = {
  nome_evento: '',
  descricao: '',
  data_evento: '',
  horario: '',
  local_evento: '',
};

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensagem || 'Não foi possível concluir a operação.');
  }
  return data;
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '—';
}

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [psicologos, setPsicologos] = useState([]);
  const [gestantes, setGestantes] = useState([]);
  const [kitsDisponiveis, setKitsDisponiveis] = useState([]);
  const [eventoForm, setEventoForm] = useState(eventoVazio);
  const [palestraForm, setPalestraForm] = useState({ titulo: '', descricao: '', horario: '', id_psicologo: '' });
  const [participanteForm, setParticipanteForm] = useState({ id_gestante: '', presente: true, id_kit: '' });
  const [editandoEvento, setEditandoEvento] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarEventos() {
    const lista = await request('/');
    setEventos(lista);
    return lista;
  }

  async function carregarEvento(id) {
    const evento = await request(`/${id}`);
    setEventoSelecionado(evento);
    setEventoForm({
      nome_evento: evento.nome_evento || '',
      descricao: evento.descricao || '',
      data_evento: formatDate(evento.data_evento) === '—' ? '' : formatDate(evento.data_evento),
      horario: evento.horario ? String(evento.horario).slice(0, 5) : '',
      local_evento: evento.local_evento || '',
    });
    const kits = await request(`/kits?id_evento=${id}`);
    setKitsDisponiveis(kits);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      request('/'),
      request('/psicologos'),
      request('/gestantes'),
    ]).then(([lista, profissionais, pessoasGestantes]) => {
      if (!active) return;
      setEventos(lista);
      setPsicologos(profissionais);
      setGestantes(pessoasGestantes);
      if (lista.length) {
        carregarEvento(lista[0].id_evento).catch((loadError) => {
          if (active) setErro(loadError.message);
        });
      }
    }).catch((loadError) => {
      if (active) setErro(loadError.message);
    }).finally(() => {
      if (active) setCarregando(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function clearNotices() {
    setErro('');
    setMensagem('');
  }

  async function salvarEvento(event) {
    event.preventDefault();
    clearNotices();
    setSalvando(true);
    try {
      const result = await request(editandoEvento ? `/${eventoSelecionado.id_evento}` : '/', {
        method: editandoEvento ? 'PUT' : 'POST',
        body: JSON.stringify(eventoForm),
      });
      const id = eventoSelecionado?.id_evento || result.id_evento;
      await carregarEventos();
      await carregarEvento(id);
      setEditandoEvento(false);
      setMensagem(result.mensagem);
    } catch (saveError) {
      setErro(saveError.message);
    } finally {
      setSalvando(false);
    }
  }

  async function selecionarEvento(evento) {
    clearNotices();
    setEditandoEvento(false);
    setSalvando(true);
    try {
      await carregarEvento(evento.id_evento);
    } catch (loadError) {
      setErro(loadError.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirEvento() {
    if (!eventoSelecionado || !window.confirm(`Excluir o evento "${eventoSelecionado.nome_evento}"?`)) return;
    clearNotices();
    try {
      const result = await request(`/${eventoSelecionado.id_evento}`, { method: 'DELETE' });
      const lista = await carregarEventos();
      setEventoSelecionado(null);
      setEventoForm(eventoVazio);
      setMensagem(result.mensagem);
      if (lista.length) await selecionarEvento(lista[0]);
    } catch (deleteError) {
      setErro(deleteError.message);
    }
  }

  function cancelarEdicaoEvento() {
    setEditandoEvento(false);
    setEventoForm(eventoSelecionado ? {
      nome_evento: eventoSelecionado.nome_evento,
      descricao: eventoSelecionado.descricao || '',
      data_evento: formatDate(eventoSelecionado.data_evento),
      horario: eventoSelecionado.horario ? String(eventoSelecionado.horario).slice(0, 5) : '',
      local_evento: eventoSelecionado.local_evento || '',
    } : eventoVazio);
  }

  async function adicionarPalestra(event) {
    event.preventDefault();
    if (!eventoSelecionado) return;
    clearNotices();
    setSalvando(true);
    try {
      const result = await request(`/${eventoSelecionado.id_evento}/palestras`, {
        method: 'POST',
        body: JSON.stringify(palestraForm),
      });
      setPalestraForm({ titulo: '', descricao: '', horario: '', id_psicologo: '' });
      await carregarEvento(eventoSelecionado.id_evento);
      setMensagem(result.mensagem);
    } catch (saveError) {
      setErro(saveError.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirPalestra(idPalestra) {
    clearNotices();
    try {
      const result = await request(`/${eventoSelecionado.id_evento}/palestras/${idPalestra}`, { method: 'DELETE' });
      await carregarEvento(eventoSelecionado.id_evento);
      setMensagem(result.mensagem);
    } catch (deleteError) {
      setErro(deleteError.message);
    }
  }

  async function registrarParticipante(event) {
    event.preventDefault();
    if (!eventoSelecionado || !participanteForm.id_gestante) return;
    clearNotices();
    setSalvando(true);
    try {
      const result = await request(`/${eventoSelecionado.id_evento}/participantes/${participanteForm.id_gestante}`, {
        method: 'PUT',
        body: JSON.stringify({
          presente: participanteForm.presente,
          id_kit: participanteForm.id_kit || null,
        }),
      });
      setParticipanteForm({ id_gestante: '', presente: true, id_kit: '' });
      await carregarEvento(eventoSelecionado.id_evento);
      await carregarEventos();
      setMensagem(result.mensagem);
    } catch (saveError) {
      setErro(saveError.message);
    } finally {
      setSalvando(false);
    }
  }

  const kitsDaGestante = kitsDisponiveis.filter(
    (kit) => String(kit.id_gestante) === participanteForm.id_gestante,
  );

  return (
    <PortalLayout active="eventos" contentClassName="management-content">
      <section className="management-heading">
        <p className="home-eyebrow">ENCONTROS E ACOLHIMENTO</p>
        <h1>Eventos</h1>
        <p>Organize palestras com psicólogos, participantes, doações e entrega de kits.</p>
      </section>

      {erro && <p aria-live="polite" className="management-notice management-notice--error">{erro}</p>}
      {mensagem && <p aria-live="polite" className="management-notice management-notice--success">{mensagem}</p>}

      <section className="management-panel">
        <div className="management-panel-heading">
          <div className="management-panel-title">
            <span className="management-panel-icon"><CalendarDays size={20} /></span>
            <div>
              <h2>{editandoEvento ? 'Editar evento' : 'Cadastrar evento'}</h2>
              <p>Cadastre o encontro e informe sua data, horário e local.</p>
            </div>
          </div>
        </div>
        <form onSubmit={salvarEvento}>
          <div className="management-form-grid">
            <label className="management-field">Nome do evento
              <input maxLength={150} onChange={(event) => setEventoForm((form) => ({ ...form, nome_evento: event.target.value }))} required value={eventoForm.nome_evento} />
            </label>
            <label className="management-field">Data
              <input onChange={(event) => setEventoForm((form) => ({ ...form, data_evento: event.target.value }))} required type="date" value={eventoForm.data_evento} />
            </label>
            <label className="management-field">Horário
              <input onChange={(event) => setEventoForm((form) => ({ ...form, horario: event.target.value }))} type="time" value={eventoForm.horario} />
            </label>
            <label className="management-field">Local
              <input maxLength={255} onChange={(event) => setEventoForm((form) => ({ ...form, local_evento: event.target.value }))} value={eventoForm.local_evento} />
            </label>
            <label className="management-field management-field--full">Descrição
              <textarea onChange={(event) => setEventoForm((form) => ({ ...form, descricao: event.target.value }))} rows="3" value={eventoForm.descricao} />
            </label>
          </div>
          <div className="management-actions">
            <button className="management-button management-button--primary" disabled={salvando} type="submit">
              <Save size={15} /> {salvando ? 'Salvando...' : editandoEvento ? 'Salvar evento' : 'Cadastrar evento'}
            </button>
            {editandoEvento && (
              <button className="management-button management-button--secondary" onClick={cancelarEdicaoEvento} type="button">
                <X size={15} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div><h2>Eventos cadastrados</h2><p>Selecione um evento para gerenciar sua programação.</p></div>
          <span className="management-count">{eventos.length} evento(s)</span>
        </div>
        {carregando ? <p className="management-empty">Carregando eventos...</p> : eventos.length === 0 ? (
          <p className="management-empty">Nenhum evento cadastrado.</p>
        ) : (
          <div className="event-list">
            {eventos.map((evento) => (
              <button
                aria-pressed={eventoSelecionado?.id_evento === evento.id_evento}
                className={`event-list-card${eventoSelecionado?.id_evento === evento.id_evento ? ' event-list-card--active' : ''}`}
                key={evento.id_evento}
                onClick={() => selecionarEvento(evento)}
                type="button"
              >
                <strong>{evento.nome_evento}</strong>
                <span>{formatDate(evento.data_evento)}{evento.horario ? ` · ${String(evento.horario).slice(0, 5)}` : ''}</span>
                <small>{evento.total_inscritas} participante(s) · {evento.total_palestras} palestra(s)</small>
              </button>
            ))}
          </div>
        )}
      </section>

      {eventoSelecionado && (
        <>
          <section className="management-panel">
            <div className="management-panel-heading">
              <div className="management-panel-title">
                <span className="management-panel-icon"><CalendarDays size={20} /></span>
                <div>
                  <h2>{eventoSelecionado.nome_evento}</h2>
                  <p><MapPin size={13} /> {eventoSelecionado.local_evento || 'Local não informado'} · {formatDate(eventoSelecionado.data_evento)}</p>
                </div>
              </div>
              <div className="management-actions">
                <button className="management-button btn-editar" onClick={() => { setEventoForm({ nome_evento: eventoSelecionado.nome_evento, descricao: eventoSelecionado.descricao || '', data_evento: formatDate(eventoSelecionado.data_evento), horario: eventoSelecionado.horario ? String(eventoSelecionado.horario).slice(0, 5) : '', local_evento: eventoSelecionado.local_evento || '' }); setEditandoEvento(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} type="button">
                  <Pencil size={14} /> Editar
                </button>
                <button className="management-button btn-excluir" onClick={excluirEvento} type="button">
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
            {eventoSelecionado.descricao && <p>{eventoSelecionado.descricao}</p>}
            <div className="event-summary">
              <span>{eventoSelecionado.doacoes.length} doação(ões) relacionadas</span>
              <span>{eventoSelecionado.kits.length} kit(s) associados</span>
            </div>
            {eventoSelecionado.doacoes.length > 0 && (
              <ul className="event-record-list">
                {eventoSelecionado.doacoes.map((doacao) => (
                  <li key={doacao.id_doacao}>Doação #{doacao.id_doacao} · {formatDate(doacao.data_doacao)} · {doacao.nome_funcionario} · {doacao.total_itens} item(ns)</li>
                ))}
              </ul>
            )}
          </section>

          <section className="management-panel">
            <div className="management-panel-heading">
              <div className="management-panel-title"><span className="management-panel-icon"><CalendarDays size={20} /></span><div><h2>Palestras</h2><p>Cadastre temas e associe um psicólogo responsável.</p></div></div>
              <span className="management-count">{eventoSelecionado.palestras.length} palestra(s)</span>
            </div>
            <form onSubmit={adicionarPalestra}>
              <div className="management-form-grid">
                <label className="management-field">Tema da palestra
                  <input maxLength={150} onChange={(event) => setPalestraForm((form) => ({ ...form, titulo: event.target.value }))} required value={palestraForm.titulo} />
                </label>
                <label className="management-field">Psicólogo(a)
                  <select onChange={(event) => setPalestraForm((form) => ({ ...form, id_psicologo: event.target.value }))} required value={palestraForm.id_psicologo}>
                    <option value="">{psicologos.length ? 'Selecione o psicólogo' : 'Cadastre um colaborador com cargo Psicólogo(a)'}</option>
                    {psicologos.map((psicologo) => <option key={psicologo.id_pessoa} value={psicologo.id_pessoa}>{psicologo.nome}</option>)}
                  </select>
                </label>
                <label className="management-field">Horário
                  <input onChange={(event) => setPalestraForm((form) => ({ ...form, horario: event.target.value }))} type="time" value={palestraForm.horario} />
                </label>
                <label className="management-field">Descrição
                  <input onChange={(event) => setPalestraForm((form) => ({ ...form, descricao: event.target.value }))} value={palestraForm.descricao} />
                </label>
              </div>
              <div className="management-actions"><button className="management-button management-button--primary" disabled={salvando} type="submit"><Plus size={15} /> Adicionar palestra</button></div>
            </form>
            <div className="event-record-list">
              {eventoSelecionado.palestras.map((palestra) => (
                <div className="event-record-row" key={palestra.id_palestra}>
                  <span><strong>{palestra.titulo}</strong> · {palestra.nome_psicologo}{palestra.horario ? ` · ${String(palestra.horario).slice(0, 5)}` : ''}{palestra.descricao ? ` · ${palestra.descricao}` : ''}</span>
                  <button aria-label={`Remover palestra ${palestra.titulo}`} className="management-button btn-excluir" onClick={() => excluirPalestra(palestra.id_palestra)} type="button"><Trash2 size={14} /></button>
                </div>
              ))}
              {eventoSelecionado.palestras.length === 0 && <p className="management-empty">Nenhuma palestra cadastrada neste evento.</p>}
            </div>
          </section>

          <section className="management-panel">
            <div className="management-panel-heading">
              <div className="management-panel-title"><span className="management-panel-icon"><UsersRound size={20} /></span><div><h2>Participantes e kits</h2><p>Registre presença, confira o sexo do bebê e vincule o kit entregue.</p></div></div>
              <span className="management-count">{eventoSelecionado.participantes.length} participante(s)</span>
            </div>
            <form onSubmit={registrarParticipante}>
              <div className="management-form-grid">
                <label className="management-field">Gestante
                  <select onChange={(event) => setParticipanteForm((form) => ({ ...form, id_gestante: event.target.value, id_kit: '' }))} required value={participanteForm.id_gestante}>
                    <option value="">Selecione uma gestante</option>
                    {gestantes.map((gestante) => <option key={gestante.id_pessoa} value={gestante.id_pessoa}>{gestante.nome} · {SEXO_BEBE[gestante.sexo_bebe] || 'Não informado'}</option>)}
                  </select>
                </label>
                <label className="management-field">Presença
                  <select onChange={(event) => setParticipanteForm((form) => ({ ...form, presente: event.target.value === 'true', id_kit: event.target.value === 'true' ? form.id_kit : '' }))} value={String(participanteForm.presente)}>
                    <option value="true">Presente</option>
                    <option value="false">Ausente</option>
                  </select>
                </label>
                <label className="management-field">Kit entregue (opcional)
                  <select disabled={!participanteForm.id_gestante || !participanteForm.presente} onChange={(event) => setParticipanteForm((form) => ({ ...form, id_kit: event.target.value }))} value={participanteForm.id_kit}>
                    <option value="">Sem kit entregue</option>
                    {kitsDaGestante.map((kit) => <option key={kit.id_kit} value={kit.id_kit}>Kit #{kit.id_kit} · {kit.status}</option>)}
                  </select>
                </label>
              </div>
              <div className="management-actions"><button className="management-button management-button--primary" disabled={salvando} type="submit"><Plus size={15} /> Registrar participante</button></div>
            </form>
            <div className="management-table-wrap">
              <table className="management-table">
                <thead><tr><th>Gestante</th><th>Sexo do bebê</th><th>Presença</th><th>Kit entregue</th></tr></thead>
                <tbody>
                  {eventoSelecionado.participantes.length === 0 ? (
                    <tr><td className="management-empty" colSpan="4">Nenhuma participante registrada.</td></tr>
                  ) : eventoSelecionado.participantes.map((participante) => (
                    <tr key={participante.id_gestante}>
                      <td>{participante.nome_gestante}</td>
                      <td>{SEXO_BEBE[participante.sexo_bebe] || 'Não informado'}</td>
                      <td>{participante.presente ? 'Presente' : 'Ausente'}</td>
                      <td>{participante.id_kit ? `Kit #${participante.id_kit} · ${participante.status_kit}` : 'Não'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PortalLayout>
  );
}

export default Eventos;
