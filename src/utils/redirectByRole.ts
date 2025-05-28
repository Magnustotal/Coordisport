import { useRouter } from "next/navigation";

export const redirectByRole = (role: string | undefined, router: ReturnType<typeof useRouter>) => {
  if (role === "padre") router.push("/dashboard/padre");
  else if (role === "entrenador") router.push("/dashboard/entrenador");
  else if (role === "admin") router.push("/dashboard/admin");
  else router.push("/completar-perfil");
};
