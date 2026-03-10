import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function usePwaUpdate() {
  const checkedOnLaunch = useRef(false);

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
    if (needRefresh) {
      toast("Обновление приложения...", { duration: 2000 });
      setTimeout(() => {
        updateServiceWorker(true);
      }, 1500);
    }
  }, [needRefresh, updateServiceWorker]);
}
