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
    work: { label: "Work", title: "Work", lede: (n: number) => `Music written and apps built — ${n} in total.` },
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
    workdetail: { back: "← Back", screens: "Screens", notFound: "Work not found.", more: "More work" },
    about: {
      overline: "About", back: "← Back", base: "Base", alias: "Alias", mail: "Mail",
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
    work: { label: "Work", title: "작업", lede: (n: number) => `쓴 음악과 만든 앱 — 모두 ${n}개.` },
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
    workdetail: { back: "← 처음으로", screens: "화면", notFound: "찾을 수 없는 작업입니다.", more: "다른 작업" },
    about: {
      overline: "About", back: "← 처음으로", base: "Base", alias: "Alias", mail: "Mail",
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
