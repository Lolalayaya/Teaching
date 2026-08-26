import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const gradeEnum = z.enum(['7', '8', '9']);
// 民國學年度-學期,例如 115-1(115學年度第一學期)、115-2(115學年度第二學期)
const semesterEnum = z.string().regex(/^\d{2,3}-[12]$/, '格式須為「學年度-學期」,例如 115-1');

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
    // Optional client-side content lock: the page itself always exists and
    // is listed normally, but its body is replaced with a placeholder until
    // EITHER `after` has passed (server clock at build time is irrelevant —
    // this is checked against the *visitor's* clock on page load) OR the
    // visitor's localStorage has a truthy value at `storageKey`. Used for
    // review material that would leak puzzle answers if read before a
    // student has actually solved them (e.g. an escape-room recap) — not a
    // real access-control mechanism, just a "please finish first" nudge.
    unlock: z
      .object({
        after: z.coerce.date().optional(),
        storageKey: z.string().optional(),
        message: z.string().optional(),
      })
      .optional(),
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
