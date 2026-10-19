/*
  SPA라 문서가 하나뿐이다. 라우트가 바뀔 때 <head>를 직접 갱신한다.
  같은 태그를 다시 만들지 않고 값만 바꾼다 — 안 그러면 라우트를 옮길 때마다 쌓인다.
*/
type MetaInput = {
  title: string;
  description: string;
  image?: string;
  origin?: string;
};

function upsert(attr: "name" | "property", key: string, content: string): void {
  const selector = `meta[${attr}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function remove(attr: "name" | "property", key: string): void {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

export function applyMeta({ title, description, image, origin }: MetaInput): void {
  document.title = title;

  upsert("name", "description", description);
  upsert("property", "og:title", title);
  upsert("property", "og:description", description);
  upsert("property", "og:type", "website");
  upsert("name", "twitter:card", image ? "summary_large_image" : "summary");
  upsert("name", "twitter:title", title);
  upsert("name", "twitter:description", description);

  /*
    이미지가 없는 라우트로 옮겨가도 태그를 지워야 한다. 예전에는 if (image)
    안에서만 건드려서, 홈(로고 이미지 있음) → /work/money(없음) 로 가면
    og:image 에 홈 로고가 그대로 남았다. twitter:card 는 summary 로 내려가는데
    twitter:image 는 큰 이미지를 가리키는, 짝이 안 맞는 상태가 됐다.

    🔴 다만 이걸 고쳐도 '공유 카드가 작업물마다 달라지는' 효과는 없다. 이
    사이트는 클라이언트 렌더 SPA 라서 카카오톡·슬랙 크롤러는 JS 를 실행하지
    않고 index.html 의 고정 og 태그만 읽는다. 여기서 고치는 건 브라우저 안의
    상태뿐이다. 라우트별 공유 카드를 진짜로 만들려면 프리렌더나 크롤러용
    응답이 필요하다.
  */
  const base = origin ?? (typeof location !== "undefined" ? location.origin : "");
  const absolute = image ? (image.startsWith("http") ? image : `${base}${image}`) : null;

  if (absolute) {
    upsert("property", "og:image", absolute);
    upsert("name", "twitter:image", absolute);
  } else {
    remove("property", "og:image");
    remove("name", "twitter:image");
  }
}
