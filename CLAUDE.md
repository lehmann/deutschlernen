# CLAUDE.md

Instruções para o Claude Code neste projeto.

## Contexto

App de flashcards para aprendizado de alemão A2–B2 (CEFR) por falantes de português. O usuário é André Lehmann, falante nativo de português.

## Stack

- **Frontend:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3
- **Backend:** Express.js + better-sqlite3 + web-push + node-cron
- **Estado:** `useReducer` + Context em `src/store/index.tsx`
- **Persistência frontend:** localStorage (com migração por `schemaVersion`)
- **Persistência backend:** SQLite em `data/app.db`

## Comandos essenciais

```bash
npm run dev                # Vite dev server na porta 5686
npm run server             # Express API na porta 3000
npm run build              # tsc + vite build → dist/
npm run generate-vapid     # Gera chaves VAPID (stdout)
npm run generate-listening # Regenera src/data/listening.ts (requer internet)
npm test                   # Executa todos os testes (Vitest)
npm run test:coverage      # Testes com relatório de cobertura
```

## Convenções do projeto

### Vocabulário
- Arquivo: `src/data/vocabulary.ts` — 180 entradas (94 A2 + 56 B1 + 30 B2) em 24 temas.
- Níveis: `CefrLevel = 'A2' | 'B1' | 'B2'`. Entradas A2 não têm campo `level` (default via `v.level ?? 'A2'`). B1/B2 precisam de `level: 'B1'` ou `level: 'B2'`.
- Verificar nível contra listas Goethe antes de adicionar qualquer entrada.
- Substantivos precisam de `article` (`der/die/das`) e `plural`.
- Verbos com preposição fixa precisam do campo `preposition`.
- Todo entry precisa de `exampleDE` e `examplePT`.
- `fillBlank` é opcional mas recomendado para verbos e frases comuns.
- Ativação progressiva: B1 é oferecido no Dashboard após A2 ativo; B2 após B1 ativo.

### SM-2 e progresso
- Lógica em `src/lib/sm2.ts`. Não alterar sem entender o algoritmo.
- `schemaVersion` em `AppState` controla migrações de localStorage. Ao mudar a shape do estado, incrementar `schemaVersion` e adicionar handler em `initializeState()` em `src/store/index.tsx`.
- `ENTRIES_PER_DAY = 10` em `src/store/index.tsx` controla o escalonamento de novas palavras. Não remover.
- `ADD_VOCAB_BULK` embaralha os IDs (Fisher-Yates) antes de escalonar, para que o primeiro lote de cada dia seja aleatório. Os testes de staggering verificam a contagem por dia, não a posição de um ID específico.
- `ReviewSession` monta fila de due cards; se vazia, usa todos os cards ativos como sessão de reforço (banner âmbar exibido).

### Push notifications
- Service Worker em `public/sw.js` (não transpilado — JavaScript puro).
- Chaves VAPID ficam em `.env` (nunca commitar). Template em `env.example`.
- Trocar as chaves VAPID em produção invalida todas as subscriptions existentes — avisar o usuário antes de qualquer mudança.
- Proxy Vite `/api → http://localhost:3000` só existe em dev. Em prod, o Express serve o `dist/` diretamente.

### Tamanho de sessão
Cada exercício tem uma constante `SESSION_SIZE` no topo do seu arquivo, que é o **único ponto** onde o tamanho da sessão é definido. A constante é usada exclusivamente dentro da função `buildQueue` (ou `.slice`) do mesmo arquivo — nunca nos call sites.

| Exercício | Constante | Valor | Arquivo |
|---|---|---|---|
| Flashcards | `SESSION_SIZE` | 30 | `ReviewSession.tsx:13` |
| Escuta | `SESSION_SIZE` | 10 | `ListeningPractice.tsx:12` |
| Escrita | `SESSION_SIZE` | 5 | `WritingPractice.tsx:237` |

