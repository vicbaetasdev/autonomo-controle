-- Autonomiza · passo 1 de 2
-- Rodar conectado como ADMIN no SQL do Database Actions, com "Executar script" (F5).
-- Cria o usuario dono das tabelas e liga o REST (ORDS) para ele.
-- Antes de rodar, troque a senha abaixo por uma sua (12 a 30 caracteres, com maiuscula,
-- minuscula e numero, sem aspas duplas).

CREATE USER autonomiza IDENTIFIED BY "TroqueEstaSenha#2026";

GRANT CONNECT, RESOURCE TO autonomiza;
GRANT CREATE VIEW, CREATE JOB TO autonomiza;
ALTER USER autonomiza QUOTA 500M ON data;

-- REST ligado para o schema: os enderecos ficam em .../ords/autonomiza/
-- p_auto_rest_auth => FALSE deixa as tabelas liberadas sem login (MVP de demonstracao)
BEGIN
  ORDS_ADMIN.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => 'AUTONOMIZA',
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'autonomiza',
    p_auto_rest_auth      => FALSE);
  COMMIT;
END;
/
