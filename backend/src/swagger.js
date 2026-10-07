module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Dorcas',
    version: '1.0.0',
    description: 'API do sistema Dorcas para gestão de gestantes, colaboradores, doações, estoque e kits.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local'
    }
  ],
  tags: [
    { name: 'Gestantes', description: 'Cadastro e gerenciamento de gestantes.' },
    { name: 'Categorias', description: 'Consulta de categorias de produtos.' },
    { name: 'Produtos', description: 'Cadastro e gerenciamento de produtos.' },
    { name: 'Colaboradores', description: 'Cadastro e gerenciamento de colaboradores.' },
    { name: 'Doações', description: 'Registro e consulta de doações recebidas.' },
    { name: 'Estoque', description: 'Movimentações de entrada e saída do estoque.' },
    { name: 'Fila de prioridade', description: 'Gerenciamento da fila de prioridade das gestantes.' },
    { name: 'Kits', description: 'Montagem, consulta e entrega de kits maternidade.' },
    { name: 'Autenticação', description: 'Login, sessão e alteração de senha.' },
    { name: 'Triagens', description: 'Cadastro e gerenciamento de triagens sociais.' }
  ],
  paths: {
    '/api/categorias': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista as categorias',
        responses: {
          200: {
            description: 'Categorias encontradas.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Categoria' }
                }
              }
            }
          },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      }
    },
    '/api/gestantes': {
      get: {
        tags: ['Gestantes'],
        summary: 'Lista as gestantes',
        responses: {
          200: {
            description: 'Gestantes encontradas.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Gestante' }
                }
              }
            }
          },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      post: {
        tags: ['Gestantes'],
        summary: 'Cadastra uma pessoa e sua gestação com identificador automático',
        requestBody: { $ref: '#/components/requestBodies/GestanteCadastro' },
        responses: {
          201: {
            description: 'Gestante cadastrada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoGestante' } } }
          },
          400: { $ref: '#/components/responses/ErroRequisicao' },
          409: { $ref: '#/components/responses/Conflito' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      }
    },
    '/api/gestantes/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador da pessoa gestante.',
          schema: { type: 'integer' }
        }
      ],
      get: {
        tags: ['Gestantes'],
        summary: 'Busca uma gestante pelo identificador da pessoa',
        responses: {
          200: {
            description: 'Gestante encontrada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Gestante' } } }
          },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      put: {
        tags: ['Gestantes'],
        summary: 'Atualiza os dados da gestante',
        requestBody: { $ref: '#/components/requestBodies/GestanteAtualizacao' },
        responses: {
          200: {
            description: 'Gestante atualizada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoGestante' } } }
          },
          400: { $ref: '#/components/responses/ErroRequisicao' },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      delete: {
        tags: ['Gestantes'],
        summary: 'Exclui uma gestante pelo identificador da pessoa',
        responses: {
          200: {
            description: 'Gestante excluída.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoGestante' } } }
          },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      }
    },
    '/api/produtos': {
      get: {
        tags: ['Produtos'],
        summary: 'Lista os produtos',
        responses: {
          200: {
            description: 'Produtos encontrados.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Produto' }
                }
              }
            }
          },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      post: {
        tags: ['Produtos'],
        summary: 'Cadastra um produto',
        requestBody: { $ref: '#/components/requestBodies/Produto' },
        responses: {
          201: {
            description: 'Produto cadastrado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Resultado' } } }
          },
          400: { $ref: '#/components/responses/ErroRequisicao' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      }
    },
    '/api/produtos/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Identificador do produto.',
          schema: { type: 'integer' }
        }
      ],
      get: {
        tags: ['Produtos'],
        summary: 'Busca um produto pelo identificador',
        responses: {
          200: {
            description: 'Produto encontrado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Produto' } } }
          },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualiza um produto',
        requestBody: { $ref: '#/components/requestBodies/Produto' },
        responses: {
          200: {
            description: 'Produto atualizado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Resultado' } } }
          },
          400: { $ref: '#/components/responses/ErroRequisicao' },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Exclui um produto',
        responses: {
          200: {
            description: 'Produto excluído.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Resultado' } } }
          },
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          500: { $ref: '#/components/responses/ErroServidor' }
        }
      }
    }
  },
  components: {
    schemas: {
      Categoria: {
        type: 'object',
        properties: {
          id_categoria: { type: 'integer' },
          nome_categoria: { type: 'string' }
        }
      },
      Gestante: {
        type: 'object',
        properties: {
          id_pessoa: { type: 'integer' },
          nome: { type: 'string' },
          cpf: { type: 'string' },
          telefone: { type: 'string' },
          endereco: { type: 'string' },
          dpp: { type: 'string', format: 'date' },
          grau_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5 },
          data_cadastro: { type: 'string', format: 'date' },
          situacao: { type: 'string' }
        }
      },
      GestanteCadastro: {
        type: 'object',
        required: ['nome', 'cpf', 'dpp', 'grau_vulnerabilidade', 'data_cadastro', 'situacao'],
        properties: {
          nome: { type: 'string', maxLength: 150, example: 'Maria da Silva' },
          cpf: { type: 'string', maxLength: 14, example: '123.456.789-00' },
          telefone: { type: 'string', maxLength: 20, nullable: true },
          endereco: { type: 'string', maxLength: 255, nullable: true },
          dpp: { type: 'string', format: 'date', example: '2026-12-15' },
          grau_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
          data_cadastro: { type: 'string', format: 'date', example: '2026-09-29' },
          situacao: { type: 'string', example: 'ativa' }
        }
      },
      GestanteAtualizacao: {
        type: 'object',
        required: ['nome', 'cpf', 'dpp', 'grau_vulnerabilidade', 'data_cadastro', 'situacao'],
        properties: {
          nome: { type: 'string', maxLength: 150, example: 'Maria da Silva' },
          cpf: { type: 'string', maxLength: 14, example: '123.456.789-00' },
          telefone: { type: 'string', maxLength: 20, nullable: true },
          endereco: { type: 'string', maxLength: 255, nullable: true },
          dpp: { type: 'string', format: 'date', example: '2026-12-15' },
          grau_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
          data_cadastro: { type: 'string', format: 'date', example: '2026-09-29' },
          situacao: { type: 'string', example: 'ativa' }
        }
      },
      Produto: {
        type: 'object',
        properties: {
          id_item: { type: 'integer' },
          nome_item: { type: 'string' },
          tamanho: { type: 'string', nullable: true },
          unidade_medida: { type: 'string' },
          quantidade_minima: { type: 'integer' },
          id_categoria: { type: 'integer' },
          nome_categoria: { type: 'string' }
        }
      },
      ProdutoInput: {
        type: 'object',
        required: ['nome_item', 'unidade_medida', 'quantidade_minima', 'id_categoria'],
        properties: {
          nome_item: { type: 'string', example: 'Fralda descartável' },
          tamanho: { type: 'string', nullable: true, example: 'M' },
          unidade_medida: { type: 'string', example: 'pacote' },
          quantidade_minima: { type: 'integer', minimum: 1, example: 10 },
          id_categoria: { type: 'integer', example: 1 }
        }
      },
      Resultado: {
        type: 'object',
        properties: {
          id_item: { type: 'integer' },
          mensagem: { type: 'string' }
        }
      },
      ResultadoGestante: {
        type: 'object',
        properties: {
          id_pessoa: { type: 'integer', description: 'Gerado automaticamente pelo banco de dados.' },
          mensagem: { type: 'string' }
        }
      },
      Erro: {
        type: 'object',
        properties: {
          mensagem: { type: 'string' },
          erro: { type: 'string' }
        }
      }
    },
    requestBodies: {
      GestanteCadastro: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/GestanteCadastro' } } }
      },
      GestanteAtualizacao: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/GestanteAtualizacao' } } }
      },
      Produto: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ProdutoInput' } } }
      }
    },
    responses: {
      ErroRequisicao: {
        description: 'Dados inválidos ou categoria inexistente.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
      },
      NaoEncontrado: {
        description: 'Registro não encontrado.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
      },
      Conflito: {
        description: 'O produto está associado a outro registro.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
      },
      ErroServidor: {
        description: 'Erro interno ou falha no banco de dados.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
      }
    }
  }
};

