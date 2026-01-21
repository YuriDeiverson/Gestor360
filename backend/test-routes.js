// Script simples para testar se as rotas estão funcionando
// Execute: node test-routes.js

const http = require('http');

const testRoutes = [
  '/health',
  '/api/transacoes?dashboard_id=test',
  '/api/budgets?dashboard_id=test',
  '/api/metas?dashboard_id=test'
];

testRoutes.forEach(route => {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: route,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`${route} - Status: ${res.statusCode}`);
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (e) => {
    console.error(`${route} - Erro: ${e.message}`);
  });

  req.end();
});
