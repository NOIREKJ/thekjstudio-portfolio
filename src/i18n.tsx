import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ko" | "en";

// UI 문자열 사전. 곡·앱 '설명 본문'(work.body)은 데이터라 여기 없다(한국어 유지).
const STR = {
  en: {
    nav: { work: "Work", studio: "Studio", collection: "Collection", about: "About", contact: "Contact" },
    hero: {
      l1: "I write music,",
      l2: "and build apps",
      sub: "Composer and developer — sound and software, made by the same hands.",
    },
    pillars: {
      workTag: "Music & Apps", studioTag: "Gear & Rack", collectionTag: "Vinyl",
      work: "Work", studio: "Studio", collection: "Collection", browse: "Browse",
    },
    home: {
      aboutTag: "About",
      aboutLine: "Two things that look separate — music and apps — but the work is the same.",
      aboutCta: "About →",
    },
    work: {
      label: "Work", title: "Work",
      lede: (n: number) => `Music written and apps built — ${n} in total.`,
      music: "Music", apps: "Apps",
    },
    studio: {
      label: "Studio", title: "Studio",
      lede: "The tools I make sound with — outboard and sound modules in the rack, and everything else.",
      rack: "Rack", equipment: (n: number) => `Equipment · ${n}`, photoAlt: "The studio desk — monitors, interface, and keys.",
      cat: { "오디오/음향": "Audio", "악기": "Instruments", "컴퓨터/Mac": "Computer" } as Record<string, string>,
    },
    collection: {
      label: "Collection", title: "Collection", lede: (n: number) => `${n} records for the turntable.`,
      all: "All", newest: "Newest", oldest: "Oldest", artist: "Artist",
      filterAria: "Filter by genre", sortAria: "Sort", preview: "Collection preview",
    },
    lp: {
      Label: "Label", Catalog: "Catalog", Country: "Country", Format: "Format", Speed: "Speed", Genre: "Genre",
      apple: "Apple Music", spotify: "Spotify", youtube: "YouTube", close: "Close", listen: "Listen on",
    },
    workcard: { music: "Music", app: "App" },
    workdetail: { back: "← Back", screens: "Screens", notFound: "Work not found.", more: "More work", play: "Listen" },
    footer: { note: "© 2026 the KJ Studio — sound and software by Joon Kim." },
    contact: {
      label: "Inquiries", title: "Work & Lessons",
      intro: "Music for where you need it, and lessons for where you're starting. Tell me what you have in mind.",
      commission: {
        title: "Commission",
        desc: "Composing, arranging, mixing, session keys — music for film, artists, worship, or anything that needs a score.",
        cta: "Even a rough idea is enough — send a reference or a line about the mood, and I'll shape it into sound. Tell me what you're making below.",
      },
      lesson: {
        title: "Lessons",
        desc: "Piano and composition — together or on their own. Whether you've never read a note or just want to write your own songs, we start from where you are: less a fixed syllabus, more building the basics out of music you actually like.",
        tracks: [
          { name: "Piano", desc: "From posture and hand shape to playing the songs you love — classical or pop, your call." },
          { name: "Composition", desc: "How chords and harmony move, and how to grow a melody into a finished song. No gear needed to begin — keys and ears are enough." },
        ],
        points: ["Composition · Piano", "In person", "Beginner · Hobby"],
        cta: "Never read a note, or haven't touched keys in years? That's fine — we'll start with the song you've always wanted to play. Leave a message below and we'll plan it together.",
      },
      pricing: "Pricing on request.",
      form: {
        type: "Type", commission: "Commission", lesson: "Lesson", other: "Other",
        name: "Name", contact: "Email or phone", message: "Message",
        submit: "Send", sending: "Sending…",
        ok: "Got it — I'll be in touch soon.",
        err: "Something went wrong. Please try again.",
      },
    },
    about: {
      overline: "About", back: "← Back", base: "Base", alias: "Alias", mail: "Mail",
      listen: "Listen", credits: "Selected Credits", live: "Live", role: "Role",
      body: `Based in Seoul, I write music and build apps.

They may look like two separate things, but the work is the same —
making someone's day a little less hard.

I release music under the name K_Joon_P.`,
    },
  },
  ko: {
    nav: { work: "작업", studio: "스튜디오", collection: "컬렉션", about: "소개", contact: "연락" },
    hero: {
      l1: "음악을 쓰고,",
      l2: "앱을 만듭니다",
      sub: "작곡가이자 개발자 — 소리와 소프트웨어를 같은 손으로 다룹니다.",
    },
    pillars: {
      workTag: "음악 · 앱", studioTag: "장비 · 랙", collectionTag: "바이닐",
      work: "작업", studio: "스튜디오", collection: "컬렉션", browse: "둘러보기",
    },
    home: {
      aboutTag: "소개",
      aboutLine: "따로인 듯 보이는 두 가지, 음악과 앱 — 하지만 하는 일은 같습니다.",
      aboutCta: "소개 →",
    },
    work: {
      label: "Work", title: "작업",
      lede: (n: number) => `쓴 음악과 만든 앱 — 모두 ${n}개.`,
      music: "음악", apps: "앱",
    },
    studio: {
      label: "Studio", title: "스튜디오",
      lede: "소리를 만드는 도구들 — 랙에 걸린 아웃보드와 음원 모듈, 그리고 나머지 전부.",
      rack: "Rack", equipment: (n: number) => `전체 장비 · ${n}`, photoAlt: "스튜디오 데스크 — 모니터·인터페이스·건반.",
      cat: { "오디오/음향": "오디오", "악기": "악기", "컴퓨터/Mac": "컴퓨터" } as Record<string, string>,
    },
    collection: {
      label: "Collection", title: "컬렉션", lede: (n: number) => `턴테이블에 올리는 음반 ${n}장.`,
      all: "전체", newest: "최신순", oldest: "오래된순", artist: "아티스트순",
      filterAria: "장르 필터", sortAria: "정렬", preview: "컬렉션 미리보기",
    },
    lp: {
      Label: "레이블", Catalog: "카탈로그", Country: "국가", Format: "포맷", Speed: "속도", Genre: "장르",
      apple: "Apple Music", spotify: "Spotify", youtube: "YouTube", close: "닫기", listen: "듣기",
    },
    workcard: { music: "음악", app: "앱" },
    workdetail: { back: "← 처음으로", screens: "화면", notFound: "찾을 수 없는 작업입니다.", more: "다른 작업", play: "들어보기" },
    footer: { note: "© 2026 the KJ Studio — 김준의 소리와 소프트웨어." },
    contact: {
      label: "문의", title: "의뢰 · 레슨",
      intro: "필요한 자리에 맞는 음악, 그리고 시작하는 사람을 위한 레슨. 생각하신 걸 편하게 남겨주세요.",
      commission: {
        title: "작업 의뢰",
        desc: "작곡·편곡·믹싱·세션 건반 — 영상, 아티스트, 예배, 곡이 필요한 어떤 자리든.",
        cta: "머릿속에 어렴풋한 느낌만 있어도 좋아요 — 레퍼런스든 한 줄 설명이든 들려주시면 거기서부터 곡으로 옮겨드립니다. 편하게 문의 주세요.",
      },
      lesson: {
        title: "레슨",
        desc: "피아노와 작곡을 함께, 또는 따로. 악보가 처음이어도, 취미로 내 곡을 만들어보고 싶어도 — 지금 있는 자리에서 시작합니다. 정해진 진도를 밀기보다, 좋아하는 음악에서 출발해 필요한 기초를 하나씩 채웁니다.",
        tracks: [
          { name: "피아노", desc: "자세와 손 모양 같은 기본부터, 좋아하는 곡을 직접 칠 수 있을 때까지. 클래식이든 가요든." },
          { name: "작곡", desc: "코드와 화성이 움직이는 원리, 멜로디를 붙여 한 곡을 완성하는 과정. 장비 없이 건반과 귀만으로 시작해도 됩니다." },
        ],
        points: ["작곡 · 피아노", "오프라인", "입문 · 취미"],
        cta: "악보가 처음이어도, 손이 오래 굳었어도 괜찮아요 — 배우고 싶던 그 곡부터 함께 시작해요. 아래에 편하게 남겨주시면 같이 계획을 잡아드릴게요.",
      },
      pricing: "가격은 문의 주시면 안내드립니다.",
      form: {
        type: "문의 유형", commission: "작업 의뢰", lesson: "레슨", other: "기타",
        name: "이름", contact: "이메일 또는 전화", message: "내용",
        submit: "보내기", sending: "보내는 중…",
        ok: "문의가 접수됐습니다. 곧 연락드릴게요.",
        err: "전송에 문제가 생겼습니다. 다시 시도해주세요.",
      },
    },
    about: {
      overline: "About", back: "← 처음으로", base: "Base", alias: "Alias", mail: "Mail",
      listen: "들어보기", credits: "참여 크레딧", live: "공연", role: "역할",
      body: `서울에서 음악을 쓰고 앱을 만듭니다.

두 가지를 따로 하는 것처럼 보이지만, 하는 일은 같습니다.
누군가의 하루를 조금 덜 힘들게 만드는 것.

곡은 K_Joon_P라는 이름으로 냅니다.`,
    },
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {} });

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "ko" || saved === "en") return saved;
  } catch { /* no-op */ }
  if (typeof navigator !== "undefined" && navigator.language?.startsWith("ko")) return "ko";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch { /* no-op */ }
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  return useContext(LangContext);
}

// 현재 언어의 문자열 묶음.
export function useT() {
  return STR[useContext(LangContext).lang];
}
