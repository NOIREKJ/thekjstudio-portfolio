import { Route, Routes } from "react-router";
import { Home } from "./routes/Home";
import { Work } from "./routes/Work";
import { About } from "./routes/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/work/:slug" element={<Work />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
