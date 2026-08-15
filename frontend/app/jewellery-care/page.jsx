// app/jewellery-care/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function JewelleryCarePage() {
  const Pages = [
    {eyebrow:"Care",
      title:"Jewellery Care",
      intro:"Love your jewellery, and it will love you back.",
      sections:[
        {
          list: [
            "Keep it dry after use",
            "Avoid perfumes and harsh chemicals",
            "Gently wipe to maintain its shine",
            "Store it in your Tvisaa cotton pouch or box to preserve its beauty",
            "With the right care, your pieces will stay beautiful for a long time.",
          ],
        },
      ]}
  ]
  return (
    <InfoPage
      pages={Pages}
    />
  );
}