import type { MessageStructureObject } from "imapflow";
import type { AddressObject, ParsedMail } from "mailparser";

const flattenAddresses = (value?: AddressObject | AddressObject[]) => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => item.value.map(({ address }) => address?.toLowerCase()).filter(Boolean) as string[]);
};
export const getParsedMailAddresses = (mail: ParsedMail) => ({
  fromAddress: mail.from?.value[0]?.address?.toLowerCase() ?? "unknown@invalid.local",
  fromName: mail.from?.value[0]?.name ?? null,
  toAddresses: flattenAddresses(mail.to),
  ccAddresses: flattenAddresses(mail.cc),
  bccAddresses: flattenAddresses(mail.bcc),
});

export const getReferenceIds = (mail: ParsedMail) => {
  if (!mail.references) return [];
  return Array.isArray(mail.references) ? mail.references : [mail.references];
};

export const extractStructureAttachments = (
  node?: MessageStructureObject
): Array<{
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentId?: string;
  providerPartId?: string;
}> => {
  if (!node) return [];
  const children = node.childNodes?.flatMap(extractStructureAttachments) ?? [];
  const filename = node.dispositionParameters?.filename ?? node.parameters?.name;
  const attachment = node.disposition === "attachment" || Boolean(filename);
  return attachment
    ? [
        {
          filename: filename || "adjunto",
          mimeType: node.type,
          sizeBytes: node.size ?? 0,
          contentId: node.id,
          providerPartId: node.part,
        },
        ...children,
      ]
    : children;
};
