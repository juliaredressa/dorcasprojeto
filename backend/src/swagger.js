module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Dorcas',
    version: '1.0.0',
    description: 'API para gerenciamento de categorias e produtos do projeto Dorcas.'
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
    { name: 'Produtos', description: 'Cadastro e gerenciamento de produtos.' }
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
        summary: 'Cadastra uma gestante para uma pessoa existente',
        requestBody: { $ref: '#/components/requestBodies/GestanteCadastro' },
        responses: {
          201: {
            description: 'Gestante cadastrada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoGestante' } } }
          },
          400: { $ref: '#/components/responses/ErroRequisicao' },
          404: { $ref: '#/components/responses/NaoEncontrado' },
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
          data_nascimento: { type: 'string', format: 'date' },
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
        required: ['id_pessoa', 'dpp', 'grau_vulnerabilidade', 'data_cadastro', 'situacao'],
        properties: {
          id_pessoa: { type: 'integer', example: 1 },
          dpp: { type: 'string', format: 'date', example: '2026-12-15' },
          grau_vulnerabilidade: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
          data_cadastro: { type: 'string', format: 'date', example: '2026-09-29' },
          situacao: { type: 'string', example: 'ativa' }
        }
      },
      GestanteAtualizacao: {
        type: 'object',
        required: ['dpp', 'grau_vulnerabilidade', 'data_cadastro', 'situacao'],
        properties: {
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