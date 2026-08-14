import { db } from "@/lib/db";
import { findSemanticSentMail } from "@/lib/mail-agent/embedding";

type RetrievalMessage = {
  threadId: string;
  fromAddress: string;
  subject: string;
  embedding?: number[];
};

export const getMailRetrievalContext = async (message: RetrievalMessage) => {
  const [memories, examples, semanticExamples, rules] = await Promise.all([
    db.mailMemory.findMany({
      where: {
        status: "APPROVED",
        OR: [{ contactEmail: null }, { contactEmail: message.fromAddress }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] }],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { scope: true, key: true, value: true },
    }),
    db.mailMessage.findMany({
      where: {
        direction: "OUTBOUND",
        state: "SENT",
        OR: [
          { threadId: message.threadId },
          { thread: { normalizedSubject: { contains: message.subject.slice(0, 80) } } },
        ],
      },
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: { subject: true, bodyText: true, toAddresses: true },
    }),
    message.embedding?.length ? findSemanticSentMail(message.embedding) : [],
    db.mailAutoReplyRule.findMany({
      where: { status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        name: true,
        intent: true,
        exampleReplySubject: true,
        exampleReplyBody: true,
        protectedLiterals: true,
      },
    }),
  ]);

  return {
    memories: memories.map((item) => `${item.scope}/${item.key}: ${item.value}`),
    examples: [
      ...semanticExamples,
      ...examples.map((item) => ({
        subject: item.subject,
        body: item.bodyText,
        recipients: item.toAddresses,
      })),
    ].filter(
      (item, index, all) =>
        all.findIndex((candidate) =>
          candidate.subject === item.subject && candidate.body === item.body
        ) === index
    ).slice(0, 10),
    rules,
  };
};
