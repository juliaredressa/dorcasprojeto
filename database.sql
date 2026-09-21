CREATE DATABASE IF NOT EXISTS dorcas_gestao
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dorcas_gestao;

CREATE TABLE pessoa (
    id_pessoa INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(150),
    endereco VARCHAR(255),
    PRIMARY KEY (id_pessoa),
    UNIQUE KEY uk_pessoa_cpf (cpf)
) ENGINE=InnoDB;

CREATE TABLE gestante (
    id_pessoa INT NOT NULL,
    dpp DATE NOT NULL,
    grau_vulnerabilidade INT NOT NULL,
    data_cadastro DATE NOT NULL,
    situacao VARCHAR(30) NOT NULL,
    PRIMARY KEY (id_pessoa),
    CONSTRAINT fk_gestante_pessoa
        FOREIGN KEY (id_pessoa) REFERENCES pessoa(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE voluntario (
    id_pessoa INT NOT NULL,
    area_atuacao VARCHAR(100),
    disponibilidade VARCHAR(150),
    PRIMARY KEY (id_pessoa),
    CONSTRAINT fk_voluntario_pessoa
        FOREIGN KEY (id_pessoa) REFERENCES pessoa(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE funcionario (
    id_pessoa INT NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    matricula VARCHAR(30) NOT NULL,
    data_admissao DATE NOT NULL,
    PRIMARY KEY (id_pessoa),
    UNIQUE KEY uk_funcionario_matricula (matricula),
    CONSTRAINT fk_funcionario_pessoa
        FOREIGN KEY (id_pessoa) REFERENCES pessoa(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE doador (
    id_pessoa INT NOT NULL,
    tipo_doador VARCHAR(30) NOT NULL,
    PRIMARY KEY (id_pessoa),
    CONSTRAINT fk_doador_pessoa
        FOREIGN KEY (id_pessoa) REFERENCES pessoa(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE triagem_social (
    id_triagem INT NOT NULL AUTO_INCREMENT,
    data_triagem DATE NOT NULL,
    nota_vulnerabilidade INT NOT NULL,
    observacoes TEXT,
    id_gestante INT NOT NULL,
    id_funcionario INT NOT NULL,
    PRIMARY KEY (id_triagem),
    CONSTRAINT fk_triagem_gestante
        FOREIGN KEY (id_gestante) REFERENCES gestante(id_pessoa),
    CONSTRAINT fk_triagem_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE fila_prioridade (
    id_fila INT NOT NULL AUTO_INCREMENT,
    posicao_fila INT NOT NULL,
    data_calculo DATE NOT NULL,
    id_gestante INT NOT NULL,
    PRIMARY KEY (id_fila),
    CONSTRAINT fk_fila_gestante
        FOREIGN KEY (id_gestante) REFERENCES gestante(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE categoria_item (
    id_categoria INT NOT NULL AUTO_INCREMENT,
    nome_categoria VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    PRIMARY KEY (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE item_doacao (
    id_item INT NOT NULL AUTO_INCREMENT,
    nome_item VARCHAR(120) NOT NULL,
    tamanho VARCHAR(30),
    unidade_medida VARCHAR(30) NOT NULL,
    quantidade_minima INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_item),
    CONSTRAINT fk_item_categoria
        FOREIGN KEY (id_categoria) REFERENCES categoria_item(id_categoria)
) ENGINE=InnoDB;

CREATE TABLE estoque (
    id_estoque INT NOT NULL AUTO_INCREMENT,
    quantidade_atual INT NOT NULL,
    local_armazenamento VARCHAR(120),
    id_item INT NOT NULL,
    PRIMARY KEY (id_estoque),
    UNIQUE KEY uk_estoque_item (id_item),
    CONSTRAINT fk_estoque_item
        FOREIGN KEY (id_item) REFERENCES item_doacao(id_item)
) ENGINE=InnoDB;

CREATE TABLE doacao (
    id_doacao INT NOT NULL AUTO_INCREMENT,
    data_doacao DATE NOT NULL,
    id_doador INT NOT NULL,
    id_funcionario INT NOT NULL,
    PRIMARY KEY (id_doacao),
    CONSTRAINT fk_doacao_doador
        FOREIGN KEY (id_doador) REFERENCES doador(id_pessoa),
    CONSTRAINT fk_doacao_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE kit_maternidade (
    id_kit INT NOT NULL AUTO_INCREMENT,
    data_montagem DATE,
    status VARCHAR(30) NOT NULL,
    data_entrega DATE,
    id_gestante INT NOT NULL,
    id_funcionario INT NOT NULL,
    PRIMARY KEY (id_kit),
    CONSTRAINT fk_kit_gestante
        FOREIGN KEY (id_gestante) REFERENCES gestante(id_pessoa),
    CONSTRAINT fk_kit_funcionario
        FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_pessoa)
) ENGINE=InnoDB;

CREATE TABLE item_doacao_recebida (
    id_doacao INT NOT NULL,
    id_item INT NOT NULL,
    quantidade INT NOT NULL,
    PRIMARY KEY (id_doacao, id_item),
    CONSTRAINT fk_item_recebido_doacao
        FOREIGN KEY (id_doacao) REFERENCES doacao(id_doacao),
    CONSTRAINT fk_item_recebido_item
        FOREIGN KEY (id_item) REFERENCES item_doacao(id_item)
) ENGINE=InnoDB;

CREATE TABLE item_kit (
    id_kit INT NOT NULL,
    id_item INT NOT NULL,
    quantidade INT NOT NULL,
    PRIMARY KEY (id_kit, id_item),
    CONSTRAINT fk_item_kit_kit
        FOREIGN KEY (id_kit) REFERENCES kit_maternidade(id_kit),
    CONSTRAINT fk_item_kit_item
        FOREIGN KEY (id_item) REFERENCES item_doacao(id_item)
) ENGINE=InnoDB;

CREATE TABLE movimentacao_estoque (
    id_movimentacao INT NOT NULL AUTO_INCREMENT,
    tipo_movimentacao VARCHAR(30) NOT NULL,
    data_movimentacao DATETIME NOT NULL,
    quantidade INT NOT NULL,
    id_item INT NOT NULL,
    PRIMARY KEY (id_movimentacao),
    CONSTRAINT fk_movimentacao_item
        FOREIGN KEY (id_item) REFERENCES item_doacao(id_item)
) ENGINE=InnoDB;

CREATE TABLE alerta_estoque (
    id_alerta INT NOT NULL AUTO_INCREMENT,
    data_alerta DATETIME NOT NULL,
    tipo_alerta VARCHAR(30) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    id_item INT NOT NULL,
    PRIMARY KEY (id_alerta),
    CONSTRAINT fk_alerta_item
        FOREIGN KEY (id_item) REFERENCES item_doacao(id_item)
) ENGINE=InnoDB;
