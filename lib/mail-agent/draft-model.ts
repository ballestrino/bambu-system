import type { ResponseInput, ResponseInputItem } from "openai/resources/responses/responses";

import {
  MAIL_DRAFT_INSTRUCTIONS,
  MAIL_DRAFT_JSON_SCHEMA,
  MAIL_DRAFT_REVISION_INSTRUCTIONS,
} from "@/lib/mail-agent/draft-prompt";
import { getMailOpenAI } from "@/lib/mail-agent/openai-client";
import {
  SEARCH_OFFICIAL_BUDGETS_TOOL,
  searchOfficialBudgets,
  type OfficialBudgetSearchResult,
} from "@/lib/official-budgets/search";
import {
  mailSuggestionOutputSchema,
  type MailSuggestionOutput,
} from "@/schemas/mail";

export type SearchMatch = OfficialBudgetSearchResult["matches"][number];

const createResponse = (
  input: ResponseInput,
  safetyIdentifier: string,
  instructions: string
) =>
  getMailOpenAI().responses.create({
    model: "gpt-5.6-luna" as never,
    store: false,
    safety_identifier: safetyIdentifier,
    reasoning: { effort: "xhigh" },
    instructions,
    input,
    tools: [SEARCH_OFFICIAL_BUDGETS_TOOL],
    parallel_tool_calls: false,
    text: {
      format: {
        type: "json_schema",
        name: "bambu_mail_reply",
        strict: true,
        schema: MAIL_DRAFT_JSON_SCHEMA,
      },
    },
  });

const runGroundedDraft = async (
  prompt: string,
  safetyIdentifier: string,
  instructions: string,
  initialEvidence?: Map<string, SearchMatch>
): Promise<{ draft: MailSuggestionOutput; evidence: Map<string, SearchMatch> }> => {
  const input: ResponseInput = [{ role: "user", content: prompt }];
  const evidence = new Map(initialEvidence);

  for (let step = 0; step < 3; step += 1) {
    const response = await createResponse(input, safetyIdentifier, instructions);
    const calls = response.output.filter((item) => item.type === "function_call");
    if (!calls.length) {
      return {
        draft: mailSuggestionOutputSchema.parse(JSON.parse(response.output_text)),
        evidence,
      };
    }
    input.push(...(response.output as ResponseInputItem[]));
    for (const call of calls) {
      if (call.name !== "searchOfficialBudgets") {
        throw new Error(`Herramienta de correo no permitida: ${call.name}`);
      }
      const result = await searchOfficialBudgets(JSON.parse(call.arguments));
      if (result.status === "exact") {
        result.matches.forEach((match) => evidence.set(match.sourceOptionId, match));
      }
      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(result),
      });
    }
  }
  throw new Error("Luna excedió el límite de búsquedas de presupuestos oficiales");
};

export const generateGroundedDraft = (prompt: string, safetyIdentifier: string) =>
  runGroundedDraft(prompt, safetyIdentifier, MAIL_DRAFT_INSTRUCTIONS);

export const generateGroundedRevision = (
  prompt: string,
  safetyIdentifier: string,
  evidence: Map<string, SearchMatch>
) => runGroundedDraft(
  prompt,
  safetyIdentifier,
  MAIL_DRAFT_REVISION_INSTRUCTIONS,
  evidence
);