const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } }
});

const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name) => ({ $ref: `#/components/responses/${name}` });
const requestBodyRef = (name) => ({ $ref: `#/components/requestBodies/${name}` });

function crudPaths({ basePath, tag, resource, schema, detailSchema = schema, input, updateInput = input, result, conflict }) {
  const idParameter = {
    name: 'id',
    in: 'path',
    required: true,
    description: `Identificador do registro de ${resource}.`,
    schema: { type: 'integer', minimum: 1 }
  };

  return {
    [basePath]: {
      get: {
        tags: [tag],
        summary: `Lista ${resource}`,
        responses: {
          200: jsonResponse(`${resource} encontrados.`, {
            type: 'array',
            items: schemaRef(schema)
          }),
          500: responseRef('ErroServidor')
        }
      },
      post: {
        tags: [tag],
        summary: `Cadastra ${resource}`,
        requestBody: requestBodyRef(input),
        responses: {
          201: jsonResponse(`Registro de ${resource} cadastrado.`, schemaRef(result)),
          400: responseRef('ErroRequisicao'),
          404: responseRef('NaoEncontrado'),
          409: responseRef('Conflito'),
          500: responseRef('ErroServidor')
        }
      }
    },
    [`${basePath}/{id}`]: {
      parameters: [idParameter],
      get: {
        tags: [tag],
        summary: `Busca um registro de ${resource}`,
        responses: {
          200: jsonResponse(`${resource} encontrado.`, schemaRef(detailSchema)),
          404: responseRef('NaoEncontrado'),
          500: responseRef('ErroServidor')
        }
      },
      put: {
        tags: [tag],
        summary: `Atualiza um registro de ${resource}`,
        requestBody: requestBodyRef(updateInput),
        responses: {
          200: jsonResponse(`Registro de ${resource} atualizado.`, schemaRef(result)),
          400: responseRef('ErroRequisicao'),
          404: responseRef('NaoEncontrado'),
          409: responseRef('Conflito'),
          500: responseRef('ErroServidor')
        }
      },
      delete: {
        tags: [tag],
        summary: `Exclui um registro de ${resource}`,
        responses: {
          200: jsonResponse(`Registro de ${resource} excluído.`, schemaRef(result)),
          404: responseRef('NaoEncontrado'),
          ...(conflict ? { 409: responseRef('Conflito') } : {}),
          500: responseRef('ErroServidor')
        }
      }
    }
  };
}

