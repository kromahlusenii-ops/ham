import { FOOTER_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-stone bg-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="font-mono text-sm font-medium tracking-tight text-ink">HAM</p>
            <p className="mt-2 text-sm text-gray">
              Hierarchical Agent Memory.
              <br />
              Fewer tokens, lower cost.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ash">
                {category}
              </p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray transition-colors hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone py-6">
          <p className="text-[12px] text-ash">
            &copy; {new Date().getFullYear()} HAM. MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
}
