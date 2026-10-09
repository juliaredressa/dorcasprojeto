# dorcasprojeto
Projeto Dorcas - Desenvolvido durante a disciplina de Projeto Integrador

## Recuperação de senha

A opção **Esqueci minha senha** orienta a pessoa a solicitar ajuda ao administrador; o sistema não envia e-mail nem redefine senhas automaticamente.

Para redefinir uma senha, o administrador deve abrir um terminal na pasta `backend` e executar:

```powershell
node src/scripts/resetUserPassword.js
```

O comando solicita o login da conta e a nova senha (sem exibi-la no terminal), pede confirmação e salva somente o hash bcrypt no banco configurado no `.env`.

## Acesso administrativo

O acesso administrativo é separado do cargo profissional do colaborador. Para marcar a conta existente `teste@testando.com` como administradora em outro banco, execute uma única vez o arquivo `backend/admin-role-migration.sql` no banco configurado pela aplicação. A consulta ao final deve retornar `is_admin = 1`. No banco local desta instalação, essa alteração já foi aplicada.

Depois, reinicie o backend e entre novamente na conta para atualizar a sessão. O indicador administrativo fica disponível na sessão autenticada como `usuario.is_admin`; novas contas são criadas sem privilégios administrativos.
