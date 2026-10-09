CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT,
    id_funcionario INT NOT NULL,
    login VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uk_usuario_login (login),
    CONSTRAINT fk_usuario_funcionario
        FOREIGN KEY (id_funcionario)
        REFERENCES funcionario(id_pessoa)
) ENGINE=InnoDB;
