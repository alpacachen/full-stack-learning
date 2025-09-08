import {
  createClient,
  type Session,
  type AuthChangeEvent,
} from "@supabase/supabase-js";
const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const logInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

const logOut = async () => {
  const { error } = await supabaseClient.auth.signOut();
  return error;
};

const getSession = async (): Promise<Session | null> => {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
};

const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
) => {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((event, session) =>
    callback(event, session)
  );
  return () => subscription.unsubscribe();
};

// Sign up with email and password
const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

// Sign in with GitHub
const signInWithGitHub = async () => {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export {
  signUpWithEmail,
  logInWithEmail,
  logOut,
  getSession,
  onAuthStateChange,
  signInWithGitHub,
};
