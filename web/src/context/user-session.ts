import type { Session } from "@supabase/supabase-js";
import constate from "constate";
import { useEffect, useState } from "react";
import { getSession, onAuthStateChange } from "../utils/supbase";
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
	return { session, setSession };
};

export const [UserSessionProvider, useUserSession] = constate(useHook);
