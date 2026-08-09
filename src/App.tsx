import { Route, Routes } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./routes/Home";
import { Studio } from "./routes/Studio";
import { Collection } from "./routes/Collection";
import { Work } from "./routes/Work";
import { About } from "./routes/About";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/work/:slug" element={<Work />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
}
