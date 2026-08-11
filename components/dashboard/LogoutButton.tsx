"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  );
}
