import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
import { parseDate, postId, readPosts, excerpt } from "../scripts/content.mjs";

export const BLOG_PATH = "source/_posts";
// Validate before glob can silently overwrite entries with duplicate IDs.
const descriptions = new Map(readPosts().map(post => [post.id, excerpt(post.content)]));
const posts = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: `./${BLOG_PATH}`,
    generateId: ({ data }) => postId(data),
  }),
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]),
    slug: z.string(),
    description: z.string().optional(),
    categories: z.array(z.string()).nullish().transform(value => value ?? []),
    tags: z.array(z.string()).nullish().transform(value => value ?? []),
    author: z.string().default(config.site.author),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    modDatetime: z.date().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
    hideEditPost: z.boolean().optional(),
    timezone: z.string().default("UTC"),
  }).transform(data => ({
    ...data,
    pubDatetime: parseDate(data.date),
    description: data.description ?? descriptions.get(postId(data)) ?? data.title,
  })),
});
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(), description: z.string().optional(),
    ogImage: z.string().optional(), canonicalURL: z.string().optional(),
  }),
});
export const collections = { posts, pages };
