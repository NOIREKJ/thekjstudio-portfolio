import { useEffect } from "react";
import { Link } from "react-router";
import { applyMeta } from "../lib/meta";
import { useLang } from "../i18n";
import { PROCESSORS, retentionLabel } from "../lib/privacy";
import styles from "./Privacy.module.css";

/*
  개인정보처리방침 — 개인정보보호법 제30조.

  ⚠️ **김준님 검토가 필요한 초안이다.** 법률 자문이 아니다. 특히 두 가지:
    ① 보유 기간(`lib/privacy.ts` 의 RETENTION_DAYS, 지금 1년)
    ② 개인정보 보호책임자의 표기 — 지금은 공개 업무 메일만 적어 두었다.

  본문을 한국어로만 둔다. 국내 법령에 따른 고지문이라 번역본이 원문과 어긋나면
  오히려 위험하다. 영어 화면에서는 그 사실을 한 줄로 알린다.
*/

const CONTACT = "contact@thekjstudio.com";
const UPDATED = "2026-11-22";

export function Privacy() {
  const { lang } = useLang();

  useEffect(() => {
    applyMeta({
      title: "개인정보처리방침 — the KJ Studio",
      description: "the KJ Studio 가 문의 과정에서 받는 개인정보의 항목·목적·보유 기간과 처리 위탁·국외 이전에 관한 고지.",
    });
  }, []);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/">← 처음으로</Link>
      <p className={styles.label}>Privacy</p>
      <h1 className={styles.title}>개인정보처리방침</h1>
      <p className={styles.updated}>시행일 {UPDATED}</p>

      {lang === "en" && (
        <p className={styles.note}>
          This privacy notice is provided in Korean only. It is written to meet the
          requirements of the Personal Information Protection Act of the Republic of Korea,
          and the Korean text governs. For questions in English, write to {CONTACT}.
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.h}>1. 받는 항목과 목적</h2>
        <p className={styles.p}>
          the KJ Studio(이하 "스튜디오")는 <b>문의를 보내신 경우에만</b> 아래 항목을 받습니다.
          회원가입은 없으며, 문의하지 않은 방문자의 개인정보는 받지 않습니다.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>구분</th><th>항목</th><th>목적</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>KOINON 도입 문의</td>
                <td>교회명, 담당자명, 연락처(이메일 또는 전화), 문의 내용<br />(선택) 교인 수 구간, 관심 기능</td>
                <td>문의에 대한 답변과 도입 상담</td>
              </tr>
              <tr>
                <td>작업 의뢰·레슨 문의</td>
                <td>연락처(이메일 또는 전화), 문의 내용<br />(선택) 이름, 의뢰 항목</td>
                <td>문의에 대한 답변</td>
              </tr>
              <tr>
                <td>자동 수집</td>
                <td>문의를 보낸 화면의 주소</td>
                <td>어느 안내가 도움이 되었는지 파악</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.p}>
          주민등록번호·계좌·카드 등 <b>고유식별정보와 금융정보는 받지 않습니다.</b>{" "}
          문의 내용에 그런 정보를 적지 말아 주세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>2. 방문 기록</h2>
        <p className={styles.p}>
          사이트는 방문자 수를 세기 위해 Vercel Web Analytics 를 씁니다. 이 도구는
          <b> 쿠키를 쓰지 않고 방문자를 식별하지 않으며</b>, 페이지 주소·참조 경로·기기 종류 같은
          집계용 정보만 남깁니다. 광고 목적의 추적이나 제3자 광고 식별자는 쓰지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>3. 보유 기간</h2>
        <p className={styles.p}>
          문의 처리가 끝난 날부터 <b>{retentionLabel()}</b>이 지나면 파기합니다. 교회 예산이
          연 단위로 움직여 "올해는 어렵고 내년에" 와 같은 후속 연락이 흔하기 때문입니다.
          그 전이라도 삭제를 요청하시면 지체 없이 파기합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>4. 제3자 제공</h2>
        <p className={styles.p}>
          <b>제3자에게 제공하지 않습니다.</b> 판매·공유하지 않으며, 법령에 따른 요구가 있는
          경우가 아니면 외부에 내보내지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>5. 처리 위탁 및 국외 이전</h2>
        <p className={styles.p}>
          스튜디오는 1인 사업자이며 서버를 직접 두지 않습니다. 아래 사업자의 서비스를 통해
          문의를 받고 보관하므로, <b>개인정보가 국외에 저장·처리됩니다.</b>
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>받는 자</th><th>국가</th><th>항목</th><th>목적</th></tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td><td>{p.country}</td><td>{p.items}</td><td>{p.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.p}>
          이전 시점·방법: 문의를 보내시는 즉시 정보통신망을 통해 전송됩니다.
          보유 기간: 위 3항과 같습니다. 국외 이전에 동의하지 않으실 수 있으며, 그 경우
          문의 폼 대신 {CONTACT} 로 직접 연락 주시면 됩니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>6. 파기</h2>
        <p className={styles.p}>
          보유 기간이 지난 문의는 <b>자동으로 삭제</b>되며, 복구할 수 없는 방식으로 지웁니다.
          알림으로 전달된 사본(메일·메신저)도 같은 기준으로 지웁니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>7. 정보주체의 권리</h2>
        <p className={styles.p}>
          언제든지 본인의 개인정보에 대해 <b>열람·정정·삭제·처리정지</b>를 요구하실 수 있습니다.
          {" "}{CONTACT} 로 알려 주시면 지체 없이 처리하고 결과를 알려 드립니다.
          법정대리인이나 위임받은 분을 통해서도 하실 수 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>8. 안전성 확보조치</h2>
        <ul className={styles.list}>
          <li>전송 구간은 전부 HTTPS 로 암호화합니다.</li>
          <li>문의 내용은 스튜디오 운영자 한 사람만 접근할 수 있습니다.</li>
          <li>문의를 받는 서버는 접수에 필요한 최소한의 정보만 기록하며, <b>연락처와 문의 내용은 서버 로그에 남기지 않습니다.</b></li>
          <li>공개된 웹 주소로 문의 데이터를 조회할 수 없도록 막아 두었습니다.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>9. 개인정보 보호책임자</h2>
        <p className={styles.p}>
          the KJ Studio 운영자 · <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>10. 권익침해 구제</h2>
        <ul className={styles.list}>
          <li>개인정보분쟁조정위원회 — 1833-6972 (kopico.go.kr)</li>
          <li>개인정보침해신고센터 — 118 (privacy.kisa.or.kr)</li>
          <li>대검찰청 사이버수사과 — 1301 (spo.go.kr)</li>
          <li>경찰청 사이버수사국 — 182 (ecrm.police.go.kr)</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h}>11. 방침 변경</h2>
        <p className={styles.p}>
          내용이 바뀌면 시행 7일 전부터 이 페이지에 알립니다. 받는 항목이나 목적이
          크게 달라지는 경우에는 30일 전부터 알립니다.
        </p>
      </section>
    </main>
  );
}
