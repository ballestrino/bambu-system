type MailMessageDates = {
  receivedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
};

export const getMailMessageDate = (message: MailMessageDates) =>
  message.receivedAt ?? message.sentAt ?? message.createdAt;

export const sortMailMessages = <T extends MailMessageDates>(
  messages: T[],
  direction: "asc" | "desc"
) =>
  [...messages].sort((left, right) => {
    const difference = getMailMessageDate(left).getTime() - getMailMessageDate(right).getTime();
    return direction === "asc" ? difference : -difference;
  });