Object.assign(module.exports.paths, {
  '/': {
    get: {
      tags: ['Status'],
      summary: 'Verifica se a API está ativa',
      responses: {
        200: jsonResponse('API funcionando.', schemaRef('StatusApi'))
      }
    }
  },
  ...crudPaths({
    basePath: '/api/colaboradores',
    tag: 'Colaboradores',
    resource: 'colaboradores',
    schema: 'Colaborador',
    input: 'Colaborador',
    result: 'ResultadoColaborador',
    conflict: true
  }),
  '/api/doacoes': {
    get: {
      tags: ['Doações'],
      summary: 'Lista as doações',
      responses: {
        200: jsonResponse('Doações encontradas.', {
          type: 'array',
          items: schemaRef('Doacao')
        }),
        500: responseRef('ErroServidor')
      }
    },
    post: {
      tags: ['Doações'],
      summary: 'Registra uma doação e atualiza o estoque',
      requestBody: requestBodyRef('Doacao'),
      responses: {
        201: jsonResponse('Doação cadastrada.', schemaRef('ResultadoDoacao')),
        400: responseRef('ErroRequisicao'),
        404: responseRef('NaoEncontrado'),
        500: responseRef('ErroServidor')
      }
    }
  },
  '/api/doacoes/{id}': {
    parameters: [{
      name: 'id',
      in: 'path',
      required: true,
      description: 'Identificador da doação.',
      schema: { type: 'integer', minimum: 1 }
    }],
    get: {
      tags: ['Doações'],
      summary: 'Busca uma doação e seus itens',
      responses: {
        200: jsonResponse('Doação encontrada.', schemaRef('DoacaoDetalhe')),
        404: responseRef('NaoEncontrado'),
        500: responseRef('ErroServidor')
      }
    },
    delete: {
      tags: ['Doações'],
      summary: 'Exclui uma doação',
      responses: {
        200: jsonResponse('Doação excluída.', schemaRef('Resultado')),
        404: responseRef('NaoEncontrado'),
        500: responseRef('ErroServidor')
      }
    }
  },
  '/api/estoque/entrada': {
    post: {
      tags: ['Estoque'],
      summary: 'Registra entrada de um item no estoque',
      requestBody: requestBodyRef('MovimentacaoEstoque'),
      responses: {
        200: jsonResponse('Entrada registrada.', schemaRef('Resultado')),
        400: responseRef('ErroRequisicao')
      }
    }
  },
  '/api/estoque/saida': {
    post: {
      tags: ['Estoque'],
      summary: 'Registra saída de um item do estoque',
      requestBody: requestBodyRef('MovimentacaoEstoque'),
      responses: {
        200: jsonResponse('Saída registrada.', schemaRef('Resultado')),
        400: responseRef('ErroRequisicao')
      }
    }
  },
  ...crudPaths({
    basePath: '/api/fila-prioridade',
    tag: 'Fila de prioridade',
    resource: 'registros da fila',
    schema: 'FilaPrioridade',
    input: 'FilaPrioridadeCadastro',
    updateInput: 'FilaPrioridadeAtualizacao',
    result: 'Resultado'
  }),
  ...crudPaths({
    basePath: '/api/kits',
    tag: 'Kits',
    resource: 'kits',
    schema: 'Kit',
    detailSchema: 'KitDetalhe',
    input: 'KitCadastro',
    updateInput: 'KitAtualizacao',
    result: 'ResultadoKit'
  }),
  '/api/login': {
    post: {
      tags: ['Autenticação'],
      summary: 'Inicia uma sessão',
      requestBody: requestBodyRef('Login'),
      responses: {
        200: jsonResponse('Login realizado.', schemaRef('LoginResultado')),
        400: responseRef('ErroRequisicao'),
        401: responseRef('NaoAutorizado'),
        500: responseRef('ErroServidor')
      }
    }
  },
  '/api/login/verificar': {
    get: {
      tags: ['Autenticação'],
      summary: 'Verifica a sessão atual',
      security: [{ cookieSession: [] }],
      responses: {
        200: jsonResponse('Sessão autenticada.', schemaRef('Sessao')),
        401: responseRef('NaoAutorizado')
      }
    }
  },
  '/api/login/logout': {
    post: {
      tags: ['Autenticação'],
      summary: 'Encerra a sessão atual',
      responses: {
        200: jsonResponse('Logout realizado.', schemaRef('Resultado')),
        500: responseRef('ErroServidor')
      }
    }
  },
  '/api/login/alterar-senha': {
    put: {
      tags: ['Autenticação'],
      summary: 'Altera a senha do usuário autenticado',
      security: [{ cookieSession: [] }],
      requestBody: requestBodyRef('AlterarSenha'),
      responses: {
        200: jsonResponse('Senha alterada.', schemaRef('Resultado')),
        400: responseRef('ErroRequisicao'),
        401: responseRef('NaoAutorizado'),
        404: responseRef('NaoEncontrado'),
        500: responseRef('ErroServidor')
      }
    }
  },
  ...crudPaths({
    basePath: '/api/triagens',
    tag: 'Triagens',
    resource: 'triagens',
    schema: 'Triagem',
    input: 'Triagem',
    result: 'Resultado'
  })
});

