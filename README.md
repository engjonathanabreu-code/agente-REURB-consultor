# Agente IA REURB — Vector Store

Aplicação pronta para Vercel que usa um **Vector Store já existente na OpenAI**.

Não é necessário colocar os PDFs dentro do projeto.
Não é necessário reenviar arquivos pelo site.
O agente pesquisa diretamente o Vector Store configurado.

## Arquitetura

Usuário → site Next.js → OpenAI Responses API → File Search → Vector Store → resposta

## 1. Variáveis

Crie um arquivo `.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_VECTOR_STORE_ID=vs_...
OPENAI_MODEL=gpt-5
ADMIN_TOKEN=crie-uma-senha-forte
```

### OPENAI_API_KEY
Chave secreta do projeto OpenAI que possui acesso ao Vector Store.

### OPENAI_VECTOR_STORE_ID
ID do Vector Store que contém a base REURB.

Exemplo:

```text
vs_abc123...
```

### OPENAI_MODEL
Modelo usado nas respostas. O projeto vem com `gpt-5` como padrão.
Você pode trocar pelo modelo disponível em sua conta.

### ADMIN_TOKEN
Uma senha criada por você para proteger a página `/admin`.

## 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:3000
```

Diagnóstico:

```text
http://localhost:3000/admin
```

## 3. Publicar na Vercel

1. Crie um repositório GitHub.
2. Envie todos os arquivos deste projeto.
3. Na Vercel, clique em Add New → Project.
4. Importe o repositório.
5. Em Environment Variables, crie:
   - OPENAI_API_KEY
   - OPENAI_VECTOR_STORE_ID
   - OPENAI_MODEL
   - ADMIN_TOKEN
6. Faça o deploy.
7. Abra `/admin` e teste a conexão.

## 4. Como saber se está correto

Na tela `/admin` deve aparecer:

- Conexão OK
- nome do Vector Store
- ID correto
- status `completed`
- quantidade de arquivos concluídos
- 0 arquivos com falha, idealmente

## 5. Atualização dos documentos

Os documentos são gerenciados na própria OpenAI.

Quando você adicionar um arquivo novo ao mesmo Vector Store,
não precisa alterar o código nem fazer novo deploy.

O agente passa a pesquisar o novo conteúdo assim que o processamento
do arquivo no Vector Store estiver concluído.

## 6. Segurança

Nunca coloque `OPENAI_API_KEY` no código do navegador.
Neste projeto ela é usada somente no servidor, nas rotas `/api/*`.

Não publique `.env.local` no GitHub.

## 7. Comportamento do agente

O prompt força o agente a:

- pesquisar a base antes de respostas técnicas;
- priorizar normas hierarquicamente superiores;
- não transformar orientação local em regra nacional;
- não inventar artigos, prazos ou exigências;
- informar quando a base não for suficiente;
- criar modelos apenas com fundamento documental;
- indicar os arquivos efetivamente citados quando a API retornar citações.
