"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CheckInboxContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-6">
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="text-xl text-balance text-muted-foreground">
                We've sent a confirmation email to{" "}
                <span className="font-bold">{email}</span>. There's no link to no email so
                just log in using the email and password you provided.
              </p>
              <p className="text-sm text-muted-foreground">
                hope you enjoyed the login process :D
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckInboxPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckInboxContent />
    </Suspense>
  );
}
