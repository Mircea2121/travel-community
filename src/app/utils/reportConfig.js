export const REPORT_REASONS = Object.freeze([
  Object.freeze({
    value: "spam",
    label: "Spam sau promovare nedorită",
  }),
  Object.freeze({
    value: "offensive_language",
    label: "Limbaj ofensator",
  }),
  Object.freeze({
    value: "harassment",
    label: "Hărțuire sau amenințări",
  }),
  Object.freeze({
    value: "sexual_content",
    label: "Conținut sexual",
  }),
  Object.freeze({
    value: "violence",
    label: "Violență sau amenințări cu violența",
  }),
  Object.freeze({
    value: "false_information",
    label: "Informații false sau înșelătoare",
  }),
  Object.freeze({
    value: "fraud",
    label: "Înșelătorie sau tentativă de fraudă",
  }),
  Object.freeze({
    value: "inappropriate_content",
    label: "Conținut nepotrivit",
  }),
  Object.freeze({
    value: "other",
    label: "Alt motiv",
  }),
]);

export const REPORT_TARGET_TYPES = Object.freeze([
  "post",
  "comment",
  "conversation",
  "message",
  "user",
]);

export const REPORT_MAX_DETAILS_LENGTH = 1000;

export const URGENT_REPORT_REASONS = Object.freeze([
  "harassment",
  "violence",
  "minor_safety",
]);

const REPORT_REASON_SET = new Set(
  REPORT_REASONS.map((reason) => reason.value)
);

const REPORT_TARGET_TYPE_SET = new Set(REPORT_TARGET_TYPES);

export function isReportReason(value) {
  return (
    typeof value === "string" &&
    REPORT_REASON_SET.has(value)
  );
}

export function isReportTargetType(value) {
  return (
    typeof value === "string" &&
    REPORT_TARGET_TYPE_SET.has(value)
  );
}

export function isUrgentReportReason(value) {
  return URGENT_REPORT_REASONS.includes(value);
}
