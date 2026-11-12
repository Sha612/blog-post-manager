import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Demo posts so a fresh environment has something to browse. Runs only when
 * the posts table is empty, so it is safe to run on every start, and does
 * nothing when SEED_DEMO_DATA=false.
 */
const DEMO_POSTS: ReadonlyArray<{ title: string; content: string }> = [
  {
    title: 'Welcome to the Blog Post Manager',
    content:
      'This app lets you create, read, update and delete blog posts.\n\nUse the search box to filter posts by title, switch between the grid and list views, and open a post to read it in full. Every change goes through a NestJS API backed by PostgreSQL.',
  },
  {
    title: 'Why every service runs in Docker',
    content:
      'A reviewer should be able to clone a repository and run one command.\n\nDocker Compose starts PostgreSQL, applies the database migrations, then starts the API and the web app once the services they depend on are healthy. No local database, no version mismatches.',
  },
  {
    title: 'Optimistic locking in plain words',
    content:
      'Two people open the same post and both press save. Without protection, the second save silently erases the first.\n\nEach post carries a version number. An update must send the version it was based on; if the stored version has moved on, the API answers 409 Conflict and the editor reloads the latest text instead of overwriting it.',
  },
  {
    title: 'Designing a small REST API',
    content:
      'Resources are nouns, HTTP methods are verbs: GET /api/posts lists, POST creates, PATCH changes part of a post and DELETE removes it.\n\nStatus codes carry meaning too: 201 with a Location header after a create, 204 after a delete, 404 for a missing post and 409 for a stale edit.',
  },
  {
    title: 'What a good error response looks like',
    content:
      'Every error from the API uses one shape: RFC 9457 problem details.\n\nIt says what went wrong in words a person can read, lists each invalid field for validation errors, and includes a request id that matches the server logs. Stack traces never leave the server.',
  },
  {
    title: 'Testing against a real database',
    content:
      'Mocks can only confirm what you already believe. The end-to-end tests start a throwaway PostgreSQL container, apply the real migrations and call the API over HTTP.\n\nThey caught a real bug: a search for 100% also matched 1000, because the ORM did not escape LIKE wildcards.',
  },
  {
    title: 'Five habits for readable TypeScript',
    content:
      'Name things for what they mean, not how they are built. Keep functions small enough to read in one go. Let types describe the data instead of comments.\n\nPrefer early returns to deep nesting, and delete code you no longer need: version control remembers it for you.',
  },
  {
    title: 'Logging that helps when something breaks',
    content:
      'One JSON line per request, with the method, path, status and duration, is enough to answer most questions.\n\nThe request id ties it together: it is returned to the client, written on every log line for that request and shown in error messages, so a support ticket leads straight to the right logs.',
  },
  {
    title: 'Server Components without the hype',
    content:
      'The web app renders pages on the server and calls the API from there, so the browser never talks to the API directly.\n\nThat removes CORS from the picture, keeps the API address out of the JavaScript bundle and makes the first page load fast. Interactive parts, such as forms, are Client Components.',
  },
  {
    title: 'Small commits tell a better story',
    content:
      'A commit should do one thing and say why. Reviewers read history to understand how a change was made, and a sequence of focused commits is far easier to follow than one large drop.\n\nIt also makes it easy to find, and revert, the exact change that broke something.',
  },
  {
    title: 'Validate on both sides',
    content:
      'The form validates as you type so you get instant feedback, and the API validates again because it can never trust a client.\n\nBoth sides use Zod with the same limits: a title between 3 and 120 characters and content between 10 and 20,000 characters.',
  },
  {
    title: 'A checklist before every release',
    content:
      'Clone the repository into an empty folder and run it from scratch. Try the unhappy paths: empty fields, very long text, a post deleted in another tab, the API switched off.\n\nCheck it on a phone-sized screen and with the keyboard only. Then read your own diff as if someone else wrote it.',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  if (process.env.SEED_DEMO_DATA === 'false') {
    console.log('Demo data skipped: SEED_DEMO_DATA is false.');
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const existing = await prisma.post.count();
    if (existing > 0) {
      console.log(`Demo data skipped: ${existing} posts already exist.`);
      return;
    }

    // One post per day, ending today, so "newest first" reads naturally.
    const now = Date.now();
    await prisma.post.createMany({
      data: DEMO_POSTS.map((post, index) => {
        const date = new Date(now - (DEMO_POSTS.length - 1 - index) * DAY_MS);
        return { ...post, createdAt: date, updatedAt: date };
      }),
    });
    console.log(`Seeded ${DEMO_POSTS.length} demo posts.`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
