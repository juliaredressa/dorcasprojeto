import { useEffect, useState } from "react";
import { PackageOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PortalLayout from "../../layout/PortalLayout";
import { API_BASE } from "../../../api";

const API = API_BASE;

const formularioVazio = {
  nome_item: "",
  tamanho: "",
  unidade_medida: "",
  quantidade_minima: "",
  id_categoria: "",
  quantidade_atual: "0",
  local_armazenamento: "",
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
        fetch(`${API}/produtos`, { credentials: "include" }),
        fetch(`${API}/categorias`, { credentials: "include" }),
      ]);

      if (!resProdutos.ok || !resCategorias.ok) {
        throw new Error();
      }

      setProdutos(await resProdutos.json());
      setCategorias(await resCategorias.json());
    } catch {
      setErro(
        "Não foi possível carregar produtos e categorias. Verifique a API e a conexão com o banco de dados.",
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

    if (!Number.isInteger(Number(form.quantidade_minima))) {
      return "A quantidade mínima deve ser um número inteiro.";
    }

    if (form.quantidade_atual === "" || !Number.isInteger(Number(form.quantidade_atual)) || Number(form.quantidade_atual) < 0) {
      return "A quantidade em estoque deve ser um número inteiro igual ou maior que zero.";
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
        credentials: "include",
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        return setErro(dados.mensagem || dados.erro || "Não foi possível salvar.");
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
      quantidade_atual: String(produto.quantidade_atual ?? 0),
      local_armazenamento: produto.local_armazenamento || "",
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
        credentials: "include",
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        return setErro(dados.mensagem || dados.erro || "Não foi possível excluir.");
      }

      setMensagem(dados.mensagem);
      carregarDados();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }
  }

  return (
    <PortalLayout active="produtos" contentClassName="management-content">
      <section className="management-heading">
        <p className="home-eyebrow">DOAÇÕES E ESTOQUE</p>
        <h1>Cadastro de <span>produtos</span></h1>
        <p>Organize os itens, categorias e quantidades mínimas para apoiar as doações.</p>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div className="management-panel-title">
            <span className="management-panel-icon"><PackageOpen size={20} /></span>
            <div>
              <h2>{editando ? "Editar produto" : "Novo produto"}</h2>
              <p>Informações para identificar e acompanhar cada item.</p>
            </div>
          </div>
        </div>

        <form className="management-form" onSubmit={salvar}>
          <div className="management-form-grid management-form-grid--products">
            <label className="management-field" htmlFor="product-name">
              Nome do produto
              <input
                id="product-name"
                name="nome_item"
                value={form.nome_item}
                onChange={alterarCampo}
                placeholder="Ex.: Fralda descartável"
              />
            </label>

            <label className="management-field" htmlFor="product-size">
              Tamanho
              <input
                id="product-size"
                name="tamanho"
                value={form.tamanho}
                onChange={alterarCampo}
                placeholder="Ex.: P, M, G"
              />
            </label>

            <label className="management-field" htmlFor="product-unit">
              Unidade de medida
              <input
                id="product-unit"
                name="unidade_medida"
                value={form.unidade_medida}
                onChange={alterarCampo}
                placeholder="Ex.: unidade, pacote"
              />
            </label>

            <label className="management-field" htmlFor="product-minimum">
              Quantidade mínima
              <input
                id="product-minimum"
                type="number"
                min="1"
                step="1"
                name="quantidade_minima"
                value={form.quantidade_minima}
                onChange={alterarCampo}
              />
            </label>

            <label className="management-field" htmlFor="product-stock">
              Quantidade em estoque
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                name="quantidade_atual"
                value={form.quantidade_atual}
                onChange={alterarCampo}
              />
            </label>

            <label className="management-field" htmlFor="product-location">
              Local de armazenamento
              <input
                id="product-location"
                name="local_armazenamento"
                value={form.local_armazenamento}
                onChange={alterarCampo}
                placeholder="Ex.: Prateleira A"
              />
            </label>

            <label className="management-field" htmlFor="product-category">
              Categoria
              <select
                id="product-category"
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

          <div className="management-actions">
            <button className="management-button management-button--primary" type="submit">
              {editando ? <Save size={15} /> : <Plus size={15} />}
              {editando ? "Salvar alterações" : "Cadastrar"}
            </button>

            {editando && (
              <button
                type="button"
                className="management-button management-button--secondary"
                onClick={cancelarEdicao}
              >
                <X size={15} />
                Cancelar
              </button>
            )}
          </div>
        </form>

        {erro && <p aria-live="polite" className="management-notice management-notice--error">{erro}</p>}

        {mensagem && <p aria-live="polite" className="management-notice management-notice--success">{mensagem}</p>}
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>Produtos cadastrados</h2>
            <p>Catálogo de itens disponíveis para doação.</p>
          </div>
          <span className="management-count">{produtos.length} produto(s)</span>
        </div>

        {produtos.length === 0 ? (
          <p className="management-empty">Nenhum produto cadastrado.</p>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tamanho</th>
                  <th>Unidade</th>
                  <th>Mínimo</th>
                  <th>Estoque</th>
                  <th>Categoria</th>
                  <th>Local</th>
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
                    <td>{produto.quantidade_atual ?? 0}</td>
                    <td>{produto.nome_categoria}</td>
                    <td>{produto.local_armazenamento || "—"}</td>

                    <td>
                      <div className="management-row-actions">
                      <button
                        className="management-button btn-editar"
                        onClick={() => editar(produto)}
                      >
                        <Pencil size={13} />
                        Editar
                      </button>

                      <button
                        className="management-button btn-excluir"
                        onClick={() => excluir(produto.id_item)}
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalLayout>
  );
}

export default Products;
