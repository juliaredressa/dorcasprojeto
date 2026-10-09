ALTER TABLE gestante
    ADD COLUMN IF NOT EXISTS sexo_bebe VARCHAR(20) NOT NULL DEFAULT 'NAO_INFORMADO';

ALTER TABLE doacao
    ADD COLUMN IF NOT EXISTS id_evento INT NULL;

ALTER TABLE kit_maternidade
    ADD COLUMN IF NOT EXISTS id_evento INT NULL;

CREATE TABLE IF NOT EXISTS evento (
    id_evento INT NOT NULL AUTO_INCREMENT,
    nome_evento VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    data_evento DATE NOT NULL,
    horario TIME NULL,
    local_evento VARCHAR(255) NULL,
    PRIMARY KEY (id_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS palestra (
    id_palestra INT NOT NULL AUTO_INCREMENT,
    id_evento INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    horario TIME NULL,
    id_psicologo INT NOT NULL,
    PRIMARY KEY (id_palestra),
    CONSTRAINT fk_palestra_evento
        FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
        ON DELETE CASCADE,
    CONSTRAINT fk_palestra_psicologo
        FOREIGN KEY (id_psicologo) REFERENCES funcionario(id_pessoa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evento_participante (
    id_evento INT NOT NULL,
    id_gestante INT NOT NULL,
    presente TINYINT(1) NOT NULL DEFAULT 1,
    id_kit INT NULL,
    PRIMARY KEY (id_evento, id_gestante),
    UNIQUE KEY uk_evento_participante_kit (id_kit),
    CONSTRAINT fk_evento_participante_evento
        FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
        ON DELETE CASCADE,
    CONSTRAINT fk_evento_participante_gestante
        FOREIGN KEY (id_gestante) REFERENCES gestante(id_pessoa),
    CONSTRAINT fk_evento_participante_kit
        FOREIGN KEY (id_kit) REFERENCES kit_maternidade(id_kit)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE doacao
    ADD CONSTRAINT fk_doacao_evento
        FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
        ON DELETE SET NULL;

ALTER TABLE kit_maternidade
    ADD CONSTRAINT fk_kit_evento
        FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
        ON DELETE SET NULL;
