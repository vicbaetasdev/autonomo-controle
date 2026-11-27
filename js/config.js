// endereco da API REST (ORDS) do Oracle Autonomous Database
// o ORDS do banco libera chamadas de outros dominios (CORS), entao o app fala direto com ele,
// tanto na Vercel quanto rodando local
// vazio: o app roda com os dados de demonstracao gerados no navegador
// para testar outro endereco sem mexer aqui: ?ords=https://.../ords/autonomiza/
export const ORDS_BASE = 'https://g386c60f8b02412-autonomiza.adb.sa-saopaulo-1.oraclecloudapps.com/ords/autonomiza/';
