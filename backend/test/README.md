# Testes de estoque

Requer Node.js 20+, dependências do backend e uma instância local de MySQL/MariaDB.
Use uma conta de teste com permissão de criar bancos e triggers:

```bash
TEST_DB_HOST=127.0.0.1 TEST_DB_PORT=3306 TEST_DB_USER=root TEST_DB_PASSWORD=sua_senha npm run test:integration
```

O teste cria um banco `dorcas_test_<pid>_<timestamp>`, aplica os scripts do repositório,
inicia a API em uma porta temporária e remove o banco ao terminar. Não utiliza o
`DB_NAME` da aplicação. Não precisa de dados pessoais nem de servidor já iniciado.

Cobre catálogo zerado, estorno, exclusão com vínculos, edição concorrente com entradas,
itens repetidos, rollback em falha de histórico e saídas simultâneas.
