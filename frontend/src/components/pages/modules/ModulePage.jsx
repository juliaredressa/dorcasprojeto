import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardCheck,
  Eye,
  Gift,
  HandHeart,
  ListOrdered,
  PackageOpen,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react';
import PortalLayout from '../../layout/PortalLayout';
import { moduleConfig } from './moduleConfig';
import { API_BASE } from '../../../api';

const API = API_BASE;

const icons = {
  UsersRound,
  HandHeart,
  ArrowLeftRight,
  ListOrdered,
  Gift,
  ClipboardCheck,
};

const labelOverrides = {
  id_doacao: 'Número da doação',
  id_funcionario: 'ID do colaborador',
  id_gestante: 'ID da gestante',
  id_item: 'ID do item',
  id_kit: 'Número do kit',
  id_pessoa: 'ID de cadastro',
  id_triagem: 'Número da triagem',
  nome_funcionario: 'Colaborador responsável',
  nome_gestante: 'Gestante',
  nome_item: 'Item',
  nota_vulnerabilidade: 'Nota de vulnerabilidade',
  posicao_fila: 'Posição na fila',
  data_calculo: 'Data do cálculo',
  data_doacao: 'Data da doação',
  data_entrega: 'Data de entrega',
  data_montagem: 'Data de montagem',
  data_triagem: 'Data da triagem',
  grau_vulnerabilidade: 'Grau de vulnerabilidade',
};

function formatDate(value) {
  if (!value) return 'Não informada';
  return String(value).slice(0, 10);
}

function formatLabel(key) {
  return labelOverrides[key] || key.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

async function request(path, options) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.mensagem || data.erro || 'Não foi possível concluir a operação.');
  }

  return data;
}

function emptyForm(fields) {
  return Object.fromEntries(fields.map(({ name }) => [name, '']));
}

function getInputValue(value, type) {
  if (value === null || value === undefined) return '';
  if (type === 'date') return formatDate(value);
  return String(value);
}

function ModulePage({ module }) {
  const config = moduleConfig[module];

  if (!config) return null;
  if (config.mode === 'stock') return <StockPage config={config} />;

  return <ResourcePage config={config} />;
}

