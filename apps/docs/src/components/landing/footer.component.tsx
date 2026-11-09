import { Logo } from "@/components/logo";
import {
  DOCKER_HUB_URL,
  GITHUB_URL,
  NAV_LINKS,
} from "@/lib/constants/landing.constants";

const RESOURCES = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "Docker Hub", href: DOCKER_HUB_URL },
  { label: "Releases", href: `${GITHUB_URL}/releases` },
];

const linkClass =
  "text-sm text-fg-secondary transition-colors duration-150 ease-out hover:text-fg";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Logo href="#" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-fg-muted">
              A free, open-source MongoDB GUI that runs as a single Docker
              container, or as a desktop app.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-fg">Product</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-fg">Resources</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {RESOURCES.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm font-medium text-fg">Quick start</h4>
            <code className="mt-4 block rounded-lg border border-line bg-deep px-3 py-2 font-mono text-xs leading-6 text-fg">
              <span className="select-none text-fg-muted">$ </span>
              docker pull abdullahmia/compooss
            </code>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Compooss · MIT License</p>
          <p>
            Built by{" "}
            <a
              href="https://abdullah.iam.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary transition-colors duration-150 ease-out hover:text-fg"
            >
              Abdullah Mia
            </a>
          </p>
          <p>Not affiliated with MongoDB, Inc.</p>
        </div>
      </div>
    </footer>
  );
};
