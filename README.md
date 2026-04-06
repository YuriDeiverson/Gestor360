# 📊 Painel Financeiro

Um dashboard financeiro moderno e responsivo construído com React, TypeScript e Tailwind CSS.

## ✨ Funcionalidades

- 📈 **Dashboard Interativo**: Visualize suas finanças com gráficos e métricas em tempo real
- 💰 **Gestão de Transações**: Adicione, edite e categorize suas receitas e despesas
- 🎯 **Metas Financeiras**: Defina e acompanhe seus objetivos financeiros
- 📊 **Orçamentos**: Crie e monitore orçamentos por categoria
- 🏷️ **Categorias Personalizadas**: Organize suas transações com categorias customizáveis
- 📱 **Design Responsivo**: Interface adaptável para desktop, tablet e mobile
- 🔐 **Sistema de Autenticação**: Login seguro com gestão de sessão
- 📊 **Múltiplos Dashboards**: Suporte a vários dashboards com sistema de convites

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** - Biblioteca JavaScript para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool moderna e rápida
- **Recharts** - Biblioteca para gráficos em React
- **React Router** - Roteamento para aplicações React
- **React Hot Toast** - Notificações elegantes
- **Lucide React** - Ícones SVG modernos

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para Node.js
- **SQL Server** - Banco de dados relacional
- **JWT** - Autenticação via tokens

## 📁 Estrutura do Projeto

```
Dashboard-Financeiro/
├── Frontend/                 # Aplicação web (React + Vite)
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilitários e helpers
│   │   └── assets/          # Recursos estáticos
│   ├── public/              # Arquivos públicos
│   └── dist/                # Build de produção
├── mobile/                  # App nativo (Expo / React Native) — mesma API
│   └── README.md            # Como rodar, APK (EAS), variável EXPO_PUBLIC_API_URL
└── backend/                 # API Node.js (única para web e mobile)
    ├── server.ts            # Servidor principal
    ├── auth.ts              # Serviços de autenticação
    └── *.sql                # Scripts de banco de dados
```

O **backend** é compartilhado: o site (`Frontend/`) e o aplicativo (`mobile/`) autenticam e consomem os mesmos endpoints (`/api/auth/*`, `/api/transacoes`, etc.). Detalhes e build de **APK** estão em [`mobile/README.md`](mobile/README.md).

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- SQL Server (local ou remoto)

### Frontend

1. **Clone o repositório**
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd Dashboard-Financeiro/Frontend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute em modo de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Build para produção**
   ```bash
   npm run build
   ```

### Backend

1. **Configure o banco de dados**
   - Execute os scripts SQL da pasta `backend/` no seu SQL Server
   - Configure as variáveis de ambiente para conexão com o banco

2. **Instale as dependências**
   ```bash
   cd backend
   npm install
   ```

3. **Execute o servidor**
   ```bash
   npm run dev
   ```

## 🌐 Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy da pasta 'dist' para sua plataforma preferida
```

### Backend (Railway/Render)
- Configure as variáveis de ambiente
- Faça deploy do código da pasta `backend/`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ por Yuri :)

---

⭐ Não esqueça de dar uma estrela no projeto se ele foi útil para você!
