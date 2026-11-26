# Boas Notícias

Site em [Astro](https://docs.astro.build) com renderização no servidor (SSR). A interface está em português. Não há painel administrativo, CMS, autenticação nem banco de dados.

As notícias são arquivos Markdown da coleção `noticias`. Um robô futuro grava esses arquivos com `scripts/ingest-noticia.mjs`, faz commit e abre um pull request. Não existe endpoint HTTP que escreva no repositório.

## Critério editorial

Só entram notícias verificáveis e construtivas, nestes temas:

- gentileza
- ciência
- cultura
- comunidade
- meio ambiente

Ficam de fora crime, política tratada como conflito e conteúdo de indignação. O script valida o formato do JSON. Quem chama o script é responsável pelo critério editorial.

O arquivo `src/content/noticias/exemplo-noticia-de-demonstracao.md` é um exemplo marcado. Não é uma notícia real.

## Rodar em SSR localmente

Requer Node.js 22.12 ou mais novo.

```bash
npm install
npm run dev
```

O comando `npm run dev` sobe o Astro em modo servidor, em geral em `http://127.0.0.1:4321`.

Para gerar o build e subir o servidor Node standalone:

```bash
npm run build
npm start
```

`npm start` executa `node ./dist/server/entry.mjs`. A porta vem da variável de ambiente `PORT` (padrão `4321`). `HOST` define o endereço de escuta.

`npm run preview` também serve o resultado do build.

A coleção é lida na hora do build. Uma notícia nova, mesmo já commitada, só aparece depois de um novo `npm run build` e de reiniciar o servidor.

## Coleção `noticias`

Os arquivos ficam em `src/content/noticias/*.md`. O esquema está em `src/content.config.ts`.

Cada arquivo tem este frontmatter:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `title` | texto | Título da notícia |
| `description` | texto | Resumo curto |
| `pubDate` | data | Data de publicação (`YYYY-MM-DD` ou instante ISO-8601) |
| `source` | texto | Nome da fonte |
| `sourceUrl` | URL | Endereço http(s) da matéria na fonte |

O corpo em Markdown vem depois do frontmatter. O slug da URL é o nome do arquivo sem `.md`. `src/content/noticias/exemplo-noticia-de-demonstracao.md` responde em `/noticias/exemplo-noticia-de-demonstracao`.

A página inicial lista as notícias da mais nova para a mais antiga. A página da notícia mostra título, data, link da fonte e o corpo.

## Contrato do script de ingestão

O script não abre pull request e não fala com o GitHub. Ele só cria um arquivo da coleção.

Entrada: um único objeto JSON no stdin.

```json
{
  "title": "Título da notícia",
  "description": "Resumo em uma ou duas frases.",
  "pubDate": "2026-11-26",
  "source": "Nome da fonte",
  "sourceUrl": "https://exemplo.org/materia",
  "body": "Corpo em **Markdown**.\n\nSegundo parágrafo."
}
```

| Campo | Regra |
| --- | --- |
| `title` | texto obrigatório, até 300 caracteres |
| `description` | texto obrigatório, até 2000 caracteres |
| `pubDate` | `YYYY-MM-DD` (data civil em UTC) ou ISO-8601 com horário |
| `source` | texto obrigatório, até 200 caracteres |
| `sourceUrl` | URL `http` ou `https`, até 2000 caracteres |
| `body` | Markdown obrigatório, até 100000 caracteres |

Saída com sucesso: código `0` e o caminho relativo do arquivo no stdout, por exemplo `src/content/noticias/titulo-da-noticia.md`. Erros vão para o stderr, com código `1`.

O slug sai do título: minúsculas, sem acentos, só `a-z`, `0-9` e hífen, no máximo 80 caracteres. Se esse arquivo já existir, o script acrescenta `-2`, `-3` e assim por diante. Ele não sobrescreve.

Exemplo:

```bash
node scripts/ingest-noticia.mjs <<'JSON'
{
  "title": "Exemplo: notícia de demonstração",
  "description": "Arquivo de exemplo para a coleção. Não é uma notícia real.",
  "pubDate": "2026-11-26",
  "source": "Exemplo (não é uma fonte real)",
  "sourceUrl": "https://example.com/boas-noticias/exemplo",
  "body": "Este arquivo é um exemplo para o build. Não descreve um fato."
}
JSON
```

### O que o robô faz depois do script

1. Atualiza `main` e cria um branch.
2. Roda `node scripts/ingest-noticia.mjs` com o JSON no stdin.
3. Confere o caminho impresso e faz commit só desse Markdown (e de nada que não seja a notícia).
4. Sobe o branch e abre um pull request contra `main`.
5. Depois do merge, quem publica o site roda `npm run build` e reinicia `npm start`.

O pull request é o momento de checar o critério editorial e se `sourceUrl` aponta para a matéria citada.
