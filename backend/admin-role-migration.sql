ALTER TABLE usuario
    ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0;

UPDATE usuario
SET is_admin = 1
WHERE login = 'testando@teste.com';

SELECT login, is_admin
FROM usuario
WHERE login = 'testando@teste.com';
