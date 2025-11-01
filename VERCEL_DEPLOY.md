# Deploy do Gestor360 no Vercel

## 📦 Deploy do Backend

### Passo 1: Preparar o Backend

1. Acesse [Vercel](https://vercel.com)
2. Clique em "Add New" → "Project"
3. Importe o repositório do GitHub
4. Configure o Root Directory: `backend`
5. Adicione as variáveis de ambiente:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
JWT_SECRET=sua_chave_jwt_super_secreta
PORT=3002
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASS=sua_senha_smtp
APP_NAME=Dashboard Financeiro
FRONTEND_URL=https://seu-frontend.vercel.app
```

6. Deploy!

### Passo 2: Configurar CORS

Após o deploy do backend, anote a URL (ex: `https://seu-backend.vercel.app`)

## 🎨 Deploy do Frontend

### Passo 1: Preparar o Frontend

1. No Vercel, clique em "Add New" → "Project"
2. Importe o mesmo repositório
3. Configure o Root Directory: `Frontend`
4. Framework Preset: Vite
5. Adicione a variável de ambiente:

```env
VITE_API_URL=https://seu-backend.vercel.app
```

6. Deploy!

## ✅ Verificação Final

1. Acesse seu frontend: `https://seu-frontend.vercel.app`
2. Teste o login/registro
3. Verifique se as transações estão funcionando
4. Teste o sistema de dashboards compartilhados

## 🔧 Configurações Adicionais

### Custom Domain (Opcional)

1. Vá em Settings → Domains
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme indicado

### Configurar CORS no Backend

Se tiver problemas de CORS, certifique-se que o `FRONTEND_URL` no backend está correto.

## 📝 Notas Importantes

- ✅ Arquivos `.env` NÃO são commitados (estão no .gitignore)
- ✅ Use `.env.example` como referência
- ✅ Configure as variáveis de ambiente diretamente no Vercel
- ✅ Supabase já está configurado com RLS (Row Level Security)
- ✅ O backend deve ser deployado primeiro para obter a URL

## 🚨 Segurança

⚠️ NUNCA commite os arquivos `.env` com dados reais!
⚠️ Gere uma nova `JWT_SECRET` forte para produção
⚠️ Use HTTPS em produção (Vercel já fornece)
⚠️ Configure CORS apenas para seu domínio em produção
