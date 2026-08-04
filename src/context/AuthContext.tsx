"use client";

import React, { createContext, useContext, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseAuth, getFirebaseConfigurationError } from "@/lib/firebase-client";
import { getUserProfile, type UserProfile } from "@/lib/firebase/auth-helpers";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  configurationError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  configurationError: null,
});

export function useUserProfileQuery(uid: string | null) {
  return useQuery<UserProfile | null, Error>({
    queryKey: ["auth", "userProfile", uid],
    queryFn: async () => (uid ? getUserProfile(uid) : null),
    enabled: !!uid,
    staleTime: 300000,
    gcTime: 1800000,
    retry: 2,
  });
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const configurationError = getFirebaseConfigurationError();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(!configurationError);
  const queryClient = useQueryClient();
  const userProfileQuery = useUserProfileQuery(user?.uid || null);

  useEffect(() => {
    if (configurationError) return;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (authUser) => {
      setUser(authUser);
      setLoading(false);
      if (authUser) {
        queryClient.prefetchQuery({
          queryKey: ["auth", "userProfile", authUser.uid],
          queryFn: () => getUserProfile(authUser.uid),
        });
      } else {
        queryClient.clear();
      }
    });

    return unsubscribe;
  }, [configurationError, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile: userProfileQuery.data || null,
        loading: loading || userProfileQuery.isLoading,
        configurationError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth;
