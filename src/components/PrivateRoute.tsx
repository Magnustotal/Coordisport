// /components/PrivateRoute.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { CircularProgress, Box } from "@mui/material";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
