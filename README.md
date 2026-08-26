# Deutschlernen

Web app de flashcards para aprendizado de alemão níveis A2–B2 (CEFR), projetado para falantes nativos de português. Implementa repetição espaçada com o algoritmo SM-2 e lembretes push diários.

## Funcionalidades

- **Flashcards SM-2** — revisão adaptativa baseada na dificuldade de cada resposta
- **5 tipos de card por palavra** — PT→DE, DE→PT, preencher lacuna, artigo, preposição
- **180 palavras A2–B2** em 24 temas — ativação progressiva por nível (A2 → B1 → B2)
- **Tradução por clique** — nos cards de lacuna, clique em qualquer palavra para ver a tradução em português
- **Escalonamento aleatório** — 10 novas entradas por dia, ordem embaralhada a cada ativação
- **Sessões de reforço** — quando não há cartas vencidas, permite revisar todo o vocabulário ativo
- **Prática livre** — modo sem SM-2 para revisar por tema sem compromisso
- **Lembretes push** — 2 notificações/dia com espaçamento mínimo de 6 horas
- **Sem conta necessária** — todo o progresso fica no localStorage do browser

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Backend | Express.js (Node.js) |
| Banco de dados | SQLite via `better-sqlite3` |
| Push | Web Push Protocol (VAPID) + Service Worker |
| Scheduler | `node-cron` |

## Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Gerar as chaves VAPID (apenas uma vez)
npm run generate-vapid   # imprime as variáveis — copie para .env

# 3. Criar o arquivo de ambiente
cp env.example .env
# edite .env com as chaves geradas

# 4. Subir frontend (porta 5686) + backend (porta 3000) em paralelo
npm run dev       # Vite dev server (proxy /api → localhost:3000)
npm run server    # Express API (em outro terminal)
```

Acesse `http://localhost:5686`.

## Testes

```bash
npm test                # executa todos os testes uma vez
npm run test:watch      # modo interativo (re-executa ao salvar)
npm run test:coverage   # relatório de cobertura em coverage/
```

A suíte cobre:
- Algoritmo SM-2 (`sm2.test.ts`)
- Geração de cards (`cardGenerator.test.ts`)
- Lógica de lembretes (`notifications.test.ts`)
- Persistência em localStorage (`storage.test.ts`)
- Integridade dos dados de vocabulário (`vocabulary.test.ts`)
- Reducer do estado global (`store.test.ts`)
- Rotas da API de push (`push.test.js`) — usa SQLite em memória

O GitHub Actions (`.github/workflows/test.yml`) executa `npm run test:coverage` a cada push nos arquivos relevantes e disponibiliza o relatório de cobertura como artifact.

## Produção (Ubuntu)

```bash
# Clone ou copie o projeto no servidor, depois:
sudo bash setup-server.sh
```

O script faz tudo automaticamente:
- Instala Node.js 20 LTS via NodeSource
- Executa `npm install` e `npm run build`
- Cria e configura o arquivo `.env` (gera as chaves VAPID)
- Registra e ativa o serviço systemd `deutschlernen`
- Opcionalmente configura Nginx como proxy reverso
- Opcionalmente instala certificado SSL via Let's Encrypt (Certbot)
- Configura regras de firewall com ufw

Após o setup, para reimplantar:

```bash
bash deploy.sh   # git pull + build + systemctl restart
```

### Comandos úteis no servidor

```bash
systemctl status deutschlernen      # status do serviço
systemctl restart deutschlernen     # reiniciar
journalctl -u deutschlernen -f      # logs em tempo real
```

## Estrutura do projeto

```
├── src/
│   ├── components/     # Dashboard, ReviewSession, FreePractice, etc.
│   ├── data/           # vocabulary.ts — 180 entradas A2–B2
│   ├── hooks/          # useNotifications
│   ├── lib/            # sm2, cardGenerator, storage, notifications, pushClient
│   ├── store/          # useReducer + Context (estado global)
│   └── types/          # AppState, VocabEntry, ReviewCard, CardProgress
├── server/
│   ├── index.js        # Express: serve dist/ + monta /api/push
│   ├── push.js         # Rotas REST para subscriptions Web Push
│   ├── db.js           # SQLite (subscriptions, sessions, reminders)
│   └── scheduler.js    # node-cron: dispara lembretes a cada 30 min (8–22h)
├── tests/
│   ├── unit/           # Vitest + jsdom (sm2, cardGenerator, store, storage, …)
│   └── server/         # Vitest + Node + Supertest (rotas push, SQLite em memória)
├── public/
│   └── sw.js           # Service Worker: recebe push, exibe notificação
├── scripts/
│   └── generate-vapid.js
├── .github/
│   └── workflows/test.yml  # CI: testes + cobertura a cada push
├── setup-server.sh     # Inicialização automática em Ubuntu
├── deploy.sh           # Gerado pelo setup-server.sh
├── vitest.config.ts
└── env.example
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VAPID_PUBLIC_KEY` | Chave pública VAPID (gerada por `npm run generate-vapid`) |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID |
| `VAPID_SUBJECT` | URI de contato para o servidor de push (`mailto:...`) |
| `PORT` | Porta do servidor Express (padrão: `3000`) |

> As chaves VAPID são geradas uma única vez. Nunca as troque em produção — isso invalidaria todas as subscriptions existentes.

## Notas sobre HTTPS

Service Workers e Web Push **exigem HTTPS** em produção. Configure um domínio com certificado SSL (o `setup-server.sh` oferece Certbot) antes de ativar os lembretes.
