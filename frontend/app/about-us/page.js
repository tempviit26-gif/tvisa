// app/about-us/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function AboutUsPage() {
  const Pages = [
    {
      eyebrow: "BRAND",
      title: "About Us",
      intro: "Tvisaa_for You was created to bring everyday luxury within reach.",
      sections:[
        {
          paragraphs: [
            "Crafted in premium stainless steel, our jewellery is designed to be worn effortlessly — tarnish-resistant, waterproof, and made to last.",
            "Simple, refined, and made for you.",
          ],
        },
      ]
    },
    {
      title:"Our Vision",
      sections:[
        {
          paragraphs: [
            "To become a trusted destination for everyday luxury jewellery, known for quality, simplicity, and timeless style.",
          ],
        },
      ]
    },
    {
      title:"Our Mission",
      sections:[
        {
          paragraphs: [
            "To bring thoughtfully selected jewellery that combines lasting quality with effortless elegance, designed for everyday life.",
          ],
        },
      ]
    }
  ]
  return (
    <InfoPage
      pages={Pages}
    />
  );
}