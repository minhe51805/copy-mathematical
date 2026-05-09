export const MOCK_AUTH_USER = {
  username: "admin123",
  password: "123456",
  displayName: "Admin",
};

const AUTH_STORAGE_KEY = "ai-math-chat-auth";

export function isMockAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_STORAGE_KEY) === "authenticated";
}

export function loginMockUser(username: string, password: string) {
  const isValid =
    username.trim() === MOCK_AUTH_USER.username &&
    password === MOCK_AUTH_USER.password;

  if (isValid && typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, "authenticated");
  }

  return isValid;
}

export function logoutMockUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
