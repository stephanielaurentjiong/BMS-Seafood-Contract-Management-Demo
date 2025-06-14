export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: "general_manager" | "supplier" | "administrator";
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "general_manager" | "supplier" | "administrator";
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: "general_manager" | "supplier" | "administrator";
}