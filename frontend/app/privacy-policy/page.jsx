// app/privacy-policy/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function PrivacyPolicyPage() {
  const Pages = [{
    eyebrow:"Legal",
      title:"Privacy Policy",
      intro:"At Tvisaa_for You, we value your privacy and are committed to protecting your personal information.",
      sections:[
        {
          heading: "Information We Collect",
          list: [
            "Name",
            "Contact number",
            "Email address",
            "Shipping and billing address",
            "Payment details (processed securely via payment gateways)",
          ],
        },
        {
          heading: "How We Use Your Information",
          list: [
            "Process and deliver your orders",
            "Communicate order updates",
            "Improve our services and customer experience",
            "Send updates or offers (only if you opt in)",
          ],
        },
        {
          heading: "Data Protection",
          paragraphs: [
            "We take appropriate measures to protect your personal information. Your payment details are processed securely through trusted third-party payment providers.",
          ],
        },
        {
          heading: "Sharing of Information",
          paragraphs: [
            "We do not sell or trade your personal information.",
            "Information may be shared only with delivery partners for shipping your order and payment gateways for secure transactions.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "Our website may use cookies to enhance your browsing experience and improve functionality.",
          ],
        },
        {
          heading: "Your Consent",
          paragraphs: [
            "By using our website, you agree to our Privacy Policy.",
          ],
        },
        {
          heading: "Contact Us",
          paragraphs: [
            "For any questions regarding this policy, please contact us.",
          ],
        },
      ]
  }]
  return (
    <InfoPage
      pages={Pages}
    />
  );
}