"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { PublicUser } from "@/lib/api-client";

type CurrentUserContextValue = {
  currentUser: PublicUser | null;
  setCurrentUser: (user: PublicUser | null) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({
  initialUser,
  children
}: {
  initialUser: PublicUser | null;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(initialUser);
  const value = useMemo(() => ({ currentUser, setCurrentUser }), [currentUser]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const value = useContext(CurrentUserContext);
  if (!value) {
    return { currentUser: null, setCurrentUser: () => undefined };
  }

  return value;
}
