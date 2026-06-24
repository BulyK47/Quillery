import { useEffect, useState } from "react";
import { FolderOpen, FolderSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DesktopSyncApi {
  isElectron: boolean;
  sync: {
    getFolder(): Promise<string | null>;
    chooseFolder(): Promise<string | null>;
    clearFolder(): Promise<void>;
  };
}

function getDesktop(): DesktopSyncApi | null {
  const d = (window as unknown as { desktop?: DesktopSyncApi }).desktop;
  return d?.isElectron && d.sync ? d : null;
}

export function SyncSettings({ onChanged }: { onChanged: () => void }) {
  const api = getDesktop();
  const [folder, setFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    api.sync.getFolder().then(setFolder).catch(() => {});
  }, [api]);

  // Desktop-only feature — the browser extension syncs automatically.
  if (!api) return null;

  const choose = async () => {
    try {
      const f = await api.sync.chooseFolder();
      setFolder(f);
      if (f) {
        toast.success("Sync folder set", {
          description: "Quillery will keep your prompts in this folder.",
        });
      }
      onChanged();
    } catch {
      toast.error("Couldn't set the sync folder");
    }
  };

  const disable = async () => {
    await api.sync.clearFolder();
    setFolder(null);
    toast.success("Sync disabled");
    onChanged();
  };

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <FolderSync className="size-4" />
        Sync folder
      </h3>
      <p className="text-xs text-muted-foreground">
        Save your prompts to a folder (e.g. inside OneDrive or Dropbox) to sync
        them across your computers. The folder's copy is the source of truth —
        choosing a folder that already has a Quillery backup loads it, replacing
        this device's prompts.
      </p>
      {folder ? (
        <div className="flex items-center gap-2">
          <code
            className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate"
            title={folder}
          >
            {folder}
          </code>
          <Button size="sm" variant="outline" onClick={choose}>
            Change
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={disable}
          >
            Disable
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={choose} className="gap-2">
          <FolderOpen className="size-4" />
          Choose folder…
        </Button>
      )}
    </div>
  );
}
