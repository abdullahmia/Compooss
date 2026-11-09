import { LeafMark } from "@/components/logo";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  List,
  Plus,
  RefreshCw,
  Search,
  Table,
} from "lucide-react";

/**
 * The hero's product view: Compooss open on `ecommerce_dev.orders`, with
 * documents shaped like the ones scripts/seed.ts creates. Built in code so it
 * stays sharp and matches the app's own JSON colours.
 */

type Value =
  | { kind: "oid" | "date" | "string"; text: string }
  | { kind: "number"; text: string }
  | { kind: "null" }
  | { kind: "nested"; text: string };

type Field = [key: string, value: Value];

const DATABASES = [
  { name: "analytics_dev", size: "2.4 MB" },
  { name: "blog_dev", size: "1.1 MB" },
  {
    name: "ecommerce_dev",
    size: "3.8 MB",
    collections: [
      { name: "orders", count: 127 },
      { name: "products", count: 80 },
      { name: "reviews", count: 64 },
      { name: "users", count: 50 },
    ],
  },
  { name: "projecthub_dev", size: "1.6 MB" },
  { name: "admin", size: "100.0 KB" },
  { name: "config", size: "72.0 KB" },
  { name: "local", size: "72.0 KB" },
];

const DOCUMENTS: Field[][] = [
  [
    ["_id", { kind: "oid", text: "6650e3a1c4f2b81d9e4a7c21" }],
    ["orderNumber", { kind: "string", text: "ORD-1731045126413-4821" }],
    ["userId", { kind: "oid", text: "6650e39fc4f2b81d9e4a7b0e" }],
    ["items", { kind: "nested", text: "Array (3)" }],
    ["subtotal", { kind: "number", text: "186.4" }],
    ["shipping", { kind: "number", text: "12.75" }],
    ["tax", { kind: "number", text: "14.91" }],
    ["total", { kind: "number", text: "214.06" }],
    ["currency", { kind: "string", text: "USD" }],
    ["status", { kind: "string", text: "shipped" }],
    ["paymentMethod", { kind: "string", text: "credit_card" }],
    ["shippingAddress", { kind: "nested", text: "Object (4)" }],
    ["notes", { kind: "null" }],
    ["placedAt", { kind: "date", text: "2024-09-14T16:22:08.512Z" }],
  ],
  [
    ["_id", { kind: "oid", text: "6650e3a1c4f2b81d9e4a7c3f" }],
    ["orderNumber", { kind: "string", text: "ORD-1731045126587-1937" }],
    ["userId", { kind: "oid", text: "6650e39fc4f2b81d9e4a7b14" }],
    ["items", { kind: "nested", text: "Array (1)" }],
    ["subtotal", { kind: "number", text: "49.99" }],
    ["shipping", { kind: "number", text: "4.6" }],
    ["tax", { kind: "number", text: "4" }],
    ["total", { kind: "number", text: "58.59" }],
  ],
];

const VIEW_TABS = ["Documents", "Aggregations", "Schema", "Indexes", "Validation"];

/** Fields with long values, left out on phones so the rest stays readable. */
const WIDE_FIELDS = new Set(["_id", "orderNumber", "userId", "placedAt"]);

function FieldValue({ value }: { value: Value }) {
  switch (value.kind) {
    case "oid":
      return <span className="text-json-string">ObjectId(&quot;{value.text}&quot;)</span>;
    case "date":
      return <span className="text-json-string">ISODate(&quot;{value.text}&quot;)</span>;
    case "string":
      return <span className="text-json-string">&quot;{value.text}&quot;</span>;
    case "number":
      return <span className="text-json-number">{value.text}</span>;
    case "null":
      return <span className="text-json-null">null</span>;
    case "nested":
      return (
        <span className="inline-flex items-center gap-1 text-fg-muted">
          <ChevronRight size={12} strokeWidth={1.5} />
          {value.text}
        </span>
      );
  }
}

