// endereco da API REST (ORDS) do Oracle Autonomous Database
// vazio: o app roda com os dados de demonstracao gerados no navegador
// em producao fica '/ords/autonomiza/', que a Vercel repassa para o Oracle (vercel.json)
// para testar outro endereco sem mexer aqui: ?ords=https://.../ords/autonomiza/
export const ORDS_BASE = '';
