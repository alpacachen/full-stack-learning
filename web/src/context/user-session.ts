import type { Session } from "@supabase/supabase-js";
import constate from "constate";
import { useEffect, useState } from "react";
import { getSession, onAuthStateChange } from "../utils/supbase";
import { baseGet } from "../utils/fetch";
const useHook = () => {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    getSession().then((session) => {
      setSession(session);
    });
    const unsubscribe = onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return unsubscribe;
  }, []);

  const getWithAuth = async (url: string) => {
    return await baseGet(`${url}`, {
      Authorization: `Bearer ${session?.access_token}`,
    });
  };

  return { session, getWithAuth };
};

export const [UserSessionProvider, useUserSession] = constate(useHook);
