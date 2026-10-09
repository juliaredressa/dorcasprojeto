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

O acesso administrativo é separado do cargo profissional do colaborador. Para marcar a conta existente `testando@teste.com` como administradora em outro banco, execute uma única vez o arquivo `backend/admin-role-migration.sql` no banco configurado pela aplicação. A consulta ao final deve retornar `is_admin = 1`. No banco local desta instalação, essa alteração já foi aplicada.

Depois, reinicie o backend e entre novamente na conta para atualizar a sessão. O indicador administrativo fica disponível na sessão autenticada como `usuario.is_admin`; novas contas são criadas sem privilégios administrativos.

## Acesso da Assistente Social

Contas cujo cargo seja **Assistente social** podem acessar somente Gestantes, Triagem Social, montagem de Kits maternidade e Fila de prioridade. A lista inicial e as rotas do frontend são filtradas por perfil, e o backend também bloqueia chamadas às demais APIs. A consulta de itens disponíveis no estoque é permitida somente para montar kits. Contas administradoras mantêm acesso a todas as áreas.

## Eventos

Na primeira instalação/atualização, execute uma única vez `backend/eventos-schema.sql` no banco configurado no `.env`. A migração adiciona sexo do bebê ao cadastro de gestantes e cria as tabelas de eventos, palestras e participantes, além dos vínculos opcionais de eventos às doações e aos kits. A tela **Eventos** permite cadastrar encontros, associar palestras a colaboradores com cargo de psicólogo, registrar presença de gestantes e vincular kits entregues. Ao registrar participante, o sexo do bebê é mostrado a partir do cadastro da gestante. Administradores e Assistentes Sociais podem gerenciar eventos.
