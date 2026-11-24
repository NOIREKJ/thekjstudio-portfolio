import { useRef, useState } from "react";
import { useAdminCapability } from "./useAdminCapability";
import styles from "./Admin.module.css";

const endpoint = "/api/admin/redeploy";

type Feedback = { kind: "success" | "error"; message: string };

export function RedeployPanel({ accessToken, editing }: { accessToken: string; editing: boolean }) {
  const canRedeploy = useAdminCapability(endpoint, accessToken);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const requestInFlight = useRef(false);

  async function redeploy() {
    if (!canRedeploy || editing || requestInFlight.current) return;
    requestInFlight.current = true;
    setSending(true);
    setFeedback(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 429 || response.status === 409) {
        setFeedback({ kind: "error", message: "이미 요청이 접수됐습니다. 잠시 후 다시 시도해 주세요." });
      } else if (response.status === 202 && (await response.json())?.status === "queued") {
        setFeedback({ kind: "success", message: "배포 요청이 접수됐습니다. 빌드가 끝나면 운영 사이트에 반영됩니다." });
      } else {
        setFeedback({ kind: "error", message: "배포 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
      }
    } catch {
      setFeedback({ kind: "error", message: "배포 요청 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." });
    } finally {
      requestInFlight.current = false;
      setSending(false);
    }
  }

  return (
    <section className={styles.redeploy} aria-labelledby="redeploy-heading">
      <div>
        <h2 id="redeploy-heading">운영 사이트에 반영</h2>
        <p>수정을 모두 저장한 뒤 재배포하면 변경사항이 운영 사이트에 반영됩니다.</p>
      </div>
      <button className={styles.btnPrimary} type="button" onClick={redeploy} disabled={!canRedeploy || sending || editing}>
        {sending ? "배포 요청 중…" : "사이트 재배포"}
      </button>
      {!canRedeploy && <p className={styles.redeployFeedback}>배포 서버 연결과 권한 확인이 필요합니다.</p>}
      {canRedeploy && editing && <p className={styles.redeployFeedback}>편집을 저장하거나 취소한 뒤 재배포할 수 있습니다.</p>}
      {feedback && (
        <p className={styles.redeployFeedback} role={feedback.kind === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}
