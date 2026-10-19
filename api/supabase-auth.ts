// Supabase Auth REST client. The publishable key is safe for mobile clients.
// Never place a service_role or secret key here.
const base = "https://niakfwerfqmrmhuypkpd.supabase.co/auth/v1";
const publishableKey = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";

type AuthResult = { access_token?: string; refresh_token?: string; user?: { id: string; email?: string; user_metadata?: { name?: string }; email_confirmed_at?: string | null }; error?: string; msg?: string; error_description?: string };
export type AuthSession = { accessToken: string; refreshToken: string };

async function request(path: string, method: string, body?: unknown, token?: string): Promise<AuthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(base + path, {
      method,
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data: AuthResult = await response.json();
    if (!response.ok) throw new Error(data.msg || data.error_description || data.error || "Error de autenticación");
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("El servidor tardó demasiado en responder.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const supabaseAuth = {
  signIn: (email: string, password: string) => request("/token?grant_type=password", "POST", { email, password }),
  signUp: (name: string, email: string, password: string) => request("/signup", "POST", { email, password, data: { name } }),
  currentUser: (token: string) => request("/user", "GET", undefined, token),
  refresh: (refreshToken: string) => request("/token?grant_type=refresh_token", "POST", { refresh_token: refreshToken }),
  resetPassword: (email: string) => request("/recover", "POST", { email }),
  verifyRecovery: (email: string, token: string) => request("/verify", "POST", { email, token, type: "recovery" }),
  updatePassword: (token: string, password: string) => request("/user", "PUT", { password }, token),
  verifySignup: (email: string, token: string) => request("/verify", "POST", { email, token, type: "signup" }),
  resendSignup: (email: string) => request("/resend", "POST", { email, type: "signup" }),
};