function DocumentCard({ fields }: { fields: Field[] }) {
  const id = fields[0][1];
  return (
    <div className="shrink-0 overflow-hidden rounded-lg border border-line bg-card">
      <div className="relative flex h-9 items-center gap-2 border-b border-line px-4">
        <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
        <ChevronDown size={14} strokeWidth={1.5} className="text-fg-muted" />
        <FileText size={14} strokeWidth={1.5} className="text-fg-muted" />
        <span className="truncate font-mono text-xs">
          <FieldValue value={id} />
        </span>
      </div>
      <dl className="grid grid-cols-[max-content_auto_minmax(0,1fr)] gap-y-1 px-4 py-3 font-mono text-xs leading-5">
        {fields.map(([key, value]) => (
          <div key={key} className={WIDE_FIELDS.has(key) ? "hidden sm:contents" : "contents"}>
            <dt className="text-json-key">{key}</dt>
            <span className="mx-2 text-fg-muted">:</span>
            <dd className="min-w-0 truncate">
              <FieldValue value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-deep md:flex">
      <div className="flex h-10 items-center justify-between px-4">
        <span className="text-xs font-medium text-fg-secondary">Databases</span>
        <span className="flex items-center gap-2 text-fg-muted">
          <Plus size={14} strokeWidth={1.5} />
          <RefreshCw size={14} strokeWidth={1.5} />
        </span>
      </div>
      <div className="px-2">
        <div className="flex h-8 items-center gap-2 rounded-md border border-line bg-card px-2 text-xs text-fg-muted">
          <Search size={14} strokeWidth={1.5} />
          Filter databases
        </div>
      </div>
      <ul className="mt-2 flex flex-col gap-0.5 px-2 text-[13px]">
        {DATABASES.map((db) => (
          <li key={db.name}>
            <div className="flex h-7 items-center gap-2 rounded-md px-2 text-fg-secondary">
              {db.collections ? (
                <ChevronDown size={14} strokeWidth={1.5} className="text-fg-muted" />
              ) : (
                <ChevronRight size={14} strokeWidth={1.5} className="text-fg-muted" />
              )}
              <Database size={14} strokeWidth={1.5} className="text-fg-muted" />
              <span className="flex-1 truncate">{db.name}</span>
              <span className="font-mono text-[11px] tabular-nums text-fg-muted">
                {db.size}
              </span>
            </div>
            {db.collections && (
              <ul className="flex flex-col gap-0.5 py-0.5">
                {db.collections.map((col) => {
                  const active = col.name === "orders";
                  return (
                    <li
                      key={col.name}
                      className={`flex h-7 items-center gap-2 rounded-md pl-[52px] pr-2 ${
                        active
                          ? "bg-raised text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "text-fg-secondary"
                      }`}
                    >
                      <span className="flex-1 truncate">{col.name}</span>
                      <span className="font-mono text-[11px] tabular-nums text-fg-muted">
                        {col.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex h-9 items-center gap-2 border-t border-line px-4 text-xs text-fg-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Connected · 7 databases
      </div>
    </aside>
  );
}

export function AppPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-page shadow-[0_32px_64px_-24px_rgba(0,0,0,0.6)]">
      {/* Browser frame */}
      <div className="relative flex h-10 items-center border-b border-line bg-deep px-4">
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-raised" />
          <span className="h-2.5 w-2.5 rounded-full bg-raised" />
          <span className="h-2.5 w-2.5 rounded-full bg-raised" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-card px-3 py-0.5 font-mono text-xs text-fg-muted">
          localhost:6969
        </span>
      </div>

      {/* App top bar */}
      <div className="flex h-11 items-center gap-4 border-b border-line bg-deep px-4">
        <span className="flex items-center gap-2">
          <LeafMark className="h-3.5 w-auto text-accent" />
          <span className="text-[13px] font-medium text-fg">Compooss</span>
        </span>
        <span className="flex h-7 min-w-0 items-center gap-2 rounded-md border border-line bg-card px-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-xs font-medium text-fg">Development</span>
          <span className="hidden truncate font-mono text-xs text-fg-muted sm:inline">
            mongodb://root:•••@mongo:27017
          </span>
        </span>
      </div>

      <div className="flex h-[440px] md:h-[560px] lg:h-[520px]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Open collection tabs */}
          <div className="flex h-9 items-end gap-1 border-b border-line bg-deep px-2">
            <span className="flex h-8 items-center rounded-t-md border border-b-0 border-line bg-page px-3 font-mono text-xs text-fg">
              orders
            </span>
            <span className="flex h-8 items-center px-3 font-mono text-xs text-fg-muted">
              products
            </span>
          </div>

          <div className="flex flex-col gap-4 px-4 pt-4 md:px-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate font-mono text-[13px] text-fg">
                ecommerce_dev.orders
              </span>
              <span className="hidden shrink-0 font-mono text-xs tabular-nums text-fg-muted sm:inline">
                127 documents · 3 indexes
              </span>
            </div>

            <div className="-mt-1 flex gap-4 overflow-hidden border-b border-line text-[13px]">
              {VIEW_TABS.map((tab, i) => (
                <span
                  key={tab}
                  className={`shrink-0 pb-2 ${
                    i === 0
                      ? "border-b-2 border-accent text-fg"
                      : "text-fg-muted"
                  } ${i > 2 ? "hidden sm:inline" : ""}`}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Query bar */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-line bg-card px-3 font-mono text-xs">
                <span className="truncate">
                  <span className="text-fg-muted">{"{ "}</span>
                  <span className="text-json-key">status</span>
                  <span className="text-fg-muted">: </span>
                  <span className="text-json-string">&quot;shipped&quot;</span>
                  <span className="text-fg-muted">{" }"}</span>
                </span>
              </div>
              <span className="hidden h-9 items-center rounded-md px-3 text-xs text-fg-secondary sm:flex">
                Options
              </span>
              <span className="flex h-9 items-center rounded-md bg-accent px-4 text-xs font-medium text-deep">
                Find
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tabular-nums text-fg-muted">
                1–20 of 21
              </span>
              <span className="flex items-center gap-1 text-fg-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-raised text-fg">
                  <List size={14} strokeWidth={1.5} />
                </span>
                <span className="flex h-6 w-6 items-center justify-center">
                  <Braces size={14} strokeWidth={1.5} />
                </span>
                <span className="flex h-6 w-6 items-center justify-center">
                  <Table size={14} strokeWidth={1.5} />
                </span>
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 overflow-hidden px-4 md:px-6">
            {DOCUMENTS.map((fields, i) => (
              <DocumentCard key={i} fields={fields} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
