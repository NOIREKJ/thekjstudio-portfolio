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

export function applyMeta({ title, description, image, origin }: MetaInput): void {
  document.title = title;

  upsert("name", "description", description);
  upsert("property", "og:title", title);
  upsert("property", "og:description", description);
  upsert("property", "og:type", "website");
  upsert("name", "twitter:card", image ? "summary_large_image" : "summary");
  upsert("name", "twitter:title", title);
  upsert("name", "twitter:description", description);

  if (image) {
    const base = origin ?? (typeof location !== "undefined" ? location.origin : "");
    const absolute = image.startsWith("http") ? image : `${base}${image}`;
    upsert("property", "og:image", absolute);
    upsert("name", "twitter:image", absolute);
  }
}
