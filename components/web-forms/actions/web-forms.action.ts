import {
  getNewWebFormsCount,
  getWebFormDetail,
  getWebForms,
  replyWebForm,
  setWebFormStatus,
} from "@/actions/web-forms/web-forms";
import { detectCurriculums, moveWebFormMail, setWebFormKind } from "@/actions/web-forms/web-forms-sorting";
import ValidationError from "@/instances/validation-error";
import type {
  ListWebFormsInput,
  ReplyWebFormInput,
  SetWebFormKindInput,
  SetWebFormStatusInput,
  SortWebFormMailInput,
} from "@/schemas/web-forms";

// Formularios web con TanStack Query: un { error } se lanza como
// ValidationError para que la query o la mutación lo muestren.
const FALLBACK = "No se pudo completar la acción";

const unwrap = <T extends object>(result: T | { error: string }): T => {
  if ("error" in result) throw new ValidationError(result.error || FALLBACK);
  return result;
};

export const listWebFormsAction = async (input: ListWebFormsInput) => unwrap(await getWebForms(input));

export const webFormDetailAction = async (id: string) => unwrap(await getWebFormDetail(id)).form;

export const newWebFormsCountAction = async () => unwrap(await getNewWebFormsCount()).count;

export const setWebFormStatusAction = async (input: SetWebFormStatusInput) =>
  unwrap(await setWebFormStatus(input)).success;

export const replyWebFormAction = async (input: ReplyWebFormInput) => unwrap(await replyWebForm(input));

export const setWebFormKindAction = async (input: SetWebFormKindInput) => unwrap(await setWebFormKind(input)).success;

export const detectCurriculumsAction = async () => unwrap(await detectCurriculums());

export const moveWebFormMailAction = async (input: SortWebFormMailInput) => unwrap(await moveWebFormMail(input));
