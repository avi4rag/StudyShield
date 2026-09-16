import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignOut from "@/components/auth/SignOut";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">StudyShield</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Student dashboard</h1>
            <p className="mt-2 text-slate-600">You are signed in with Google.</p>
          </div>
          <SignOut />
        </div>
        <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="h-12 w-12 rounded-full" src={session.user.image} alt="" />
          ) : null}
          <div>
            <p className="font-semibold text-slate-900">{session.user.name ?? "StudyShield user"}</p>
            <p className="text-sm text-slate-500">{session.user.email}</p>
          </div>
        </div>
      </section>
    </main>
  );
}