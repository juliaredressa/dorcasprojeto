const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Cada execução usa e remove seu próprio banco. Nunca usa DB_NAME da aplicação.
const database = `dorcas_test_${process.pid}_${Date.now()}`;
let admin, db, server, base, cookie, logs = '';
const donation = { data_doacao: '2026-10-14', id_funcionario: 1 };
const productData = { nome_item: 'Produto teste', tamanho: 'P', unidade_medida: 'un', quantidade_minima: 1, id_categoria: 1 };

async function api(route, method = 'GET', data) {
    const response = await fetch(`${base}${route}`, {
        method, headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
        body: data === undefined ? undefined : JSON.stringify(data)
    });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, body: await response.json() };
}
async function product(stock) {
    const response = await api('/produtos', 'POST', { ...productData, quantidade_atual: stock });
    assert.equal(response.status, 201, JSON.stringify(response));
    return response.body.id_item;
}
async function balance(id) {
    const [rows] = await db.query('SELECT quantidade_atual FROM estoque WHERE id_item = ?', [id]);
    return rows[0]?.quantidade_atual ?? null;
}
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

before(async () => {
    const config = {
        host: process.env.TEST_DB_HOST || '127.0.0.1',
        port: Number(process.env.TEST_DB_PORT || 3306),
        user: process.env.TEST_DB_USER || 'root',
        password: process.env.TEST_DB_PASSWORD || '',
        multipleStatements: true
    };
    admin = await mysql.createConnection(config);
    const root = path.resolve(__dirname, '../..');
    const schema = fs.readFileSync(path.join(root, 'database.sql'), 'utf8').replaceAll('dorcas_gestao', database);
    await admin.query(schema);
    db = await mysql.createConnection({ ...config, database });
    await db.query(fs.readFileSync(path.join(root, 'backend/eventos-schema.sql'), 'utf8'));
    await db.query('ALTER TABLE usuario ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0');
    await db.query("INSERT INTO pessoa (nome,cpf) VALUES ('Responsavel teste','00000000001'),('Gestante teste','00000000002')");
    await db.query("INSERT INTO funcionario VALUES (1,'Administrador','TESTE','2026-10-14')");
    await db.query("INSERT INTO gestante (id_pessoa,dpp,grau_vulnerabilidade,data_cadastro,situacao) VALUES (2,'2026-12-01',1,'2026-10-14','ATIVA')");
    await db.query('INSERT INTO usuario (id_funcionario,login,senha,is_admin) VALUES (1,?,?,1)', ['teste-local', await bcrypt.hash('local-test-only', 10)]);
    await db.query("INSERT INTO categoria_item (nome_categoria) VALUES ('Teste')");
    const port = await new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.on('error', reject);
        probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)); });
    });
    base = `http://127.0.0.1:${port}/api`;
    server = spawn(process.execPath, ['src/server.js'], {
        cwd: path.join(root, 'backend'),
        env: { ...process.env, DB_HOST: config.host, DB_PORT: String(config.port), DB_USER: config.user, DB_PASSWORD: config.password, DB_NAME: database, PORT: String(port), SESSION_SECRET: 'integration-test-only' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    server.stdout.on('data', data => { logs += data; });
    server.stderr.on('data', data => { logs += data; });
    let ready = false;
    for (let i = 0; i < 100; i++) {
        try { await fetch(base.replace('/api', '/')); ready = true; break; } catch { await pause(100); }
    }
    assert.ok(ready, logs);
    assert.equal((await api('/login', 'POST', { login: 'teste-local', senha: 'local-test-only' })).status, 200);
});

after(async () => {
    if (server && server.exitCode === null) {
        const stopped = new Promise(resolve => server.once('exit', resolve));
        server.kill();
        await stopped;
    }
    if (db) await db.end();
    if (admin) {
        await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
        await admin.end();
    }
});

test('doações incluem produto zerado e tamanho; kits continuam filtrando pelo saldo', async () => {
    const id = await product(0);
    const all = await api('/doacoes/itens-disponiveis?todos=true');
    assert.equal(all.body.find(item => item.id_item === id).tamanho, 'P');
    assert.equal(all.body.find(item => item.id_item === id).quantidade_atual, 0);
    assert.equal((await api('/doacoes/itens-disponiveis')).body.some(item => item.id_item === id), false);
});

test('excluir doação estorna entrada; sem saldo, preserva doação e estoque', async () => {
    const id = await product(0);
    let result = await api('/doacoes', 'POST', { ...donation, itens: [{ id_item: id, quantidade: 5 }] });
    assert.equal(result.status, 201);
    assert.equal((await api(`/doacoes/${result.body.id_doacao}`, 'DELETE')).status, 200);
    assert.equal(await balance(id), 0);
    result = await api('/doacoes', 'POST', { ...donation, itens: [{ id_item: id, quantidade: 5 }] });
    await api('/estoque/saida', 'POST', { id_item: id, quantidade: 5 });
    assert.equal((await api(`/doacoes/${result.body.id_doacao}`, 'DELETE')).status, 400);
    assert.equal((await api(`/doacoes/${result.body.id_doacao}`)).status, 200);
    assert.equal(await balance(id), 0);
});

test('exclusão bloqueada preserva saldo; produto sem vínculos pode ser excluído', async () => {
    const id = await product(7);
    assert.equal((await api(`/produtos/${id}`, 'DELETE')).status, 409);
    assert.equal(await balance(id), 7);
    const empty = await product(0);
    assert.equal((await api(`/produtos/${empty}`, 'DELETE')).status, 200);
    assert.equal((await api(`/produtos/${empty}`)).status, 404);
});

test('editar cadastro não sobrescreve saldo atualizado por outra movimentação', async () => {
    const id = await product(10);
    const old = (await api(`/produtos/${id}`)).body;
    await api('/estoque/entrada', 'POST', { id_item: id, quantidade: 5 });
    assert.equal((await api(`/produtos/${id}`, 'PUT', { ...old, nome_item: 'Nome atualizado' })).status, 200);
    assert.equal(await balance(id), 15);
    assert.equal((await api('/produtos/999999', 'PUT', productData)).status, 404);
});

test('linhas repetidas são somadas na doação e no kit', async () => {
    const id = await product(10);
    const itens = [{ id_item: id, quantidade: 1 }, { id_item: id, quantidade: 2 }];
    assert.equal((await api('/doacoes', 'POST', { ...donation, itens })).status, 201);
    assert.equal(await balance(id), 13);
    const kit = await api('/kits', 'POST', { status: 'MONTADO', id_gestante: 2, id_funcionario: 1, itens });
    assert.equal(kit.status, 201);
    assert.equal(await balance(id), 10);
    assert.equal((await api(`/kits/${kit.body.id_kit}`)).body.itens[0].quantidade, 3);
});

test('falha no histórico desfaz entrada e saída manuais', async () => {
    const id = await product(10);
    await db.query("CREATE TRIGGER teste_falha BEFORE INSERT ON movimentacao_estoque FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Falha induzida no teste'");
    try {
        for (const operation of ['entrada', 'saida']) {
            assert.equal((await api(`/estoque/${operation}`, 'POST', { id_item: id, quantidade: 3 })).status, 400);
            assert.equal(await balance(id), 10);
        }
    } finally { await db.query('DROP TRIGGER teste_falha'); }
});

test('duas saídas concorrentes nunca retiram mais que o saldo', async () => {
    const id = await product(1);
    await db.query('CREATE TRIGGER teste_concorrencia BEFORE UPDATE ON estoque FOR EACH ROW DO SLEEP(0.15)');
    try {
        const results = await Promise.all([1, 2].map(() => api('/estoque/saida', 'POST', { id_item: id, quantidade: 1 })));
        assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
        assert.equal(await balance(id), 0);
    } finally { await db.query('DROP TRIGGER teste_concorrencia'); }
});
