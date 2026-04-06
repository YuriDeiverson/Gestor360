# Dashboard Financeiro — app mobile

Aplicativo **Expo (React Native)** que usa o **mesmo backend** do repositório (`../backend/`): autenticação JWT, transações e dashboards.

## Requisitos

- Node.js 20+
- Backend rodando (ex.: `http://localhost:3002` — veja `../backend`)
- Para testar no **celular físico**: o backend precisa ser acessível na rede (IP local ou HTTPS público) — não use `localhost` no aparelho.

## Instalação

```bash
cd mobile
npm install
```

## Desenvolvimento

1. Suba o backend (`../backend`, porta `3002` por padrão no frontend web).
2. **Emulador Android**: o app já usa `http://10.0.2.2:3002` em desenvolvimento (mapeia para o host).
3. **Simulador iOS**: `http://localhost:3002`.
4. **Celular físico** (Expo Go ou dev build): crie um arquivo `.env` na pasta `mobile` (copie de `.env.example`) e defina:

   ```env
   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3002
   ```

   Descubra o IP no Windows (PowerShell): `ipconfig` (IPv4 da rede Wi‑Fi).

```bash
npm start
```

Depois escaneie o QR no terminal com o app **Expo Go** ou pressione `a` para Android.

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_API_URL` | URL base da API **sem** `/api` no final (ex.: `http://192.168.x.x:3002` em dev). |

O app lê **primeiro** `process.env.EXPO_PUBLIC_API_URL` (Metro injeta no bundle). Reinicie o Metro após editar `.env` (`npx expo start -c`).

### “Network request failed”

1. **Backend** deve aceitar conexões da LAN: o `server.ts` em desenvolvimento escuta em `0.0.0.0` (não só `localhost`).
2. **IP e porta** no `.env` do mobile = IP do PC na Wi‑Fi (`ipconfig`) + `PORT` do `backend/.env` (ex. `3002`).
3. Teste no **navegador do celular**: `http://IP:PORT/health` — se não abrir, é firewall/rede antes do app.
4. **Android** e HTTP: o `app.config` permite tráfego cleartext para desenvolvimento em LAN.

## APK (build na nuvem)

1. Conta em [expo.dev](https://expo.dev) e login: `npx eas-cli login`
2. Na pasta `mobile`, crie o projeto EAS: `npx eas-cli init` (se ainda não existir `eas.json` — já incluído).
3. Build APK de pré-visualização:

   ```bash
   npx eas-cli build -p android --profile preview
   ```

4. Baixe o `.apk` no painel do EAS quando o build terminar.

Para produção, use `--profile production` e configure `EXPO_PUBLIC_API_URL` nos **secrets** do EAS (Dashboard → Project → Secrets) apontando para a API pública em HTTPS.

## Estrutura

- `src/api/client.ts` — client HTTP com `Authorization: Bearer` (token em `AsyncStorage`).
- `src/context/AuthContext.tsx` — login, registro, dashboards (mesmos endpoints do site).
- `src/screens/` — telas iniciais.
- `app.config.ts` — nome do app, pacote Android `com.dashboardfinanceiro.app`.

O site **web** continua em `../Frontend/`; apenas o **cliente** muda (navegador vs app nativo).
