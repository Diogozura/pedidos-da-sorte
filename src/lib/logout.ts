// lib/logout.ts
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

export const logout = async () => {
  await signOut(auth);
};
