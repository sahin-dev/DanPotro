"use client";

import { CheckCircle2, LoaderCircle, LogOut, MonitorSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { apiRequest, errorMessage } from "@/lib/client";
import { PASSWORD_RULES } from "@/lib/password-rules";

type Feedback = { type: "success" | "error"; message: string } | null;

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return <p role={feedback.type === "error" ? "alert" : "status"} className={`flex gap-2 rounded-xl p-3 text-xs leading-5 ${feedback.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{feedback.type === "success" && <CheckCircle2 size={15} className="mt-0.5 shrink-0" />}{feedback.message}</p>;
}

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      await apiRequest("/api/account", { method: "PATCH", json: { displayName: name } });
      setFeedback({ type: "success", message: "Display name saved." });
      router.refresh();
    } catch (caught) {
      setFeedback({ type: "error", message: errorMessage(caught) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="displayName">Display name</label><input id="displayName" className="field" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required /></div>
      <FeedbackMessage feedback={feedback} />
      <button className="btn-primary" disabled={loading || name.trim() === initialName}>{loading && <LoaderCircle size={15} className="animate-spin" />}Save name</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const result = await apiRequest<{ message: string }>("/api/account/password", { json: { currentPassword, newPassword } });
      setFeedback({ type: "success", message: result.message });
      setCurrentPassword("");
      setNewPassword("");
    } catch (caught) {
      setFeedback({ type: "error", message: errorMessage(caught) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="currentPassword">Current password</label><PasswordField id="currentPassword" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" /></div>
      <div><label className="label" htmlFor="newPassword">New password</label><PasswordField id="newPassword" value={newPassword} onChange={setNewPassword} autoComplete="new-password" describedBy="new-password-rules" /><p id="new-password-rules" className="mt-1.5 text-[10px] text-ink/35">{PASSWORD_RULES}</p></div>
      <FeedbackMessage feedback={feedback} />
      <button className="btn-primary" disabled={loading}>{loading && <LoaderCircle size={15} className="animate-spin" />}Change password</button>
    </form>
  );
}

export function SessionControls() {
  const [loading, setLoading] = useState<"others" | "this" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const router = useRouter();

  async function signOutOthers() {
    setLoading("others");
    setFeedback(null);
    try {
      const result = await apiRequest<{ message: string }>("/api/account/sessions", { method: "DELETE" });
      setFeedback({ type: "success", message: result.message });
    } catch (caught) {
      setFeedback({ type: "error", message: errorMessage(caught) });
    } finally {
      setLoading(null);
    }
  }

  async function signOut() {
    setLoading("this");
    await apiRequest("/api/auth/logout").catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-ink/50">Lost a phone or used a shared computer? Signing out other devices ends every session except this one.</p>
      <FeedbackMessage feedback={feedback} />
      <div className="flex flex-wrap gap-2">
        <button onClick={signOutOthers} className="btn-secondary" disabled={loading !== null}>{loading === "others" ? <LoaderCircle size={15} className="animate-spin" /> : <MonitorSmartphone size={15} />}Sign out other devices</button>
        <button onClick={signOut} className="btn-secondary text-red-700" disabled={loading !== null}><LogOut size={15} />Sign out here</button>
      </div>
    </div>
  );
}
