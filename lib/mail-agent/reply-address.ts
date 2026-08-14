type ReplyAddressMessage = {
  fromAddress: string;
  bodyText: string;
  headers: unknown;
};

const findEmail = (value: string) =>
  value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0].toLowerCase();

const getHeaderReplyTo = (headers: unknown) => {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) return undefined;
  const replyTo = (headers as Record<string, unknown>).replyTo;
  return typeof replyTo === "string" ? findEmail(replyTo) : undefined;
};

export const getMailReplyAddress = (
  message: ReplyAddressMessage,
  mailboxAddress?: string
) => {
  const mailbox = mailboxAddress?.toLowerCase();
  const headerReplyTo = getHeaderReplyTo(message.headers);
  if (headerReplyTo && headerReplyTo !== mailbox) return headerReplyTo;
  if (message.fromAddress.toLowerCase() !== mailbox) return message.fromAddress;
  const formEmail = message.bodyText.match(
    /(?:^|\r?\n)\s*Email\s*:\s*([^\s<>;,]+)/i
  )?.[1];
  const parsedFormEmail = formEmail ? findEmail(formEmail) : undefined;
  return parsedFormEmail && parsedFormEmail !== mailbox ? parsedFormEmail : undefined;
};
