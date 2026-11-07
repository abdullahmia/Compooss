import { Download } from "./download.component";
import { Features } from "./features.component";
import { Footer } from "./footer.component";
import { Hero } from "./hero.component";
import { Installation } from "./installation.component";
import { Nav } from "./nav.component";
import { Roadmap } from "./roadmap.component";
import { Usage } from "./usage.component";
import { Why } from "./why.component";

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(39,39,42,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(39,39,42,0.3)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />

      <Nav />
      <Hero />
      <Installation />
      <Download />
      <Features />
      <Why />
      <Usage />
      <Roadmap />
      <Footer />
    </div>
  );
};
