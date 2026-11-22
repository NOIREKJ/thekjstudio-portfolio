import { useEffect, useRef, useState } from "react";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Reveal } from "../components/Reveal";
import styles from "./Contact.module.css";

type Status = "idle" | "sending" | "ok" | "err";

export function Contact() {
  const t = useT();
  const f = t.contact.form;

  const [type, setType] = useState("commission");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [hp, setHp] = useState(""); // 허니팟 — 사람은 못 보는 필드. 채워지면 봇.
  const mountedAt = useRef(Date.now());

  // 작업 의뢰용
  const [services, setServices] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [reference, setReference] = useState("");
  const [timeline, setTimeline] = useState("");
  // 레슨용
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [when, setWhen] = useState("");

  useEffect(() => {
    applyMeta({
      title: "Inquiries — the KJ Studio",
      description: "Commission music, or take composition and piano lessons with Joon Kim.",
    });
  }, []);

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  // 선택·입력값을 하나의 정리된 내용으로 합친다.
  const composeMessage = (): string => {
    let structured = "";
    if (type === "commission") {
      structured = [
        services.length && `${f.services}: ${services.join(", ")}`,
        usage && `${f.usage}: ${usage}`,
        reference && `${f.reference}: ${reference}`,
        timeline && `${f.timeline}: ${timeline}`,
      ].filter(Boolean).join("\n");
    } else if (type === "lesson") {
      structured = [
        subject && `${f.subject}: ${subject}`,
        level && `${f.level}: ${level}`,
        goal && `${f.goal}: ${goal}`,
        when && `${f.when}: ${when}`,
      ].filter(Boolean).join("\n");
    }
    return [structured, note.trim()].filter(Boolean).join("\n\n");
  };

  const notePlaceholder =
    type === "commission" ? f.notePlaceholderCommission
    : type === "lesson" ? f.notePlaceholderLesson
    : f.notePlaceholderOther;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = composeMessage();
    if (!message.trim() || !contact.trim()) return;
    // 스팸 차단: 허니팟이 채워졌거나(봇), 페이지 뜬 지 3초도 안 돼 제출되면(봇) 조용히 무시.
    if (hp || Date.now() - mountedAt.current < 3000) {
      setStatus("ok");
      return;
    }
    setStatus("sending");
    try {
      /*
        예전에는 여기서 브라우저가 Supabase 에 직접 insert 했다. 그 경로는 세 가지가
        망가져 있었다 — 허니팟이 클라이언트라 REST 직격에 무용했고, 문의가 들어와도
        알릴 길이 없었고, Supabase 가 402 로 막히면 제출이 통째로 사라졌다.
        이제 서버 함수가 텔레그램·메일·DB 세 곳으로 보내고, 하나라도 닿으면 성공이다.
      */
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "music",
          type,
          name: name.trim() || null,
          contact: contact.trim(),
          message,
          source: window.location.pathname,
          // 서버가 다시 판정한다. 클라이언트 판정은 1차 체일 뿐이다.
          hp,
          elapsedMs: Date.now() - mountedAt.current,
          // 나중에 거르고 셀 수 있게 항목을 따로도 보낸다(message 에도 들어 있다).
          payload: type === "commission"
            ? { services: services.join(", "), usage, reference, timeline }
            : type === "lesson"
              ? { subject, level, goal, when }
              : {},
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("ok");
      setName(""); setContact(""); setNote("");
      setServices([]); setUsage(""); setReference(""); setTimeline("");
      setSubject(""); setLevel(""); setGoal(""); setWhen("");
    } catch {
      setStatus("err");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>{t.contact.label}</p>
        <h1 className={styles.title}>{t.contact.title}</h1>
        <p className={styles.intro}>{t.contact.intro}</p>
      </header>

      <div className={styles.body}>
        <Reveal>
          <div className={styles.offers}>
            <button
              type="button"
              className={`${styles.offer} ${type === "commission" ? styles.offerActive : ""}`}
              onClick={() => setType("commission")}
            >
              <span className={styles.offerTitle}>{t.contact.commission.title}</span>
              <span className={styles.offerDesc}>{t.contact.commission.desc}</span>
              <span className={styles.cardCta}>{t.contact.commission.cta}</span>
            </button>
            <button
              type="button"
              className={`${styles.offer} ${type === "lesson" ? styles.offerActive : ""}`}
              onClick={() => setType("lesson")}
            >
              <span className={styles.offerTitle}>{t.contact.lesson.title}</span>
              <span className={styles.offerDesc}>{t.contact.lesson.desc}</span>
              <span className={styles.tracks}>
                {t.contact.lesson.tracks.map((tr) => (
                  <span key={tr.name} className={styles.track}>
                    <span className={styles.trackName}>{tr.name}</span>
                    <span className={styles.trackDesc}>{tr.desc}</span>
                  </span>
                ))}
              </span>
              <span className={styles.points}>
                {t.contact.lesson.points.map((p) => <span key={p} className={styles.point}>{p}</span>)}
              </span>
              <span className={styles.cardCta}>{t.contact.lesson.cta}</span>
            </button>
          </div>
          <p className={styles.pricing}>{t.contact.pricing}</p>
        </Reveal>

        <Reveal>
          <form className={styles.form} onSubmit={submit}>
            {/* 허니팟 — 화면·스크린리더에서 숨김. 봇만 채운다. */}
            <input
              type="text"
              className={styles.hp}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              placeholder="Company"
            />
            <div className={styles.typeRow} role="radiogroup" aria-label={f.type}>
              {([["commission", f.commission], ["lesson", f.lesson], ["other", f.other]] as const).map(([v, lbl]) => (
                <button key={v} type="button" role="radio" aria-checked={type === v}
                  className={`${styles.chip} ${type === v ? styles.chipOn : ""}`} onClick={() => setType(v)}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* 작업 의뢰 가이드 */}
            {type === "commission" && (
              <>
                <div className={styles.field}>
                  <span className={styles.fLabel}>{f.services}</span>
                  <div className={styles.chipWrap}>
                    {f.serviceOptions.map((s) => (
                      <button key={s} type="button"
                        className={`${styles.chip} ${services.includes(s) ? styles.chipOn : ""}`}
                        onClick={() => toggleService(s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <Text label={f.usage} value={usage} onChange={setUsage} placeholder={f.usagePlaceholder} />
                <Text label={f.reference} value={reference} onChange={setReference} placeholder={f.referencePlaceholder} />
                <Text label={f.timeline} value={timeline} onChange={setTimeline} placeholder={f.timelinePlaceholder} />
              </>
            )}

            {/* 레슨 가이드 */}
            {type === "lesson" && (
              <>
                <SingleChips label={f.subject} options={f.subjectOptions} value={subject} onChange={setSubject} />
                <SingleChips label={f.level} options={f.levelOptions} value={level} onChange={setLevel} />
                <Text label={f.goal} value={goal} onChange={setGoal} placeholder={f.goalPlaceholder} />
                <Text label={f.when} value={when} onChange={setWhen} placeholder={f.whenPlaceholder} />
              </>
            )}

            <Text label={f.name} value={name} onChange={setName} />
            <Text label={f.contact} value={contact} onChange={setContact} required />

            <label className={styles.field}>
              <span className={styles.fLabel}>{f.note}</span>
              <textarea className={styles.textarea} rows={4} value={note}
                placeholder={notePlaceholder} onChange={(e) => setNote(e.target.value)} />
            </label>

            <div className={styles.actions}>
              <button className={styles.submit} type="submit" disabled={status === "sending"}>
                {status === "sending" ? f.sending : f.submit}
              </button>
              {status === "ok" && <p className={styles.ok}>{f.ok}</p>}
              {status === "err" && <p className={styles.err}>{f.err}</p>}
            </div>
          </form>
        </Reveal>
      </div>
    </main>
  );
}

function Text({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fLabel}>{label}</span>
      <input className={styles.input} value={value} placeholder={placeholder} required={required}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SingleChips({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fLabel}>{label}</span>
      <div className={styles.chipWrap}>
        {options.map((o) => (
          <button key={o} type="button"
            className={`${styles.chip} ${value === o ? styles.chipOn : ""}`}
            onClick={() => onChange(value === o ? "" : o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}