### Componentes
- Textos da UI em português (pt-BR) — o público-alvo é falante de português.
- Sem bibliotecas de componentes externas. Usar Tailwind puro.
- `FreePractice` não deve ter efeitos colaterais SM-2.
- `FlashCard`: cards `fill_blank` renderizam a sentença com palavras clicáveis via `ClickableSentence`. Cada token é separado em `leadingPunct + word + trailingPunct` usando `\p{L}` (Unicode letters) para lidar com aspas e pontuação adjacente. `lookupTranslation` faz match por prefixo de 5 chars no VOCABULARY (cobre flexões) e cai em `GRAMMAR_DICT` (~80 palavras funcionais).
- `ListeningPractice`: ditado guiado. O usuário ouve a frase e digita o que entendeu. A comparação usa word-level edit distance com custos inteiros (ok=0, grafia=1, similar=5, grave/faltando=10, extra=0); `accuracy = 1 - totalCost / (nPalavras × 10)`. Thresholds: A2 ≥ 90%, B1 ≥ 95%, B2 ≥ 99%. Caracteres especiais (ä/ö/ü/ß) normalizados para comparação — o usuário pode digitar sem eles. A fila é gerida como `useState` para suportar requeue ("Repetir"). Áudio: Tatoeba nativo via `https://tatoeba.org/en/audio/download/{audioId}` com fallback para Web Speech API TTS. Após "Verificar", exibe tradução PT da frase (campo `entry.pt`) quando disponível.

### Treino de escuta — dados
- `src/data/listening.ts` gerado por `scripts/generate-listening.mjs` (não editar manualmente).
- Fontes: frases Tatoeba (CC-BY) + lista de frequência `hermitdave/FrequencyWords`.
- TSV do Tatoeba (`deu_sentences_with_audio.tsv.bz2`): formato `sentence_id \t audio_id \t username`. A URL de download usa `audio_id` (col 2), não `sentence_id`. Esse detalhe foi confirmado empiricamente — inverter as colunas quebra o alinhamento áudio/frase.
- Classificação CEFR: 75º-percentil do rank de frequência das palavras de conteúdo. A2 ≤ rank 1500 e ≤ 10 palavras; B1 ≤ 4000 e ≤ 16; B2 ≤ 8000 e ≤ 24.
- `ListeningEntry` tem campo `pt?: string` com a tradução portuguesa da frase, obtida dos links de tradução do Tatoeba durante a geração. O script faz duas passagens: (1) classifica todas as frases qualificadas; (2) baixa `por_sentences.tsv.bz2` e `links.tar.bz2`, filtra apenas os IDs alemães qualificados, e anota a primeira tradução PT encontrada. `links.tar.bz2` é um arquivo tar dentro de bzip2 (diferente dos demais `.tsv.bz2` simples) — usa `fetchTarBzip2` com `tar -xjO` em vez de `bunzip2`. Frases sem tradução no Tatoeba simplesmente não têm o campo `pt`.

## Arquitetura de deploy

```
Browser → Express :3000 → dist/ (frontend estático)
                        → /api/push (Web Push API)
```

- `setup-server.sh`: script de inicialização para Ubuntu (Node.js, build, systemd, firewall). Sem Nginx — o Express serve tudo diretamente.
- `deploy.sh`: gerado pelo setup, para redeploys (`git pull + build + restart`).
- Serviço systemd: `deutschlernen.service` — roda como o usuário que executou o setup, não como root.

## Testes

- Framework: **Vitest 2** com `vitest.config.ts` na raiz.
- Ambiente por diretório: `tests/unit/**` → `jsdom`; `tests/server/**` → `node`.
- Testes de servidor usam SQLite em memória (`tests/server/testDb.js`) e mockam `web-push`.
- CI: `.github/workflows/test.yml` — dispara a cada push em `src/**`, `server/**`, `tests/**`.
- O `reducer` em `src/store/index.tsx` é exportado (`export function reducer`) para testes unitários diretos.
- **Caveat conhecido:** `loadState()` retorna referência direta ao `DEFAULT_STATE` quando localStorage está vazio — mutá-la corrompe o estado padrão para chamadas subsequentes. Testes devem usar spread (`{ ...loadState() }`) ao precisar modificar o resultado.

## O que não fazer

- Não usar `npm install --omit=dev` antes do `npm run build` — o build precisa de devDependencies (tsc, vite).
- Não commitar `.env` ou `data/` (ambos no `.gitignore`).
- Não adicionar vocabulário sem verificar o nível CEFR correto contra as listas Goethe.
- Não usar `Math.random()` em scripts de workflow — usar Fisher-Yates sobre arrays já inicializados. (Em código da aplicação, `Math.random()` é permitido.)
- Não criar arquivos de documentação intermediários durante implementação — trabalhar a partir do contexto da conversa.
- Não mockar `better-sqlite3` com variável externa ao factory de `vi.mock` — usar módulo auxiliar (`tests/server/testDb.js`) que é importado tanto pelo mock quanto pelo teste.
