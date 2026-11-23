# Autonomiza no Oracle: passo a passo

O app (front) já está pronto para gravar no Oracle. Falta o banco existir. São dois scripts SQL,
rodados no navegador, sem instalar nada. Leva uns 30 minutos.

No fim, o app passa a ler e gravar no **Oracle Autonomous Database** pela **API REST do ORDS**
(o mesmo serviço que o APEX usa para publicar REST). A regra "concluir o atendimento lança a
entrada no financeiro" fica no próprio banco.

## 1. Criar o banco (Always Free)

1. Entrar no console da OCI com a conta da FIAP (Oracle Academy).
2. Menu > Oracle Database > **Autonomous Database** > **Create Autonomous Database**.
3. Preencher:
   - Display name e Database name: `autonomiza`
   - Workload type: **Transaction Processing**
   - Ligar **Always Free** (custo zero)
   - Versão: a que vier por padrão (19c ou 23ai, os dois servem)
   - Senha do ADMIN: anote, só você usa
   - Network access: **Secure access from everywhere**
4. Create. Fica pronto em 2 a 5 minutos (status verde, "Available").

## 2. Rodar o script 1 como ADMIN

1. No banco criado: **Database actions** > **SQL**. Entra como ADMIN.
2. Abrir o arquivo `01_admin_criar_schema.sql`, colar no editor.
3. **Trocar a senha** na linha do `CREATE USER` por uma sua (12 a 30 caracteres, com maiúscula,
   minúscula e número, sem aspas duplas).
4. Rodar com **Run Script** (o botão com a folha e a seta, ou F5). Não use o "Run Statement".
5. Deve aparecer `User AUTONOMIZA created`, os `Grant succeeded` e `PL/SQL procedure successfully completed`.

## 3. Rodar o script 2 como AUTONOMIZA

1. Sair do Database Actions (canto superior direito > Sign out).
2. Entrar de novo com usuário `AUTONOMIZA` e a senha do passo anterior.
   Se a tela de login pedir o caminho, o endereço é o mesmo do Database Actions trocando
   `/admin/` por `/autonomiza/` (fica `.../ords/autonomiza/_sdw/`).
3. **SQL** > colar o `02_autonomiza.sql` inteiro > **Run Script** (F5).
4. Demora uns segundos. No fim, a última consulta mostra a contagem:
   5 servicos, 10 clientes, algumas centenas de atendimentos e de lancamentos, 1 meta, 5 tarefas.

Se der erro, rode de novo: o script apaga e recria tudo, então pode repetir sem medo.
Se o erro continuar, mande print da mensagem e da linha onde parou.

## 4. Conferir pelo navegador

O endereço base é o host do Database Actions com `/ords/autonomiza/`. Exemplo de formato:

```
https://XXXXXXXX-autonomiza.adb.sa-saopaulo-1.oraclecloudapps.com/ords/autonomiza/
```

Abra no navegador:

- `.../ords/autonomiza/app/saude` deve responder `{"status":"ok", ...}`
- `.../ords/autonomiza/servicos/` deve listar os 5 serviços
- `.../ords/autonomiza/app/resumo` mostra os indicadores do mês calculados no banco

## 5. Devolver para a Ana

Só o endereço base, terminando em `/ords/autonomiza/`. O resto (ligar o app, publicar) é com ela.

## Bom saber

- **Dados de demonstração renovam sozinhos** todo dia às 3h de Brasília, sempre relativos à data
  de hoje, para os painéis nunca aparecerem vazios na hora da correção.
- Para reiniciar na hora (por exemplo, antes de cada teste com usuário):
  `POST .../ords/autonomiza/app/demo/reiniciar`, ou no SQL: `BEGIN autonomiza_demo.reiniciar; END;`
- O banco Always Free **para sozinho depois de 7 dias sem uso**. Se isso acontecer, é só abrir o
  banco no console da OCI e clicar em **Start**. Vale abrir o app uma vez por semana até a nota sair.
- As tabelas estão liberadas sem login de propósito: é um MVP de demonstração com dados fictícios.

## Opcional, para o pitch: um painel no APEX

Se sobrar tempo, dá para mostrar o mesmo banco no Oracle APEX em poucos minutos:

1. No banco: **Tool configuration** > **Oracle APEX** > abrir > entrar como ADMIN.
2. Criar um workspace usando o schema existente **AUTONOMIZA**.
3. Entrar no workspace > **App Builder** > **Create** > **New Application**.
4. Adicionar uma página **Dashboard** e uma página de **Interactive Report** sobre `ATENDIMENTOS`
   e outra sobre `LANCAMENTOS`. Create Application.

Isso dá uma visão administrativa dos mesmos dados que o app grava, boa para a parte de
tecnologia do pitch.
