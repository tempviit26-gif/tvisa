// app/terms-conditions/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function TermsConditionsPage() {
  const Pages = [
    {
      eyebrow:"Legal",
      title:"Terms & Conditions",
      intro:"Welcome to Tvisaa_for You. By accessing our website and placing an order, you agree to the following terms and conditions.",
      sections:[
        {
          heading: "Use of Website",
          paragraphs: [
            "By using this website, you agree to provide accurate information and use our services only for lawful purposes.",
          ],
        },
        {
          heading: "Product Information",
          paragraphs: [
            "We strive to display our products as accurately as possible. However, slight variations in color or appearance may occur due to lighting or screen settings.",
          ],
        },
        {
          heading: "Pricing & Payments",
          paragraphs: [
            "All prices are listed in INR. We reserve the right to update pricing at any time without prior notice.",
            "Payments are processed securely through trusted payment gateways. Cash on Delivery (COD) is available with an additional fee.",
          ],
        },
        {
          heading: "Order Acceptance",
          paragraphs: [
            "We reserve the right to accept or cancel any order due to availability, payment issues, or suspected fraudulent activity.",
          ],
        },
        {
          heading: "Shipping & Delivery",
          paragraphs: [
            "Orders are processed and delivered as per our Shipping Policy. Delivery timelines are estimates and may vary due to external factors.",
          ],
        },
        {
          heading: "Returns & Exchanges",
          paragraphs: [
            "Returns and exchanges are subject to our Return & Exchange Policy. Please review the policy before placing your order.",
          ],
        },
        {
          heading: "Intellectual Property",
          paragraphs: [
            "All content on this website, including images, text, and branding, belongs to Tvisaa_for You and may not be used without permission.",
          ],
        },
        {
          heading: "Limitation of Liability",
          paragraphs: [
            "Tvisaa_for You shall not be held liable for any indirect or incidental damages arising from the use of our products or website.",
          ],
        },
        {
          heading: "Changes to Terms",
          paragraphs: [
            "We reserve the right to update these terms at any time. Continued use of the website implies acceptance of the updated terms.",
          ],
        },
        {
          heading: "Contact Us",
          paragraphs: [
            "For any questions, please contact us.",
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