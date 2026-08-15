// components/InfoPage.jsx
export default function InfoPage({ pages = [] }) {
  return (
    <main className="min-h-screen bg-[#F7F3EE] text-[#5C4A3A]">
      {pages.map((page, pageIndex) => (
        <section
          key={pageIndex}
          className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-6"
        >
          <p className="mb-4 text-[11px] uppercase tracking-[0.35em] text-[#B79E7A]">
            {page.eyebrow}
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#3F3126]">
            {page.title}
          </h1>

          {page.intro && (
            <p className="mt-6 max-w-2xl text-[16px] sm:text-[17px] leading-8 text-[#6E5F52]">
              {page.intro}
            </p>
          )}

          <div className="mt-8 space-y-4">
            {page.sections?.map((section, index) => (
              <div
                key={index}
                className="border-t border-[#E6DCCF] pt-8 first:border-t-0 first:pt-0"
              >
                {section.heading && (
                  <h2 className="mb-4 text-xl sm:text-2xl text-[#3F3126]">
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs?.map((paragraph, i) => (
                  <p
                    key={i}
                    className="mb-4 text-[15px] sm:text-[16px] leading-8 text-[#6E5F52]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list?.length > 0 && (
                  <ul className="space-y-3 text-[15px] sm:text-[16px] leading-8 text-[#6E5F52]">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-[#B08A47]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}