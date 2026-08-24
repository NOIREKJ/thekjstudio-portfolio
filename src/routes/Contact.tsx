import { useEffect, useState } from "react";
import { applyMeta } from "../lib/meta";
import { useT } from "../i18n";
import { Reveal } from "../components/Reveal";
import styles from "./Contact.module.css";

type Status = "idle" | "sending" | "ok" | "err";

export function Contact() {
  const t = useT();
  const [type, setType] = useState("commission");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    applyMeta({
      title: "Inquiries — the KJ Studio",
      description: "Commission music, or take composition and piano lessons with Joon Kim.",
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !contact.trim()) return;
    setStatus("sending");
    try {
      // supabase 클라이언트는 제출 시에만 로드해 메인 번들을 가볍게 유지한다.
      const { supabase } = await import("../lib/supabase");
      if (!supabase) throw new Error("no client");
      const { error } = await supabase
        .from("inquiries")
        .insert({ type, name: name.trim() || null, contact: contact.trim(), message: message.trim() });
      if (error) throw error;
      setStatus("ok");
      setName(""); setContact(""); setMessage("");
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
            <div className={styles.typeRow} role="radiogroup" aria-label={t.contact.form.type}>
              {([["commission", t.contact.form.commission], ["lesson", t.contact.form.lesson], ["other", t.contact.form.other]] as const).map(([v, lbl]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={type === v}
                  className={`${styles.chip} ${type === v ? styles.chipOn : ""}`}
                  onClick={() => setType(v)}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <label className={styles.field}>
              <span className={styles.fLabel}>{t.contact.form.name}</span>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.fLabel}>{t.contact.form.contact}</span>
              <input className={styles.input} value={contact} onChange={(e) => setContact(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.fLabel}>{t.contact.form.message}</span>
              <textarea className={styles.textarea} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </label>

            <div className={styles.actions}>
              <button className={styles.submit} type="submit" disabled={status === "sending"}>
                {status === "sending" ? t.contact.form.sending : t.contact.form.submit}
              </button>
              {status === "ok" && <p className={styles.ok}>{t.contact.form.ok}</p>}
              {status === "err" && <p className={styles.err}>{t.contact.form.err}</p>}
            </div>
          </form>
        </Reveal>
      </div>
    </main>
  );
}
