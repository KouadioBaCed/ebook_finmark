import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { CourseSlug } from '../services/payment';

export interface QuizAttempt {
  score: number;
  total: number;
  at: string;
}

export interface CourseProgress {
  startedAt?: string;
  lastOpenedAt?: string;
  /** Liste de chapitres marqués comme terminés (envoyé par l'iframe via postMessage). */
  chaptersDone?: string[];
  /** Dernière tentative QCM (pour affichage rapide). */
  quizScore?: QuizAttempt;
  /** Toutes les tentatives QCM (historique complet). */
  quizAttempts?: QuizAttempt[];
  /** Exercices terminés (slugs/ids libres définis par chaque cours). */
  exercisesDone?: string[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  unlockedCourses: CourseSlug[];
  progress?: Record<string, CourseProgress>;
  createdAt: string;
}

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Ajoute un cours débloqué au document user — bundle débloque les 6 cours. */
  addUnlockedCourse: (slug: CourseSlug) => Promise<void>;
  /** Met à jour le progrès d'un cours (merge avec l'existant). */
  recordProgress: (slug: CourseSlug, patch: Partial<CourseProgress>) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALL_COURSES: CourseSlug[] = ['dataviz', 'sql', 'kpi', 'python', 'scoring', 'recrutement'];

function expandSlug(slug: CourseSlug): CourseSlug[] {
  return slug === 'bundle' ? ALL_COURSES : [slug];
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAppUser(user: User): Promise<AppUser | null> {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as AppUser;
    return { ...data, unlockedCourses: data.unlockedCourses || [] };
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setFirebaseUser(user);
      if (user) {
        try {
          const u = await loadAppUser(user);
          setAppUser(u);
        } catch {
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const u = await loadAppUser(cred.user);
    setAppUser(u);
  };

  const register = async (email: string, password: string, displayName: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName });
    const data: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email!,
      displayName,
      phone: phone || undefined,
      unlockedCourses: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setAppUser(data);
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  const addUnlockedCourse = async (slug: CourseSlug) => {
    if (!firebaseUser || !appUser) throw new Error('Not signed in');
    const toAdd = expandSlug(slug);
    const ref = doc(db, 'users', firebaseUser.uid);
    await updateDoc(ref, { unlockedCourses: arrayUnion(...toAdd) });
    const updated = Array.from(new Set([...appUser.unlockedCourses, ...toAdd]));
    setAppUser({ ...appUser, unlockedCourses: updated });
  };

  const recordProgress = async (slug: CourseSlug, patch: Partial<CourseProgress>) => {
    if (!firebaseUser || !appUser) return;
    const current: CourseProgress = appUser.progress?.[slug] || {};
    // Si patch contient un nouveau quizScore, on l'ajoute aussi à l'historique.
    const newAttempts = patch.quizScore
      ? [...(current.quizAttempts || []), patch.quizScore]
      : current.quizAttempts;
    // Merge intelligent : on cumule chaptersDone, exercisesDone et quizAttempts (jamais d'écrasement).
    const merged: CourseProgress = {
      ...current,
      ...patch,
      chaptersDone: Array.from(new Set([...(current.chaptersDone || []), ...(patch.chaptersDone || [])])),
      exercisesDone: Array.from(new Set([...(current.exercisesDone || []), ...(patch.exercisesDone || [])])),
      quizAttempts: newAttempts,
    };
    const ref = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(ref, { [`progress.${slug}`]: merged });
      setAppUser({
        ...appUser,
        progress: { ...(appUser.progress || {}), [slug]: merged },
      });
    } catch (err) {
      console.error('[recordProgress] failed', err);
    }
  };

  const refresh = async () => {
    if (!firebaseUser) return;
    const u = await loadAppUser(firebaseUser);
    setAppUser(u);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, login, register, logout, addUnlockedCourse, recordProgress, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
