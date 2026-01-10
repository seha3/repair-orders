import { create } from "zustand";

export type Role = "TALLER" | "CLIENTE";

type AuthState = {
  role: Role | null;
  customerId: string | null;
  loginAsWorkshop: () => void;
  loginAsClient: (customerId: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  customerId: null,
  loginAsWorkshop: () => set({ role: "TALLER", customerId: null }),
  loginAsClient: (customerId) => set({ role: "CLIENTE", customerId }),
  logout: () => set({ role: null, customerId: null }),
}));
