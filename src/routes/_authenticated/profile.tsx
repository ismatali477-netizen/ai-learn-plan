import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarSignedUrl } from "@/lib/avatar.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EDUCATION_LEVEL_OPTIONS } from "@/lib/ai-tutor.functions";
import { UserCircle, Upload, Loader2, GraduationCap, Palette } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — AI Study Planner" }] }),
  component: ProfilePage,
});

const DAYS = [
  { v: 1, l: "Mon" }, { v: 2, l: "Tue" }, { v: 3, l: "Wed" }, { v: 4, l: "Thu" },
  { v: 5, l: "Fri" }, { v: 6, l: "Sat" }, { v: 0, l: "Sun" },
];

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const getSigned = useServerFn(getAvatarSignedUrl);
  const fileInput = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const settings = useQuery({
    queryKey: ["user-settings", user.id],
    queryFn: async () => (await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()).data,
  });

  const [fullName, setFullName] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [dailyGoal, setDailyGoal] = useState(120);
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [faculty, setFaculty] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("auto");
  const [startH, setStartH] = useState(9);
  const [endH, setEndH] = useState(21);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pwork, setPwork] = useState(25);
  const [pbreak, setPbreak] = useState(5);
  const [plong, setPlong] = useState(15);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setLearningGoal(profile.data.learning_goal ?? "");
      setDailyGoal(profile.data.daily_study_minutes_goal ?? 120);
      setEducationLevel((profile.data as any).education_level ?? "");
      setCourse((profile.data as any).course ?? "");
      setSemester((profile.data as any).semester ?? "");
      setFaculty((profile.data as any).faculty ?? "");
      setPreferredLanguage((profile.data as any).preferred_language ?? "auto");
    }
  }, [profile.data]);

  useEffect(() => {
    if (settings.data) {
      setStartH(settings.data.preferred_start_hour);
      setEndH(settings.data.preferred_end_hour);
      setDays(settings.data.preferred_days as number[]);
      setPwork(settings.data.pomodoro_work_minutes);
      setPbreak(settings.data.pomodoro_break_minutes);
      setPlong(settings.data.pomodoro_long_break_minutes);
      setNotifEnabled(settings.data.notifications_enabled);
    }
  }, [settings.data]);

  // Resolve avatar signed URL
  useEffect(() => {
    if (!profile.data?.avatar_url) { setAvatarUrl(null); return; }
    const path = profile.data.avatar_url;
    if (path.startsWith("http")) { setAvatarUrl(path); return; }
    getSigned({ data: { path } }).then((r) => setAvatarUrl(r.url)).catch(() => setAvatarUrl(null));
  }, [profile.data?.avatar_url, getSigned]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          learning_goal: learningGoal || null,
          daily_study_minutes_goal: dailyGoal,
          education_level: educationLevel || null,
          course: course || null,
          semester: semester || null,
          faculty: faculty || null,
          preferred_language: preferredLanguage,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          preferred_start_hour: startH,
          preferred_end_hour: endH,
          preferred_days: days,
          pomodoro_work_minutes: pwork,
          pomodoro_break_minutes: pbreak,
          pomodoro_long_break_minutes: plong,
          notifications_enabled: notifEnabled,
        }, { onConflict: "user_id" });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { error: pErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (pErr) throw pErr;
      toast.success("Photo updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><UserCircle className="size-7 text-primary" /> Profile</h1>
        <p className="text-muted-foreground">Manage your account and study preferences.</p>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
            <AvatarFallback>{(fullName || user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
            />
            <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Uploading..." : "Upload photo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">JPG/PNG up to 5 MB</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><GraduationCap className="size-4 text-primary" /> Education (for AI Tutor)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Education level</Label>
            <Select value={educationLevel || "none"} onValueChange={(v) => setEducationLevel(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {EDUCATION_LEVEL_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Course</Label><Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. BSc CSIT" /></div>
          <div className="space-y-2"><Label>Semester / Grade</Label><Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Semester 3" /></div>
          <div className="space-y-2"><Label>Faculty</Label><Input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g. Science" /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>Preferred AI language</Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (match my language)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ne">Nepali</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">About you</h2>
        <div className="space-y-2"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} /></div>
        <div className="space-y-2">
          <Label>Learning goal</Label>
          <Textarea value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Pass MCAT in May with 90th percentile" />
        </div>
        <div className="space-y-2">
          <Label>Daily study goal (minutes)</Label>
          <Input type="number" min={15} max={720} value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value) || 120)} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Study preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Preferred start hour (0–23)</Label><Input type="number" min={0} max={23} value={startH} onChange={(e) => setStartH(Math.max(0, Math.min(23, Number(e.target.value) || 0)))} /></div>
          <div className="space-y-2"><Label>Preferred end hour</Label><Input type="number" min={0} max={23} value={endH} onChange={(e) => setEndH(Math.max(0, Math.min(23, Number(e.target.value) || 0)))} /></div>
        </div>
        <div className="space-y-2">
          <Label>Preferred study days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = days.includes(d.v);
              return (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => setDays((cur) => on ? cur.filter((x) => x !== d.v) : [...cur, d.v].sort())}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >{d.l}</button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Pomodoro work</Label><Input type="number" min={1} max={180} value={pwork} onChange={(e) => setPwork(Number(e.target.value) || 25)} /></div>
          <div className="space-y-2"><Label>Short break</Label><Input type="number" min={1} max={60} value={pbreak} onChange={(e) => setPbreak(Number(e.target.value) || 5)} /></div>
          <div className="space-y-2"><Label>Long break</Label><Input type="number" min={1} max={60} value={plong} onChange={(e) => setPlong(Number(e.target.value) || 15)} /></div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>In-app notifications</Label>
            <p className="text-xs text-muted-foreground">Reminders, achievements, missed tasks</p>
          </div>
          <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} size="lg">
          {saveProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