function ResourcePage({ config }) {
  const Icon = icons[config.icon] || PackageOpen;
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => emptyForm(config.fields));
  const [itemRows, setItemRows] = useState([{ id_item: '', quantidade: '' }]);
  const [selectOptions, setSelectOptions] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(config.list));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [message, setMessage] = useState('');

  async function loadRows() {
    setLoading(true);
    setError('');

    try {
      const data = await request(config.apiPath);
      setRows(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [config.apiPath]);

  useEffect(() => {
    let active = true;
    const optionFields = config.fields.filter((field) => field.optionsApiPath);

    async function loadOptions() {
      const failures = [];
      const results = await Promise.all(optionFields.map(async (field) => {
        try {
          const data = await request(field.optionsApiPath);
          if (!Array.isArray(data)) {
            throw new Error(`A resposta de ${field.label} está inválida.`);
          }
          return [field.name, data];
        } catch (requestError) {
          failures.push(`${field.label}: ${requestError.message}`);
          return [field.name, []];
        }
      }));

      let availableItems = [];
      if (config.withItems) {
        try {
          availableItems = await request('/doacoes/itens-disponiveis');
          if (!Array.isArray(availableItems)) {
            throw new Error('A resposta dos itens está inválida.');
          }
        } catch (requestError) {
          failures.push(`Itens da doação: ${requestError.message}`);
        }
      }

      if (active) {
        setSelectOptions({ ...Object.fromEntries(results), __items: availableItems });
        setOptionsError(failures.join(' '));
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [config.apiPath]);

  const currentFields = editingId !== null && config.editFields ? config.editFields : config.fields;

  function resetForm() {
    setForm(emptyForm(config.fields));
    setItemRows([{ id_item: '', quantidade: '' }]);
    setEditingId(null);
  }

  function setField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing(row) {
    const fields = config.editFields || config.fields;
    setForm(Object.fromEntries(fields.map(({ name, type, options }) => {
      const value = getInputValue(row[name], type);
      return [name, type === 'select' && options && !options.includes(value) ? 'Outro' : value];
    })));
    setEditingId(row[config.idField]);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildPayload() {
    const payload = Object.fromEntries(currentFields.map(({ name, type }) => [
      name,
      type === 'number' ? Number(form[name])
        : type === 'resource-select' ? (form[name] ? Number(form[name]) : null)
          : form[name],
    ]));

    if (config.withItems && editingId === null) {
      payload.itens = itemRows.map((item) => ({
        id_item: Number(item.id_item),
        quantidade: Number(item.quantidade),
      }));
    }

    return payload;
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (config.withItems && editingId === null && itemRows.some((item) => !item.id_item || !item.quantidade || Number(item.quantidade) < 1)) {
      setError('Selecione um item e informe uma quantidade maior que zero para cada item.');
      setSaving(false);
      return;
    }

    try {
      const path = editingId === null ? config.apiPath : `${config.apiPath}/${editingId}`;
      const data = await request(path, {
        method: editingId === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      setMessage(data.mensagem || `${config.singular} salvo com sucesso.`);
      resetForm();
      await loadRows();
      if (config.withItems) {
        try {
          const availableItems = await request('/doacoes/itens-disponiveis');
          setSelectOptions((current) => ({ ...current, __items: availableItems }));
          setOptionsError('');
        } catch (requestError) {
          setOptionsError(`Itens da doação: ${requestError.message}`);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function showDetail(id) {
    setError('');
    setMessage('');

    try {
      setDetail(await request(`${config.apiPath}/${id}`));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeRow(row) {
    if (!window.confirm(`Deseja realmente excluir este(a) ${config.singular}?`)) return;

    setError('');
    setMessage('');

    try {
      const data = await request(`${config.apiPath}/${row[config.idField]}`, { method: 'DELETE' });
      setMessage(data.mensagem || `${config.singular} excluído(a) com sucesso.`);
      await loadRows();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function updateItem(index, key, value) {
    setItemRows((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )));
  }

  function renderField(field) {
    const commonProps = {
      id: `${config.apiPath.slice(1).replaceAll('/', '-')}-${field.name}`,
      name: field.name,
      required: field.required,
      min: field.min,
      max: field.max,
      value: form[field.name] ?? '',
      onChange: (event) => setField(field.name, event.target.value),
      placeholder: field.placeholder,
    };

    return (
      <label className="management-field" htmlFor={commonProps.id} key={field.name}>
        {field.label}
        {field.type === 'textarea' ? (
          <textarea {...commonProps} rows="3" />
        ) : field.type === 'select' ? (
          <select {...commonProps}>
            <option value="">{field.placeholder || 'Selecione'}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'resource-select' ? (
          <select {...commonProps} required={Boolean(field.required)}>
            <option value="">
              {selectOptions[field.name]?.length
                ? `Selecione ${field.label.toLowerCase()}`
                : field.emptyOptionsLabel || `Nenhuma opção disponível`}
            </option>
            {(selectOptions[field.name] || []).map((option) => (
              <option key={option[field.optionValue]} value={option[field.optionValue]}>
                {option[field.optionLabel]}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...commonProps}
            placeholder={field.placeholder}
            type={field.type || 'text'}
          />
        )}
      </label>
    );
  }

  function renderCell(row, column) {
    const value = row[column.key];
    if (column.type === 'items') {
      if (!Array.isArray(value) || value.length === 0) return '—';
      return (
        <ul className="management-table-items">
          {value.map((item) => (
            <li key={item.id_item}>{item.nome_item} ({item.quantidade})</li>
          ))}
        </ul>
      );
    }
    if (value === null || value === undefined || value === '') return '—';
    if (column.type === 'date') return formatDate(value);
    if (column.type === 'status') {
      const stateClass = String(value).toLowerCase().replace(/[^a-z0-9-]/g, '');
      return <span className={`management-status management-status--${stateClass}`}>{value}</span>;
    }
    return value;
  }

  return (
    <PortalLayout active={config.navKey || config.apiPath.slice(1)} contentClassName="management-content">
      <section className="management-heading">
        <p className="home-eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div className="management-panel-title">
            <span className="management-panel-icon"><Icon size={20} /></span>
            <div>
              <h2>{editingId === null ? config.createTitle : `Editar ${config.singular}`}</h2>
              <p>{config.withItems && editingId === null ? 'Informe os dados e adicione os itens.' : 'Preencha os campos necessários para salvar.'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={save}>
          <div className={`management-form-grid${currentFields.length >= 5 ? ' management-form-grid--products' : ''}`}>
            {currentFields.map(renderField)}
          </div>

          {config.withItems && editingId === null && (
            <fieldset className="module-items-fieldset">
              <legend>Itens da {config.singular}</legend>
              {selectOptions.__items?.length === 0 && !optionsError && (
                <p className="management-empty">
                  Nenhum produto tem estoque disponível. Registre uma entrada na tela de{' '}
                  <a href="/estoque">Estoque</a>.
                </p>
              )}
              <div className="module-items-list">
                {itemRows.map((item, index) => {
                  const selectedStockItem = selectOptions.__items?.find(
                    (option) => String(option.id_item) === item.id_item
                  );
                  return (
                  <div className="module-item-row" key={`item-${index}`}>
                    <label className="management-field" htmlFor={`${config.apiPath}-item-${index}`}>
                      Item
                      <select
                        id={`${config.apiPath}-item-${index}`}
                        required
                        value={item.id_item}
                        onChange={(event) => updateItem(index, 'id_item', event.target.value)}
                      >
                                    <option value="">
                                      {selectOptions.__items?.length
                                        ? 'Selecione um item'
                                        : 'Nenhum produto com estoque disponível'}
                                    </option>
                        {(selectOptions.__items || []).map((option) => (
                          <option key={option.id_item} value={option.id_item}>
                            {option.nome_item} — estoque: {option.quantidade_atual} {option.unidade_medida}
                          </option>
                        ))}
                      </select>
                      {item.id_item && (
                        <span className="management-field-help">
                          Em estoque: {selectedStockItem?.quantidade_atual ?? 0} {selectedStockItem?.unidade_medida}
                        </span>
                      )}
                    </label>
                    <label className="management-field" htmlFor={`${config.apiPath}-quantity-${index}`}>
                      Quantidade
                      <input
                        id={`${config.apiPath}-quantity-${index}`}
                        min="1"
                        max={selectedStockItem?.quantidade_atual}
                        required
                        type="number"
                        value={item.quantidade}
                        onChange={(event) => updateItem(index, 'quantidade', event.target.value)}
                      />
                    </label>
                    <button
                      aria-label={`Remover item ${index + 1}`}
                      className="management-icon-button module-item-remove"
                      disabled={itemRows.length === 1}
                      onClick={() => setItemRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      title="Remover item"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  );
                })}
              </div>
              <button
                className="management-button management-button--secondary module-add-item"
                onClick={() => setItemRows((current) => [...current, { id_item: '', quantidade: '' }])}
                type="button"
              >
                <Plus size={15} /> Adicionar item
              </button>
            </fieldset>
          )}

          <div className="management-actions">
            <button className="management-button management-button--primary" disabled={saving} type="submit">
              {editingId === null ? <Plus size={15} /> : <Save size={15} />}
              {saving ? 'Salvando...' : editingId === null ? 'Cadastrar' : 'Salvar alterações'}
            </button>
            {editingId !== null && (
              <button className="management-button management-button--secondary" onClick={resetForm} type="button">
                <X size={15} /> Cancelar
              </button>
            )}
          </div>
        </form>

        {(error || optionsError) && (
          <p aria-live="polite" className="management-notice management-notice--error">
            {[error, optionsError].filter(Boolean).join(' ')}
          </p>
        )}
        {message && <p aria-live="polite" className="management-notice management-notice--success">{message}</p>}
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>{config.listTitle || `${config.title} cadastrados`}</h2>
            <p>Registros disponíveis no sistema.</p>
          </div>
          <div className="module-list-tools">
            <span className="management-count">{rows.length} registro(s)</span>
            <button
              aria-label={`Atualizar lista de ${config.title.toLowerCase()}`}
              className="management-icon-button"
              onClick={loadRows}
              title="Atualizar lista"
              type="button"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="management-empty">Carregando registros...</p>
        ) : rows.length === 0 ? (
          <p className="management-empty">Nenhum registro encontrado.</p>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[config.idField]}>
                    {config.columns.map((column) => <td key={column.key}>{renderCell(row, column)}</td>)}
                    <td>
                      <div className="management-row-actions">
                        {config.detail && (
                          <button className="management-button management-button--secondary" onClick={() => showDetail(row[config.idField])} type="button">
                            <Eye size={13} /> Ver
                          </button>
                        )}
                        {config.editable && (
                          <button className="management-button btn-editar" onClick={() => startEditing(row)} type="button">
                            <Save size={13} /> Editar
                          </button>
                        )}
                        {config.deletable && (
                          <button className="management-button btn-excluir" onClick={() => removeRow(row)} type="button">
                            <Trash2 size={13} /> Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail && <DetailDialog detail={detail} onClose={() => setDetail(null)} />}
    </PortalLayout>
  );
}

function DetailDialog({ detail, onClose }) {
  return (
    <div className="module-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="module-detail-title" aria-modal="true" className="module-dialog" role="dialog">
        <div className="management-panel-heading">
          <div>
            <h2 id="module-detail-title">Detalhes do registro</h2>
            <p>Informações completas e itens vinculados.</p>
          </div>
          <button aria-label="Fechar detalhes" className="management-icon-button" onClick={onClose} type="button">
            <X size={17} />
          </button>
        </div>
        <dl className="module-detail-list">
          {Object.entries(detail).filter(([key]) => key !== 'itens').map(([key, value]) => (
            <div className="module-detail-entry" key={key}>
              <dt>{formatLabel(key)}</dt>
              <dd>
                {key.startsWith('data_') ? formatDate(value) : value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
        {Array.isArray(detail.itens) && (
          <div className="module-detail-items">
            <h3>Itens</h3>
            {detail.itens.length === 0 ? (
              <p>Nenhum item associado.</p>
            ) : (
              <ul>
                {detail.itens.map((item, index) => (
                  <li key={`${item.id_item}-${index}`}>
                    <span>{item.nome_item || `Item ${item.id_item}`}</span>
                    <strong>{item.quantidade} un.</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StockPage({ config }) {
  const [operation, setOperation] = useState('entrada');
  const [form, setForm] = useState({ id_item: '', quantidade: '' });
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await request('/produtos');
        if (!Array.isArray(data)) {
          throw new Error('A lista de produtos recebida é inválida.');
        }
        if (active) setProducts(data);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const data = await request(`/estoque/${operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_item: Number(form.id_item),
          quantidade: Number(form.quantidade),
        }),
      });
      setMessage(data.mensagem || 'Movimentação registrada.');
      setForm((current) => ({ ...current, quantidade: '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalLayout active="estoque" contentClassName="management-content">
      <section className="management-heading">
        <p className="home-eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="management-panel stock-panel">
        <div className="management-panel-heading">
          <div className="management-panel-title">
            <span className="management-panel-icon"><Warehouse size={20} /></span>
            <div>
              <h2>Registrar movimentação</h2>
              <p>Informe o item e a quantidade movimentada.</p>
            </div>
          </div>
        </div>

        <div aria-label="Tipo de movimentação" className="stock-segmented" role="group">
          <button
            aria-pressed={operation === 'entrada'}
            className={operation === 'entrada' ? 'stock-segment stock-segment--active' : 'stock-segment'}
            onClick={() => setOperation('entrada')}
            type="button"
          >
            <ArrowDownToLine size={16} /> Entrada
          </button>
          <button
            aria-pressed={operation === 'saida'}
            className={operation === 'saida' ? 'stock-segment stock-segment--active' : 'stock-segment'}
            onClick={() => setOperation('saida')}
            type="button"
          >
            <ArrowUpFromLine size={16} /> Saída
          </button>
        </div>

        <form onSubmit={save}>
          <div className="management-form-grid stock-form-grid">
            <label className="management-field" htmlFor="stock-item-id">
              Produto
              <select
                id="stock-item-id"
                required
                value={form.id_item}
                onChange={(event) => setForm((current) => ({ ...current, id_item: event.target.value }))}
              >
                <option value="">
                  {loadingProducts ? 'Carregando produtos...' : products.length ? 'Selecione um produto' : 'Nenhum produto cadastrado'}
                </option>
                {products.map((product) => (
                  <option key={product.id_item} value={product.id_item}>
                    {product.nome_item}{product.tamanho ? ` — ${product.tamanho}` : ''} ({product.unidade_medida})
                  </option>
                ))}
              </select>
            </label>
            <label className="management-field" htmlFor="stock-quantity">
              Quantidade
              <input
                id="stock-quantity"
                min="1"
                required
                type="number"
                value={form.quantidade}
                onChange={(event) => setForm((current) => ({ ...current, quantidade: event.target.value }))}
              />
            </label>
          </div>
          <div className="management-actions">
            <button className="management-button management-button--primary" disabled={saving} type="submit">
              {operation === 'entrada' ? <PackagePlus size={15} /> : <ArrowUpFromLine size={15} />}
              {saving ? 'Salvando...' : operation === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
            </button>
          </div>
        </form>

        {error && <p aria-live="polite" className="management-notice management-notice--error">{error}</p>}
        {message && <p aria-live="polite" className="management-notice management-notice--success">{message}</p>}
      </section>
    </PortalLayout>
  );
}

export default ModulePage;