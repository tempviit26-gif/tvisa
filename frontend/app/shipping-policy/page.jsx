// app/shipping-policy/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function ShippingPolicyPage() {
  const Pages = [
    {
      eyebrow:"Legal",
      title:"Shipping Policy",
      intro:"At Tvisaa_for You, we aim to deliver your jewellery safely and on time.",
      sections:[
        {
          heading: "Order Processing",
          paragraphs: [
            "All orders are processed within 1–2 business days after confirmation.",
            "Orders placed on weekends or holidays will be processed on the next working day.",
          ],
        },
        {
          heading: "Delivery Timeline",
          list: [
            "Delivery typically takes 3–7 business days, depending on your location",
            "Remote areas may require additional time",
            "Once your order is shipped, you will receive a tracking link to monitor your delivery.",
          ],
        },
        {
          heading: "Shipping Charges",
          list: [
            "Free shipping on prepaid orders",
            "Cash on Delivery (COD) is available for a convenience fee of ₹99",
          ],
        },
        {
          heading: "Order Tracking",
          paragraphs: [
            "You will receive tracking details via email or WhatsApp once your order has been dispatched.",
          ],
        },
        {
          heading: "Delays",
          paragraphs: [
            "While we strive to deliver within the estimated time, delays may occur due to unforeseen circumstances such as weather conditions, logistics issues, or high demand periods.",
          ],
        },
        {
          heading: "Incorrect Address",
          paragraphs: [
            "Please ensure that your shipping details are accurate.",
            "Tvisaa_for You will not be responsible for delays or losses due to incorrect address information.",
          ],
        },
        {
          heading: "Contact Us",
          paragraphs: [
            "For any shipping-related queries, feel free to contact us.",
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