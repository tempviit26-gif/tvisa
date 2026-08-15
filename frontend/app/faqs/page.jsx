export default function FAQsPage() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const message = encodeURIComponent('Hi Tvisaa! I need help with jewellery.');
  const href = `https://wa.me/${phoneNumber}?text=${message}`;
  const instaHref = 'https://www.instagram.com/tvisaa_foryou?utm_source=qr&igsh=eHF1Nm0xZ203bXJk'
  const faqs = [
    {
      q: "How long will my order take to arrive?",
      a: "Orders are typically delivered within 3–7 business days, depending on your location.",
    },
    {
      q: "What material is your jewellery made of?",
      a: "Our jewellery is crafted from high-quality stainless steel, including 304 and 316L grades, known for their durability and resistance to tarnish. These materials are widely used in jewellery for their long-lasting shine and suitability for everyday wear.",
    },
    {
      q: "Do you offer Cash on Delivery (COD)?",
      a: "Yes, we offer Cash on Delivery for a convenience fee of ₹99. For more details, please refer to our COD Policy.",
    },
    {
      q: "Is your jewellery waterproof?",
      a: "Yes, our jewellery is crafted from stainless steel and is designed for everyday wear. It is water-resistant and made to retain its shine with proper care.",
    },
    {
      q: "Will the jewellery tarnish over time?",
      a: "Our jewellery is tarnish-resistant, meaning it is designed to retain its shine for a long time. However, exposure to chemicals, perfumes, and moisture may affect its appearance over time.",
    },
    {
      q: "Can I wear the jewellery daily?",
      a: "Absolutely. Our jewellery is designed for everyday wear — lightweight, comfortable, and durable.",
    },
    {
      q: "Is your jewellery safe for sensitive skin?",
      a: "Our jewellery is suitable for most skin types. However, individual sensitivities may vary. If you have known metal allergies, we recommend reviewing product details before purchase.",
    },
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, you will receive a tracking link via email or WhatsApp.",
    },
    {
      q: "Do you offer returns or exchanges?",
      a: "We do not offer returns. We only provide exchanges for eligible cases. Please refer to our Return & Exchange Policy for full details.",
    },
    {
      q: "How should I take care of my jewellery?",
      a: "Store it in a dry place, avoid contact with harsh chemicals, and gently wipe with a soft cloth to maintain its shine.",
    },
    {
      q: "How can I contact Tvisaa for you?",
      a: (
        <>
          You can reach out to us via{" "}
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black underline underline-offset-4">
            WhatsApp
          </a>{" "}
          or through our {" "}
          <a href={instaHref} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black underline underline-offset-4">
            Instagram page.
            </a>
        </>
      ),
    },
  ];

  return (
    <div className="bg-[#FAF7F2] text-[#2F2A24]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">

        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#B79E7A] mb-3">
            BRAND
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide">
            FAQs
          </h1>
        </div>

        {/* FAQ List */}
        <div className="space-y-10 sm:space-y-12">
          {faqs.map((item, index) => (
            <div key={index}>
              <h3 className="text-lg sm:text-xl font-medium text-[#3A342E] mb-3 ">
                {item.q}
              </h3>
              <p className="text-sm sm:text-base leading-7 text-[#6B6257]">
                {item.a}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}