import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const UPDATED_FLAG = "pwa-updated-this-session";

export function usePwaUpdate() {
  const checkedOnLaunch = useRef(false);
  const updateTriggered = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Single update check on launch
      if (registration && !checkedOnLaunch.current) {
        checkedOnLaunch.current = true;
        registration.update();
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    if (updateTriggered.current) return;
    // Guard: only auto-update once per session to prevent reload loops
    if (sessionStorage.getItem(UPDATED_FLAG)) return;

    updateTriggered.current = true;
    sessionStorage.setItem(UPDATED_FLAG, "1");
    toast("Обновление приложения...", { duration: 2000 });
    setTimeout(() => {
      updateServiceWorker(true);
    }, 1500);
  }, [needRefresh, updateServiceWorker]);
}
