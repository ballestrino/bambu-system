import type { Prisma } from "@prisma/client";

export type MailThreadListItem = Prisma.MailThreadGetPayload<{
  include: {
    messages: {
      include: { suggestion: true };
    };
  };
}> & {
  canMove: boolean;
  currentFolderKey?: string;
};

export type MailThreadDetail = Prisma.MailThreadGetPayload<{
  include: {
    messages: {
      include: { attachments: true; suggestion: true };
    };
  };
}>;

export type MailMemoryItem = Prisma.MailMemoryGetPayload<Record<string, never>>;
export type MailRuleItem = Prisma.MailAutoReplyRuleGetPayload<Record<string, never>>;
