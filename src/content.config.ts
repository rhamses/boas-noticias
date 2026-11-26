import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Notícias verificáveis e construtivas: gentileza, ciência, cultura,
 * comunidade e meio ambiente. Fora do escopo: crime, política como
 * conflito e conteúdo de indignação.
 */
const noticias = defineCollection({
  loader: glob({ base: './src/content/noticias', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1).max(300),
    description: z.string().min(1).max(2000),
    pubDate: z.coerce.date(),
    source: z.string().min(1).max(200),
    sourceUrl: z.url(),
  }),
});

export const collections = { noticias };
