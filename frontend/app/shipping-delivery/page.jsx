// app/shipping-delivery/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function ShippingDeliveryPage() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const message = encodeURIComponent('Hi Tvisaa!');
  const href = `https://wa.me/${phoneNumber}?text=${message}`;
  const Pages = [
    {
      eyebrow: "Customer Care",
      title: "Shipping & Delivery",
      intro:
        "At Tvisaa for You, we aim to deliver your jewellery safely, securely, and on time.",
      sections: [
        {
          heading: "Order Processing",
          list: [
            "All orders are processed and dispatched within 24–48 hours after confirmation.",
            "Orders placed on weekends or public holidays will be processed on the next working day.",
          ],
        },
        {
          heading: "Delivery Timeline",
          list: [
            "Delivery typically takes 3–7 business days, depending on your location and pincode.",
            "Remote areas may require additional time.",
            "Once shipped, tracking details will be shared via email or WhatsApp.",
          ],
        },
        {
          heading: "Shipping Charges",
          list: [
            "Free shipping on prepaid orders.",
            "Cash on Delivery (COD) is available at an additional charge of ₹99.",
          ],
        },
        {
          heading: "Order Tracking",
          paragraphs: [
            "You can track your order using the link shared after dispatch to monitor delivery status in real time.",
          ],
        },
        {
          heading: "Delays",
          paragraphs: [
            "While we strive to deliver within the estimated timeline, delays may occur due to unforeseen circumstances such as weather conditions, logistics issues, or high-demand periods.",
          ],
        },
        {
          heading: "Incorrect Address",
          paragraphs: [
            "Please ensure that your shipping details are accurate at the time of placing the order.",
            "Tvisaa for You will not be responsible for delays or losses due to incorrect or incomplete address information.",
          ],
        },
        {
          heading: "Quality Assurance",
          paragraphs: [
            "All products are carefully inspected and securely packaged before dispatch to ensure they reach you in excellent condition.",
          ],
        },
        {
    heading: "Contact Us",
    list: [(
        <>
            For any queries or to request an exchange, please reach out via{" "}
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black underline underline-offset-4"
            >
                WhatsApp
            </a>{" "}
            or email at:{" "}
            <a
                href="mailto:tvisaasupport@gmail.com"
                className="text-gray-600 hover:text-black underline underline-offset-4"
            >
                tvisaasupport@gmail.com
            </a>
        </>
    )],
},
      ],
    },
  ];

  return <InfoPage pages={Pages} />;
}