module.exports.tags.unshift({ name: 'Status', description: 'Verificação de disponibilidade da API.' });

Object.assign(module.exports.components.schemas, {
  StatusApi: {
    type: 'object',
    properties: { mensagem: { type: 'string', example: 'API DorcasGestão funcionando!' } }
  },
  Colaborador: {
    type: 'object',
    required: ['nome', 'cpf', 'cargo', 'data_admissao'],
    properties: {
      id_pessoa: { type: 'integer', readOnly: true, description: 'ID de cadastro gerado automaticamente.' },
      nome: { type: 'string' },
      cpf: { type: 'string' },
      telefone: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email', nullable: true },
      endereco: { type: 'string', nullable: true },
      cargo: {
        type: 'string',
        enum: ['Administrador(a)', 'Assistente social', 'Auxiliar administrativo(a)', 'Coordenador(a)', 'Educador(a) social', 'Psicólogo(a)', 'Recepcionista', 'Outro']
      },
      data_admissao: { type: 'string', format: 'date' }
    }
  },
  Doacao: {
    type: 'object',
    properties: {
      id_doacao: { type: 'integer' },
      data_doacao: { type: 'string', format: 'date' },
      id_doador: { type: 'integer' },
      nome_doador: { type: 'string' },
      id_funcionario: { type: 'integer' },
      nome_funcionario: { type: 'string' }
    }
  },
  ItemDoacao: {
    type: 'object',
    required: ['id_item', 'quantidade'],
    properties: {
      id_item: { type: 'integer' },
      nome_item: { type: 'string' },
      quantidade: { type: 'integer', minimum: 1 }
    }
  },
  DoacaoDetalhe: {
    allOf: [
      schemaRef('Doacao'),
      {
        type: 'object',
        properties: { itens: { type: 'array', items: schemaRef('ItemDoacao') } }
      }
    ]
  },
  DoacaoInput: {
    type: 'object',
    required: ['data_doacao', 'id_doador', 'id_funcionario', 'itens'],
    properties: {
      data_doacao: { type: 'string', format: 'date', example: '2026-10-06' },
      id_doador: { type: 'integer', example: 1 },
      id_funcionario: { type: 'integer', example: 2 },
      itens: { type: 'array', minItems: 1, items: schemaRef('ItemDoacao') }
    }
  },
  ResultadoDoacao: {
    type: 'object',
    properties: {
      id_doacao: { type: 'integer' },
      mensagem: { type: 'string' }
    }
  },
  MovimentacaoEstoque: {
    type: 'object',
    required: ['id_item', 'quantidade'],
    properties: {
      id_item: { type: 'integer', example: 1 },
      quantidade: { type: 'integer', minimum: 1, example: 5 }
    }
  },
  FilaPrioridade: {
    type: 'object',
    properties: {
      id_fila: { type: 'integer' },
      posicao_fila: { type: 'integer' },
      data_calculo: { type: 'string', format: 'date' },
      id_gestante: { type: 'integer' },
      nome_gestante: { type: 'string' },
      grau_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5 }
    }
  },
  FilaPrioridadeInput: {
    type: 'object',
    required: ['posicao_fila', 'data_calculo', 'id_gestante'],
    properties: {
      posicao_fila: { type: 'integer', minimum: 1 },
      data_calculo: { type: 'string', format: 'date' },
      id_gestante: { type: 'integer' }
    }
  },
  FilaPrioridadeAtualizacao: {
    type: 'object',
    required: ['posicao_fila', 'data_calculo'],
    properties: {
      posicao_fila: { type: 'integer', minimum: 1 },
      data_calculo: { type: 'string', format: 'date' }
    }
  },
  Kit: {
    type: 'object',
    properties: {
      id_kit: { type: 'integer' },
      data_montagem: { type: 'string', format: 'date', nullable: true },
      status: { type: 'string' },
      data_entrega: { type: 'string', format: 'date', nullable: true },
      id_gestante: { type: 'integer' },
      nome_gestante: { type: 'string' },
      id_funcionario: { type: 'integer' },
      nome_funcionario: { type: 'string' }
    }
  },
  KitDetalhe: {
    allOf: [
      schemaRef('Kit'),
      {
        type: 'object',
        properties: { itens: { type: 'array', items: schemaRef('ItemDoacao') } }
      }
    ]
  },
  KitCadastro: {
    type: 'object',
    required: ['status', 'id_gestante', 'id_funcionario', 'itens'],
    properties: {
      data_montagem: { type: 'string', format: 'date', nullable: true },
      status: { type: 'string', example: 'montado' },
      data_entrega: { type: 'string', format: 'date', nullable: true },
      id_gestante: { type: 'integer' },
      id_funcionario: { type: 'integer' },
      itens: { type: 'array', minItems: 1, items: schemaRef('ItemDoacao') }
    }
  },
  KitAtualizacao: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string' },
      data_entrega: { type: 'string', format: 'date', nullable: true }
    }
  },
  ResultadoKit: {
    type: 'object',
    properties: { id_kit: { type: 'integer' }, mensagem: { type: 'string' } }
  },
  Triagem: {
    type: 'object',
    properties: {
      id_triagem: { type: 'integer' },
      data_triagem: { type: 'string', format: 'date' },
      nota_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5 },
      observacoes: { type: 'string', nullable: true },
      id_gestante: { type: 'integer' },
      nome_gestante: { type: 'string' },
      id_funcionario: { type: 'integer' }
    }
  },
  TriagemInput: {
    type: 'object',
    required: ['data_triagem', 'nota_vulnerabilidade', 'id_gestante', 'id_funcionario'],
    properties: {
      data_triagem: { type: 'string', format: 'date' },
      nota_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5 },
      observacoes: { type: 'string', nullable: true },
      id_gestante: { type: 'integer' },
      id_funcionario: { type: 'integer' }
    }
  },
  Login: {
    type: 'object',
    required: ['login', 'senha'],
    properties: {
      login: { type: 'string', example: 'usuario' },
      senha: { type: 'string', format: 'password', example: 'senha123' }
    }
  },
  UsuarioSessao: {
    type: 'object',
    properties: {
      id_usuario: { type: 'integer' },
      login: { type: 'string' },
      id_funcionario: { type: 'integer' },
      nome: { type: 'string' },
      cargo: { type: 'string' },
      matricula: { type: 'string' }
    }
  },
  LoginResultado: {
    type: 'object',
    properties: {
      mensagem: { type: 'string' },
      usuario: schemaRef('UsuarioSessao')
    }
  },
  Sessao: {
    type: 'object',
    properties: {
      logado: { type: 'boolean' },
      usuario: schemaRef('UsuarioSessao')
    }
  },
  AlterarSenha: {
    type: 'object',
    required: ['senhaAtual', 'novaSenha'],
    properties: {
      senhaAtual: { type: 'string', format: 'password' },
      novaSenha: { type: 'string', format: 'password', minLength: 6 }
    }
  },
  ResultadoColaborador: {
    type: 'object',
    properties: { id_pessoa: { type: 'integer' }, mensagem: { type: 'string' } }
  }
});

