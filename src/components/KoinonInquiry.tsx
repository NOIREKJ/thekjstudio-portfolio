import { useRef, useState } from "react";
import { useT } from "../i18n";
import styles from "./KoinonInquiry.module.css";

/*
  KOINON 도입 사전 문의 — `/work/koinon` 하단.

  톤 규칙(김준님 지시):
  - **"무료 파일럿" 이라는 표현을 쓰지 않는다.** 유료 요금제 모델이다.
  - 요금제가 미확정이라 **금액·모집 인원을 노출하지 않는다.** 그래서 폼에서도
    예산을 묻지 않는다 — 가격을 말하지 않으면서 예산을 묻는 건 앞뒤가 안 맞는다.
  - 한일교회에서 실제로 쓰고 있다는 사실과 사전 문의까지만 말한다.

  제출은 `/api/inquiry` 로 간다(product: "koinon"). 교회명·담당자·연락처는
  개인정보이므로 동의를 받고, 수집 항목·보유 기간을 폼에서 밝힌다.
*/

type Status = "idle" | "sending" | "ok" | "err";

export function KoinonInquiry() {
  const t = useT();
  const k = t.koinon;

  const [church, setChurch] = useState("");
  const [person, setPerson] = useState("");
  const [contact, setContact] = useState("");
  const [size, setSize] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [hp, setHp] = useState(""); // 허니팟 — 사람에게는 안 보인다.
  const mountedAt = useRef(Date.now());

  const toggle = (s: string) =>
    setInterests((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const canSubmit =
    status !== "sending" && church.trim() !== "" && person.trim() !== "" &&
    contact.trim() !== "" && consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");

    // 내용은 사람이 읽을 형태로도 만들어 둔다 — 텔레그램·메일 알림이 이걸 쓴다.
    const message = [
      `${k.f.church}: ${church.trim()}`,
      `${k.f.person}: ${person.trim()}`,
      size && `${k.f.size}: ${size}`,
      interests.length ? `${k.f.interests}: ${interests.join(", ")}` : null,
      note.trim() && `\n${note.trim()}`,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "koinon",
          type: "adoption",
          name: person.trim(),
          contact: contact.trim(),
          message,
          source: "/work/koinon",
          hp,
          elapsedMs: Date.now() - mountedAt.current,
          // 거르고 셀 수 있게 항목을 따로도 보낸다.
          payload: {
            church: church.trim(),
            person: person.trim(),
            size,
            interests: interests.join(", "),
            consent_at: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("ok");
      setChurch(""); setPerson(""); setContact("");
      setSize(""); setInterests([]); setNote(""); setConsent(false);
    } catch {
      setStatus("err");
    }
  };

  return (
    <section className={styles.wrap} aria-labelledby="koinon-inquiry">
      <p className={styles.label}>{k.label}</p>
      <h2 className={styles.title} id="koinon-inquiry">{k.title}</h2>
      <p className={styles.lede}>{k.lede}</p>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.fLabel} htmlFor="ki-church">{k.f.church}</label>
            <input
              id="ki-church" className={styles.input} value={church} required
              onChange={(e) => setChurch(e.target.value)} autoComplete="organization"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fLabel} htmlFor="ki-person">{k.f.person}</label>
            <input
              id="ki-person" className={styles.input} value={person} required
              onChange={(e) => setPerson(e.target.value)} autoComplete="name"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.fLabel} htmlFor="ki-contact">{k.f.contact}</label>
            <input
              id="ki-contact" className={styles.input} value={contact} required
              onChange={(e) => setContact(e.target.value)}
              placeholder={k.f.contactPlaceholder}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fLabel} htmlFor="ki-size">{k.f.size}</label>
            <select
              id="ki-size" className={styles.select} value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">{k.f.sizeAny}</option>
              {k.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fLabel}>{k.f.interests}</span>
          <div className={styles.chipWrap}>
            {k.interests.map((s) => (
              <button
                key={s} type="button"
                className={`${styles.chip} ${interests.includes(s) ? styles.chipOn : ""}`}
                aria-pressed={interests.includes(s)}
                onClick={() => toggle(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fLabel} htmlFor="ki-note">{k.f.note}</label>
          <textarea
            id="ki-note" className={styles.textarea} rows={4} value={note}
            onChange={(e) => setNote(e.target.value)} placeholder={k.f.notePlaceholder}
          />
        </div>

        {/* 허니팟 — 사람은 못 보고 봇은 채운다. 서버가 다시 판정한다. */}
        <input
          className={styles.hp} tabIndex={-1} aria-hidden="true" autoComplete="off"
          value={hp} onChange={(e) => setHp(e.target.value)} placeholder="website"
        />

        <label className={styles.consent}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{k.f.consent}</span>
        </label>

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={!canSubmit}>
            {status === "sending" ? k.f.sending : k.f.submit}
          </button>
          {status === "ok" && <p className={styles.ok}>{k.f.ok}</p>}
          {status === "err" && <p className={styles.err}>{k.f.err}</p>}
        </div>
      </form>
    </section>
  );
}
