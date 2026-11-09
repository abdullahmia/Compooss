import { LinkButton } from "@/components/link-button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="rise flex w-full max-w-md flex-col items-center text-center">
        <Logo />

        <code className="mt-16 w-full rounded-lg border border-line bg-deep px-4 py-3 text-left font-mono text-[13px] leading-6">
          <span className="text-fg-secondary">db.pages.</span>
          <span className="text-fg">findOne</span>
          <span className="text-fg-secondary">({"{ "}</span>
          <span className="text-json-key">path</span>
          <span className="text-fg-secondary">{" }"})</span>
          <br />
          <span className="text-json-null">null</span>
        </code>

        <h1 className="mt-10 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-fg">
          Document not found
        </h1>
        <p className="mt-3 text-base leading-7 text-fg-secondary">
          The page you&apos;re looking for doesn&apos;t exist in this
          collection. It may have been moved or deleted.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/" size="lg">
            Back to home
          </LinkButton>
          <LinkButton href="/#features" size="lg" variant="secondary">
            See features
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
