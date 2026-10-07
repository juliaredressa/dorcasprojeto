import { useEffect, useState } from "react";
import axios from "axios";
import { Baby, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PortalLayout from "../../layout/PortalLayout";

function Pregnants() {
  const [gestantes, setGestantes] = useState([]);

  const [formulario, setFormulario] = useState({
    id_pessoa: "",
    dpp: "",
    grau_vulnerabilidade: "",
    data_cadastro: "",
    situacao: "ATIVA",
  });

  const [editando, setEditando] = useState(false);

  const carregarGestantes = async () => {
    try {
      const resposta = await axios.get("http://localhost:3000/api/gestantes");

      setGestantes(resposta.data);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao carregar gestantes.");
    }
  };

  useEffect(() => {
    carregarGestantes();
  }, []);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const cadastrar = async (e) => {
    e.preventDefault();

    if (
      !formulario.id_pessoa ||
      !formulario.dpp ||
      !formulario.grau_vulnerabilidade ||
      !formulario.data_cadastro ||
      !formulario.situacao
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    if (
      Number(formulario.grau_vulnerabilidade) < 1 ||
      Number(formulario.grau_vulnerabilidade) > 5
    ) {
      alert("O grau de vulnerabilidade deve estar entre 1 e 5.");
      return;
    }

    try {
      if (editando) {
        await axios.put(
          `http://localhost:3000/api/gestantes/${formulario.id_pessoa}`,
          {
            dpp: formulario.dpp,
            grau_vulnerabilidade: Number(formulario.grau_vulnerabilidade),
            data_cadastro: formulario.data_cadastro,
            situacao: formulario.situacao,
          },
        );

        alert("Gestante atualizada com sucesso!");
      } else {
        await axios.post("http://localhost:3000/api/gestantes", {
          id_pessoa: Number(formulario.id_pessoa),
          dpp: formulario.dpp,
          grau_vulnerabilidade: Number(formulario.grau_vulnerabilidade),
          data_cadastro: formulario.data_cadastro,
          situacao: formulario.situacao,
        });

        alert("Gestante cadastrada com sucesso!");
      }

      limparFormulario();
      carregarGestantes();
    } catch (erro) {
      console.error(erro);

      if (erro.response) {
        alert(erro.response.data.erro);
      } else {
        alert("Erro ao conectar com a API.");
      }
    }
  };

  const editar = (gestante) => {
    setFormulario({
      id_pessoa: gestante.id_pessoa,
      dpp: gestante.dpp.substring(0, 10),
      grau_vulnerabilidade: gestante.grau_vulnerabilidade,
      data_cadastro: gestante.data_cadastro.substring(0, 10),
      situacao: gestante.situacao,
    });

    setEditando(true);
  };

  const excluir = async (id) => {
    const confirmar = window.confirm("Deseja realmente excluir esta gestante?");

    if (!confirmar) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/gestantes/${id}`);

      alert("Gestante excluída com sucesso!");

      carregarGestantes();
    } catch (erro) {
      console.error(erro);
      alert("Erro ao excluir gestante.");
    }
  };

  const limparFormulario = () => {
    setFormulario({
      id_pessoa: "",
      dpp: "",
      grau_vulnerabilidade: "",
      data_cadastro: "",
      situacao: "ATIVA",
    });

    setEditando(false);
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
              <div className="campo">
                <label htmlFor="pregnant-person-id">ID da pessoa</label>

                <input
                  id="pregnant-person-id"
                  type="number"
                  name="id_pessoa"
                  value={formulario.id_pessoa}
                  onChange={handleChange}
                  disabled={editando}
                  placeholder="Digite o ID"
                />
              </div>

              <div className="campo">
                <label htmlFor="pregnant-due-date">Data provável do parto</label>

                <input
                  id="pregnant-due-date"
                  type="date"
                  name="dpp"
                  value={formulario.dpp}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label htmlFor="pregnant-vulnerability">Grau de vulnerabilidade</label>

                <select
                  id="pregnant-vulnerability"
                  name="grau_vulnerabilidade"
                  value={formulario.grau_vulnerabilidade}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>

                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="campo">
                <label htmlFor="pregnant-registration-date">Data de cadastro</label>

                <input
                  id="pregnant-registration-date"
                  type="date"
                  name="data_cadastro"
                  value={formulario.data_cadastro}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label htmlFor="pregnant-status">Situação</label>

                <select
                  id="pregnant-status"
                  name="situacao"
                  value={formulario.situacao}
                  onChange={handleChange}
                >
                  <option value="ATIVA">ATIVA</option>

                  <option value="INATIVA">INATIVA</option>

                  <option value="ENCERRADA">ENCERRADA</option>
                </select>
              </div>
            </div>

            <div className="management-actions">
              <button type="submit" className="management-button management-button--primary">
                {editando ? <Save size={15} /> : <Plus size={15} />}
                {editando ? "Atualizar" : "Cadastrar"}
              </button>

              {editando && (
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
                  <th>ID</th>
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
                {gestantes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="management-empty">
                      Nenhuma gestante cadastrada.
                    </td>
                  </tr>
                ) : (
                  gestantes.map((gestante) => (
                    <tr key={gestante.id_pessoa}>
                      <td>{gestante.id_pessoa}</td>

                      <td>{gestante.nome}</td>

                      <td>{gestante.cpf}</td>

                      <td>{gestante.dpp.substring(0, 10)}</td>

                      <td>
                        <span className="management-vulnerability">
                          {gestante.grau_vulnerabilidade}
                        </span>
                      </td>

                      <td>{gestante.data_cadastro.substring(0, 10)}</td>

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
                            onClick={() => editar(gestante)}
                            className="management-button btn-editar"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>

                          <button
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
