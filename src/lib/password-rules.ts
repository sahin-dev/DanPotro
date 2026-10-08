export const PASSWORD_RULES = "At least 10 characters, including a letter and a number.";

export function isStrongPassword(password: string) {
  return password.length >= 10 && password.length <= 200 && /[a-z]/i.test(password) && /\d/.test(password);
}
