import { useEffect, useState } from "react";
import { mapLp } from "../../scripts/content/map";
import { getLps } from "./lp";

const columns = "id,artist,title,label,catalog_no,release_year,country,genre,format,speed,cover,apple_music_url,sort_order";

export function usePublicLps() {
  const [lps, setLps] = useState(getLps);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;

    const controller = new AbortController();
    const endpoint = new URL("/rest/v1/public_lp", url);
    endpoint.searchParams.set("select", columns);
    endpoint.searchParams.set("order", "sort_order.asc,id.asc");

    // Only the public projection is queried. The built-in snapshot covers network errors.
    void fetch(endpoint, {
      headers: { apikey: key },
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) return;
      const rows = await response.json();
      if (Array.isArray(rows) && !controller.signal.aborted) setLps(rows.map(mapLp));
    }).catch(() => {
      // Keep the built-in snapshot when the public view is unavailable.
    });

    return () => controller.abort();
  }, []);

  return lps;
}
