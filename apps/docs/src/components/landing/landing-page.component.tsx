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
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Installation />
        <Download />
        <Features />
        <Why />
        <Usage />
        <Roadmap />
      </main>
      <Footer />
    </div>
  );
};
