import { useEffect, useState } from "react";

const API = "http://localhost:3000/api";

const formularioVazio = {
  nome_item: "",
  tamanho: "",
  unidade_medida: "",
  quantidade_minima: "",
  id_categoria: "",
};

function Products() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(formularioVazio);
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [resProdutos, resCategorias] = await Promise.all([
        fetch(`${API}/produtos`),
        fetch(`${API}/categorias`),
      ]);

      if (!resProdutos.ok || !resCategorias.ok) {
        throw new Error();
      }

      setProdutos(await resProdutos.json());
      setCategorias(await resCategorias.json());
    } catch {
      setErro(
        "Não foi possível carregar os dados. Verifique se o backend está ligado.",
      );
    }
  }

  function alterarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function validar() {
    if (!form.nome_item.trim()) {
      return "Preencha o nome do produto.";
    }

    if (!form.unidade_medida.trim()) {
      return "Preencha a unidade de medida.";
    }

    if (form.quantidade_minima === "" || Number(form.quantidade_minima) <= 0) {
      return "A quantidade mínima deve ser maior que zero.";
    }

    if (!form.id_categoria) {
      return "Selecione uma categoria.";
    }

    return "";
  }

  async function salvar(e) {
    e.preventDefault();

    setMensagem("");
    setErro("");

    const validacao = validar();

    if (validacao) {
      return setErro(validacao);
    }

    const url = editando ? `${API}/produtos/${editando}` : `${API}/produtos`;

    const metodo = editando ? "PUT" : "POST";

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        return setErro(dados.mensagem || "Não foi possível salvar.");
      }

      setMensagem(dados.mensagem);
      cancelarEdicao();
      carregarDados();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }
  }

  function editar(produto) {
    setEditando(produto.id_item);

    setForm({
      nome_item: produto.nome_item,
      tamanho: produto.tamanho || "",
      unidade_medida: produto.unidade_medida,
      quantidade_minima: produto.quantidade_minima,
      id_categoria: produto.id_categoria,
    });

    setMensagem("");
    setErro("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(formularioVazio);
  }

  async function excluir(id) {
    if (!window.confirm("Deseja realmente excluir este produto?")) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const resposta = await fetch(`${API}/produtos/${id}`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        return setErro(dados.mensagem || "Não foi possível excluir.");
      }

      setMensagem(dados.mensagem);
      carregarDados();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }
  }

  return (
    <main className="pagina">
      <header>
        <h1>Projeto Dorcas</h1>
        <p>Cadastro de produtos para doação</p>
      </header>

      <section className="card">
        <h2>{editando ? "Editar produto" : "Novo produto"}</h2>

        <form onSubmit={salvar}>
          <div className="campos">
            <label>
              Nome do produto
              <input
                name="nome_item"
                value={form.nome_item}
                onChange={alterarCampo}
                placeholder="Ex.: Fralda descartável"
              />
            </label>

            <label>
              Tamanho
              <input
                name="tamanho"
                value={form.tamanho}
                onChange={alterarCampo}
                placeholder="Ex.: P, M, G"
              />
            </label>

            <label>
              Unidade de medida
              <input
                name="unidade_medida"
                value={form.unidade_medida}
                onChange={alterarCampo}
                placeholder="Ex.: unidade, pacote"
              />
            </label>

            <label>
              Quantidade mínima
              <input
                type="number"
                min="1"
                step="1"
                name="quantidade_minima"
                value={form.quantidade_minima}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Categoria
              <select
                name="id_categoria"
                value={form.id_categoria}
                onChange={alterarCampo}
              >
                <option value="">Selecione</option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.id_categoria}
                  >
                    {categoria.nome_categoria}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="acoes-form">
            <button type="submit">
              {editando ? "Salvar alterações" : "Cadastrar"}
            </button>

            {editando && (
              <button
                type="button"
                className="secundario"
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {erro && <p className="aviso erro">{erro}</p>}

        {mensagem && <p className="aviso sucesso">{mensagem}</p>}
      </section>

      <section className="card">
        <h2>Produtos cadastrados</h2>

        {produtos.length === 0 ? (
          <p className="vazio">Nenhum produto cadastrado.</p>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tamanho</th>
                  <th>Unidade</th>
                  <th>Mínimo</th>
                  <th>Categoria</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id_item}>
                    <td>{produto.nome_item}</td>
                    <td>{produto.tamanho || "-"}</td>
                    <td>{produto.unidade_medida}</td>
                    <td>{produto.quantidade_minima}</td>
                    <td>{produto.nome_categoria}</td>

                    <td className="acoes">
                      <button
                        className="editar"
                        onClick={() => editar(produto)}
                      >
                        Editar
                      </button>

                      <button
                        className="excluir"
                        onClick={() => excluir(produto.id_item)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
