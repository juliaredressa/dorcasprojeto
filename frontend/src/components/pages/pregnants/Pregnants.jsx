import { useEffect, useState } from "react";
import axios from "axios";
import { Baby, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PortalLayout from "../../layout/PortalLayout";
import { API_BASE } from "../../../api";

const formularioVazio = {
  nome: "",
  cpf: "",
  telefone: "",
  endereco: "",
  dpp: "",
  grau_vulnerabilidade: "",
  data_cadastro: "",
  situacao: "ATIVA",
};

function formatarCpf(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarData(valor) {
  return valor ? String(valor).slice(0, 10) : "—";
}

function Pregnants() {
  const [gestantes, setGestantes] = useState([]);
  const [formulario, setFormulario] = useState(formularioVazio);
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarGestantes = async () => {
    setCarregando(true);

    try {
      const resposta = await axios.get(`${API_BASE}/gestantes`, { withCredentials: true });
      setGestantes(resposta.data);
    } catch (erro) {
      console.error(erro);
      setErro(erro.response?.data?.erro || "Não foi possível carregar as gestantes.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarGestantes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: name === "cpf" ? formatarCpf(value) : value,
    });
  };

  const cadastrar = async (e) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (
      !formulario.nome.trim() ||
      !formulario.cpf.trim() ||
      !formulario.dpp ||
      !formulario.grau_vulnerabilidade ||
      !formulario.data_cadastro ||
      !formulario.situacao
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formulario.cpf)) {
      setErro("Informe um CPF com 11 dígitos.");
      return;
    }

    const grauVulnerabilidade = Number(formulario.grau_vulnerabilidade);
    if (!Number.isInteger(grauVulnerabilidade) || grauVulnerabilidade < 1 || grauVulnerabilidade > 5) {
      setErro("O grau de vulnerabilidade deve estar entre 1 e 5.");
      return;
    }

    const dados = {
      nome: formulario.nome.trim(),
      cpf: formulario.cpf,
      telefone: formulario.telefone.trim(),
      endereco: formulario.endereco.trim(),
      dpp: formulario.dpp,
      grau_vulnerabilidade: grauVulnerabilidade,
      data_cadastro: formulario.data_cadastro,
      situacao: formulario.situacao,
    };

    setSalvando(true);

    try {
      let mensagemSucesso;

      if (editando) {
        const resposta = await axios.put(`${API_BASE}/gestantes/${editando}`, dados, { withCredentials: true });
        mensagemSucesso = resposta.data.mensagem || "Gestante atualizada com sucesso!";
      } else {
        const resposta = await axios.post(`${API_BASE}/gestantes`, dados, { withCredentials: true });
        mensagemSucesso = resposta.data.mensagem || "Gestante cadastrada com sucesso!";
      }

      limparFormulario();
      setMensagem(mensagemSucesso);
      await carregarGestantes();
    } catch (erro) {
      console.error(erro);
      setErro(erro.response?.data?.erro || erro.response?.data?.mensagem || "Erro ao conectar com a API.");
    } finally {
      setSalvando(false);
    }
  };

  const editar = (gestante) => {
    setFormulario({
      nome: gestante.nome || "",
      cpf: formatarCpf(gestante.cpf || ""),
      telefone: gestante.telefone || "",
      endereco: gestante.endereco || "",
      dpp: formatarData(gestante.dpp) === "—" ? "" : formatarData(gestante.dpp),
      grau_vulnerabilidade: String(gestante.grau_vulnerabilidade ?? ""),
      data_cadastro: formatarData(gestante.data_cadastro) === "—" ? "" : formatarData(gestante.data_cadastro),
      situacao: gestante.situacao || "ATIVA",
    });

    setEditando(gestante.id_pessoa);
    setErro("");
    setMensagem("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const excluir = async (id) => {
    const confirmar = window.confirm("Deseja realmente excluir esta gestante?");

    if (!confirmar) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const resposta = await axios.delete(`${API_BASE}/gestantes/${id}`, { withCredentials: true });
      setMensagem(resposta.data.mensagem || "Gestante excluída com sucesso!");
      await carregarGestantes();
    } catch (erro) {
      console.error(erro);
      setErro(erro.response?.data?.erro || "Erro ao excluir gestante.");
    }
  };

  const limparFormulario = () => {
    setFormulario(formularioVazio);
    setEditando(null);
    setErro("");
    setMensagem("");
  };

  return (
    <PortalLayout active="gestantes" contentClassName="management-content">
        <section className="management-heading">
          <p className="home-eyebrow">ACOLHIMENTO MATERNO</p>
          <h1>Cadastro de <span>gestantes</span></h1>
          <p>Cadastre e acompanhe as informações das gestantes atendidas pela instituição.</p>
        </section>

        <section className="management-panel">
          <div className="management-panel-heading">
            <div className="management-panel-title">
              <span className="management-panel-icon"><Baby size={20} /></span>
              <div>
                <h2>{editando ? "Editar gestante" : "Nova gestante"}</h2>
                <p>Dados de acompanhamento e previsão de parto.</p>
              </div>
            </div>
          </div>

          <form onSubmit={cadastrar}>
            <div className="management-form-grid">
              <label className="campo" htmlFor="pregnant-name">
                Nome completo
                <input
                  id="pregnant-name"
                  autoComplete="name"
                  name="nome"
                  value={formulario.nome}
                  onChange={handleChange}
                  placeholder="Nome completo da gestante"
                  required
                  maxLength={150}
                />
              </label>

              <label className="campo" htmlFor="pregnant-cpf">
                CPF
                <input
                  id="pregnant-cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  name="cpf"
                  value={formulario.cpf}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="campo" htmlFor="pregnant-phone">
                Telefone
                <input
                  id="pregnant-phone"
                  type="tel"
                  autoComplete="tel"
                  name="telefone"
                  value={formulario.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  maxLength={20}
                />
              </label>

              <label className="campo" htmlFor="pregnant-address">
                Endereço
                <input
                  id="pregnant-address"
                  type="text"
                  autoComplete="street-address"
                  name="endereco"
                  value={formulario.endereco}
                  onChange={handleChange}
                  placeholder="Rua, número e bairro"
                  maxLength={255}
                />
              </label>

              <label className="campo" htmlFor="pregnant-due-date">
                Data provável do parto
                <input
                  id="pregnant-due-date"
                  type="date"
                  name="dpp"
                  value={formulario.dpp}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="campo" htmlFor="pregnant-vulnerability">
                Grau de vulnerabilidade
                <select
                  id="pregnant-vulnerability"
                  name="grau_vulnerabilidade"
                  value={formulario.grau_vulnerabilidade}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>

              <label className="campo" htmlFor="pregnant-registration-date">
                Data de cadastro
                <input
                  id="pregnant-registration-date"
                  type="date"
                  name="data_cadastro"
                  value={formulario.data_cadastro}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="campo" htmlFor="pregnant-status">
                Situação
                <select
                  id="pregnant-status"
                  name="situacao"
                  value={formulario.situacao}
                  onChange={handleChange}
                  required
                >
                  <option value="ATIVA">ATIVA</option>
                  <option value="INATIVA">INATIVA</option>
                  <option value="ENCERRADA">ENCERRADA</option>
                </select>
              </label>
            </div>

            <div className="management-actions">
              <button disabled={salvando} type="submit" className="management-button management-button--primary">
                {editando ? <Save size={15} /> : <Plus size={15} />}
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar gestante"}
              </button>

              {editando !== null && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="management-button management-button--secondary"
                >
                  <X size={15} />
                  Cancelar
                </button>
              )}
            </div>

            {erro && <p aria-live="polite" className="management-notice management-notice--error">{erro}</p>}
            {mensagem && <p aria-live="polite" className="management-notice management-notice--success">{mensagem}</p>}
          </form>
        </section>

        <section className="management-panel">
          <div className="management-panel-heading">
            <div>
              <h2>Gestantes cadastradas</h2>
              <p>Lista de gestantes registradas no sistema.</p>
            </div>

            <span className="management-count">{gestantes.length} registro(s)</span>
          </div>

          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>DPP</th>
                  <th>Vulnerabilidade</th>
                  <th>Cadastro</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="7" className="management-empty">
                      Carregando gestantes...
                    </td>
                  </tr>
                ) : gestantes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="management-empty">
                      Nenhuma gestante cadastrada.
                    </td>
                  </tr>
                ) : (
                  gestantes.map((gestante) => (
                    <tr key={gestante.id_pessoa}>
                      <td>{gestante.nome}</td>

                      <td>{gestante.cpf}</td>

                      <td>{formatarData(gestante.dpp)}</td>

                      <td>
                        <span className="management-vulnerability">
                          {gestante.grau_vulnerabilidade}
                        </span>
                      </td>

                      <td>{formatarData(gestante.data_cadastro)}</td>

                      <td>
                        <span
                          className={`management-status management-status--${gestante.situacao.toLowerCase()}`}
                        >
                          {gestante.situacao}
                        </span>
                      </td>

                      <td>
                        <div className="management-row-actions">
                          <button
                            type="button"
                            onClick={() => editar(gestante)}
                            className="management-button btn-editar"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => excluir(gestante.id_pessoa)}
                            className="management-button btn-excluir"
                          >
                            <Trash2 size={13} />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
    </PortalLayout>
  );
}

export default Pregnants;
