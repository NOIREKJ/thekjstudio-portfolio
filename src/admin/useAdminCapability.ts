import { useEffect, useState } from "react";

export function useAdminCapability(endpoint: string, accessToken: string | null) {
  const [authorizedToken, setAuthorizedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    void fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      if (response.ok && (await response.json())?.available === true && !controller.signal.aborted) {
        setAuthorizedToken(accessToken);
      }
    }).catch(() => {
      // Keep the control unavailable if the authenticated endpoint cannot be reached.
    });
    return () => controller.abort();
  }, [endpoint, accessToken]);

  return accessToken !== null && authorizedToken === accessToken;
}
