import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deactivated?: string }>;
}) {
  const { deactivated } = await searchParams;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      {deactivated && (
        <p className="max-w-sm rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 text-center">
          Your account has been deactivated. Contact your Work Pulse admin if this is unexpected.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
