import { db } from "@/lib/db";
import { getMailOpenAI } from "@/lib/mail-agent/openai-client";

export type SemanticRuleMatch = {
  id: string;
  similarity: number;
};

export type SemanticMailExample = {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  similarity: number;
};

const vectorLiteral = (embedding: number[]) => {
  if (embedding.length !== 1536 || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding de correo inválido");
  }
  return `[${embedding.join(",")}]`;
};

export const createMailEmbedding = async (input: string) => {
  const response = await getMailOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: input.slice(0, 30_000),
    encoding_format: "float",
  });
  return response.data[0]?.embedding ?? [];
};

export const storeMailMessageEmbedding = (id: string, embedding: number[]) =>
  db.$executeRawUnsafe(
    'UPDATE "MailMessage" SET "embedding" = $1::vector WHERE "id" = $2',
    vectorLiteral(embedding),
    id
  );

export const storeMailMemoryEmbedding = (id: string, embedding: number[]) =>
  db.$executeRawUnsafe(
    'UPDATE "MailMemory" SET "embedding" = $1::vector WHERE "id" = $2',
    vectorLiteral(embedding),
    id
  );

export const storeMailRuleEmbedding = (id: string, embedding: number[]) =>
  db.$executeRawUnsafe(
    'UPDATE "MailAutoReplyRule" SET "embedding" = $1::vector WHERE "id" = $2',
    vectorLiteral(embedding),
    id
  );

export const findSemanticMailRules = (embedding: number[], limit = 5) =>
  db.$queryRawUnsafe<SemanticRuleMatch[]>(
    `SELECT "id", 1 - ("embedding" <=> $1::vector) AS "similarity"
     FROM "MailAutoReplyRule"
     WHERE "status" = 'ACTIVE' AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $1::vector
     LIMIT $2`,
    vectorLiteral(embedding),
    limit
  );

export const findSemanticSentMail = (embedding: number[], limit = 6) =>
  db.$queryRawUnsafe<SemanticMailExample[]>(
    `SELECT "id", "subject", "bodyText" AS "body",
            "toAddresses" AS "recipients",
            1 - ("embedding" <=> $1::vector) AS "similarity"
     FROM "MailMessage"
     WHERE "direction" = 'OUTBOUND' AND "state" = 'SENT'
       AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $1::vector
     LIMIT $2`,
    vectorLiteral(embedding),
    limit
  );

export const embedHistoricalSentMail = async (limit = 5) => {
  const rows = await db.$queryRaw<Array<{ id: string; subject: string; body: string }>>`
    SELECT "id", "subject", "bodyText" AS "body"
    FROM "MailMessage"
    WHERE "direction" = 'OUTBOUND' AND "state" = 'SENT' AND "embedding" IS NULL
    ORDER BY "sentAt" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${limit}
  `;
  let embedded = 0;
  for (const row of rows) {
    try {
      await storeMailMessageEmbedding(
        row.id,
        await createMailEmbedding(`${row.subject}\n${row.body}`)
      );
      embedded += 1;
    } catch {
      // A later bounded sync retries the same missing embedding.
    }
  }
  return embedded;
};
