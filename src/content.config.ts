import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const gradeEnum = z.enum(['7', '8', '9']);
const semesterEnum = z.enum(['上學期', '下學期']);

const embedSchema = z.object({
  type: z.enum(['scratch', 'google-doc', 'google-sheet', 'google-form', 'canva']),
  title: z.string(),
  url: z.string().url(),
});

const audienceFields = {
  grades: z.array(gradeEnum).optional(),
  classes: z.array(z.string()).optional(),
  semester: semesterEnum.optional(),
  embeds: z.array(embedSchema).optional(),
  current: z.boolean().optional(),
};

const lectures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lectures' }),
  schema: z.object({
    title: z.string(),
    unit: z.string(),
    order: z.number(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    ...audienceFields,
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['作業', '課程進度', '公告']),
    dueDate: z.coerce.date().optional(),
    ...audienceFields,
  }),
});

const showcase = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/showcase' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    grade: gradeEnum.optional(),
    creditLabel: z.string().optional(),
    description: z.string().optional(),
    embeds: z.array(embedSchema).optional(),
  }),
});

export const collections = { lectures, announcements, showcase };
