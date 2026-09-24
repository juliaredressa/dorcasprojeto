
import { useEffect, useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
    const [gestantes, setGestantes] = useState([]);

    const [formulario, setFormulario] = useState({
        id_pessoa: "",
        dpp: "",
        grau_vulnerabilidade: "",
        data_cadastro: "",
        situacao: "ATIVA"
    });

    const [editando, setEditando] = useState(false);

    const carregarGestantes = async () => {
        try {
            const resposta = await axios.get(
                "http://localhost:3000/api/gestantes"
            );

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
            [e.target.name]: e.target.value
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
                        grau_vulnerabilidade:
                            Number(formulario.grau_vulnerabilidade),
                        data_cadastro: formulario.data_cadastro,
                        situacao: formulario.situacao
                    }
                );

                alert("Gestante atualizada com sucesso!");
            } else {
                await axios.post(
                    "http://localhost:3000/api/gestantes",
                    {
                        id_pessoa: Number(formulario.id_pessoa),
                        dpp: formulario.dpp,
                        grau_vulnerabilidade:
                            Number(formulario.grau_vulnerabilidade),
                        data_cadastro: formulario.data_cadastro,
                        situacao: formulario.situacao
                    }
                );

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
            situacao: gestante.situacao
        });

        setEditando(true);
    };

    const excluir = async (id) => {
        const confirmar = window.confirm(
            "Deseja realmente excluir esta gestante?"
        );

        if (!confirmar) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:3000/api/gestantes/${id}`
            );

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
            situacao: "ATIVA"
        });

        setEditando(false);
    };

    return (
        <div className="pagina">
            <header className="cabecalho">
                <div>
                    <h1>DorcasGestão</h1>
                    <p>Sistema de Gestão da ONG Projeto Dorcas</p>
                </div>
            </header>

            <main className="container">

                <section className="titulo-pagina">
                    <h2>Cadastro de Gestantes</h2>
                    <p>
                        Cadastre e gerencie as informações das gestantes
                        atendidas pela instituição.
                    </p>
                </section>

                <section className="card">

                    <div className="card-titulo">
                        <h3>
                            {editando
                                ? "Editar Gestante"
                                : "Nova Gestante"}
                        </h3>
                    </div>

                    <form onSubmit={cadastrar}>

                        <div className="form-grid">

                            <div className="campo">
                                <label>ID da Pessoa</label>

                                <input
                                    type="number"
                                    name="id_pessoa"
                                    value={formulario.id_pessoa}
                                    onChange={handleChange}
                                    disabled={editando}
                                    placeholder="Digite o ID"
                                />
                            </div>

                            <div className="campo">
                                <label>DPP</label>

                                <input
                                    type="date"
                                    name="dpp"
                                    value={formulario.dpp}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="campo">
                                <label>
                                    Grau de Vulnerabilidade
                                </label>

                                <select
                                    name="grau_vulnerabilidade"
                                    value={
                                        formulario.grau_vulnerabilidade
                                    }
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Selecione
                                    </option>

                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </div>

                            <div className="campo">
                                <label>Data de Cadastro</label>

                                <input
                                    type="date"
                                    name="data_cadastro"
                                    value={formulario.data_cadastro}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="campo">
                                <label>Situação</label>

                                <select
                                    name="situacao"
                                    value={formulario.situacao}
                                    onChange={handleChange}
                                >
                                    <option value="ATIVA">
                                        ATIVA
                                    </option>

                                    <option value="INATIVA">
                                        INATIVA
                                    </option>

                                    <option value="ENCERRADA">
                                        ENCERRADA
                                    </option>
                                </select>
                            </div>

                        </div>

                        <div className="botoes">

                            <button
                                type="submit"
                                className="btn btn-principal"
                            >
                                {editando
                                    ? "Atualizar"
                                    : "Cadastrar"}
                            </button>

                            {editando && (
                                <button
                                    type="button"
                                    onClick={limparFormulario}
                                    className="btn btn-cancelar"
                                >
                                    Cancelar
                                </button>
                            )}

                        </div>

                    </form>
                </section>

                <section className="card">

                    <div className="card-titulo tabela-titulo">
                        <div>
                            <h3>Gestantes cadastradas</h3>
                            <p>
                                Lista de gestantes registradas no sistema.
                            </p>
                        </div>

                        <span className="contador">
                            {gestantes.length} registro(s)
                        </span>
                    </div>

                    <div className="tabela-container">

                        <table>

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
                                        <td
                                            colSpan="8"
                                            className="sem-registros"
                                        >
                                            Nenhuma gestante cadastrada.
                                        </td>
                                    </tr>
                                ) : (
                                    gestantes.map((gestante) => (
                                        <tr
                                            key={
                                                gestante.id_pessoa
                                            }
                                        >
                                            <td>
                                                {
                                                    gestante.id_pessoa
                                                }
                                            </td>

                                            <td>
                                                {gestante.nome}
                                            </td>

                                            <td>
                                                {gestante.cpf}
                                            </td>

                                            <td>
                                                {gestante.dpp.substring(
                                                    0,
                                                    10
                                                )}
                                            </td>

                                            <td>
                                                <span className="vulnerabilidade">
                                                    {
                                                        gestante.grau_vulnerabilidade
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {gestante.data_cadastro.substring(
                                                    0,
                                                    10
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`situacao ${gestante.situacao.toLowerCase()}`}
                                                >
                                                    {
                                                        gestante.situacao
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="acoes">

                                                    <button
                                                        onClick={() =>
                                                            editar(
                                                                gestante
                                                            )
                                                        }
                                                        className="btn-editar"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            excluir(
                                                                gestante.id_pessoa
                                                            )
                                                        }
                                                        className="btn-excluir"
                                                    >
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

            </main>

            <footer>
                <p>
                    DorcasGestão © 2026 - Projeto Dorcas
                </p>
            </footer>

        </div>
    );
}

export default App;

