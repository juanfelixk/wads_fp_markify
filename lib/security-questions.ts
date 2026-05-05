export const SECURITY_QUESTIONS = [
    "What is the name of the city where you were born?",
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the name of your primary school?",
    "What is your oldest sibling's middle name?",
] as const;

export type SecurityQuestion = (typeof SECURITY_QUESTIONS)[number];