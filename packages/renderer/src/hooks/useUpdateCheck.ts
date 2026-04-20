import type { UpdateInfo } from '@varys/core';
import { useEffect, useState } from 'react';

export function useUpdateCheck() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    return window.varys.on('updater:updateAvailable', (info) => {
      setUpdateInfo(info);
    });
  }, []);

  const dismiss = () => setUpdateInfo(null);

  const openRelease = () => {
    if (updateInfo) {
      void window.varys.invoke('updater:openRelease', { url: updateInfo.releaseUrl });
    }
  };

  return { updateInfo, dismiss, openRelease };
}
