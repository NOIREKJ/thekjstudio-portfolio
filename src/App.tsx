import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./routes/Home";
import { Works } from "./routes/Works";
import { Studio } from "./routes/Studio";
import { Collection } from "./routes/Collection";
import { Work } from "./routes/Work";
import { About } from "./routes/About";
import { Contact } from "./routes/Contact";

// 어드민은 지연 로딩 — supabase-js 를 공개 사이트 번들에서 분리하고
// /admin 에서만 불러온다. 헤더/푸터 없이 독립 레이아웃으로 뜬다.
const Admin = lazy(() => import("./admin/Admin").then((m) => ({ default: m.Admin })));

export default function App() {
  const isAdmin = useLocation().pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Works />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/work/:slug" element={<Work />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
}