Object.assign(module.exports.components.requestBodies, {
  Colaborador: {
    required: true,
    content: { 'application/json': { schema: schemaRef('Colaborador') } }
  },
  Doacao: {
    required: true,
    content: { 'application/json': { schema: schemaRef('DoacaoInput') } }
  },
  MovimentacaoEstoque: {
    required: true,
    content: { 'application/json': { schema: schemaRef('MovimentacaoEstoque') } }
  },
  FilaPrioridadeCadastro: {
    required: true,
    content: { 'application/json': { schema: schemaRef('FilaPrioridadeInput') } }
  },
  FilaPrioridadeAtualizacao: {
    required: true,
    content: { 'application/json': { schema: schemaRef('FilaPrioridadeAtualizacao') } }
  },
  KitCadastro: {
    required: true,
    content: { 'application/json': { schema: schemaRef('KitCadastro') } }
  },
  KitAtualizacao: {
    required: true,
    content: { 'application/json': { schema: schemaRef('KitAtualizacao') } }
  },
  Triagem: {
    required: true,
    content: { 'application/json': { schema: schemaRef('TriagemInput') } }
  },
  Login: {
    required: true,
    content: { 'application/json': { schema: schemaRef('Login') } }
  },
  AlterarSenha: {
    required: true,
    content: { 'application/json': { schema: schemaRef('AlterarSenha') } }
  }
});

module.exports.components.responses.NaoAutorizado = {
  description: 'Credenciais inválidas ou sessão não autenticada.',
  content: { 'application/json': { schema: schemaRef('Erro') } }
};

module.exports.components.securitySchemes = {
  cookieSession: {
    type: 'apiKey',
    in: 'cookie',
    name: 'connect.sid',
    description: 'Cookie de sessão criado pelo endpoint de login.'
  }
};