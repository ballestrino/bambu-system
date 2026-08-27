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
      include: {
        attachments: true;
        suggestion: {
          include: {
            revisions: {
              include: {
                sources: {
                  include: {
                    officialBudgetOption: true;
                    officialBudgetVersion: {
                      include: {
                        officialBudget: {
                          select: {
                            id: true;
                            sourceBudgetId: true;
                            sourceBudgetName: true;
                            sourceBudgetSlug: true;
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

export type MailDraftSourceDetail = NonNullable<
  MailThreadDetail["messages"][number]["suggestion"]
>["revisions"][number]["sources"][number];

export type MailMemoryItem = Prisma.MailMemoryGetPayload<Record<string, never>>;
export type MailRuleItem = Prisma.MailAutoReplyRuleGetPayload<Record<string, never>>;
