import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { Trophy } from "lucide-react";
import { createElement } from "react";

type Earned = { code: string; title: string; description: string; icon: string; xp_reward: number };

/** Show a celebratory toast for each newly-earned achievement. */
export function celebrateAchievements(items: Earned[] | undefined) {
  if (!items || items.length === 0) return;
  items.forEach((a, i) => {
    const Icon = ((LucideIcons as any)[a.icon] as React.ComponentType<{ className?: string }>) ?? Trophy;
    setTimeout(() => {
      toast.success(`🏆 ${a.title}`, {
        description: `${a.description} · +${a.xp_reward} XP`,
        icon: createElement(Icon, { className: "size-4" }),
        duration: 5000,
      });
    }, i * 400);
  });
}
