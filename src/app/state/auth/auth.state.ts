import { User } from "../../models/user.model";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: string | null;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  role: null,
  error: null,
};
