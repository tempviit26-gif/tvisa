// app/cash-on-delivery/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function CashOnDeliveryPage() {
   const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const message = encodeURIComponent('Hi Tvisaa!');
  const href = `https://wa.me/${phoneNumber}?text=${message}`;
  const Pages = [
    {
      eyebrow: "Customer Care",
      title: "Cash on Delivery",
      intro: "At Tvisaa for You, we offer Cash on Delivery (COD) as a convenient payment option for our customers.",
      sections:
        [
          {
            heading: "COD Charges",
            list: [
              "A convenience fee of ₹99 is applicable on all COD orders. This fee covers handling and logistics costs and is non-refundable."
            ]
          },
          {
            heading: "Order Confirmation",
            list: [
              "COD orders may be subject to confirmation via WhatsApp or call before dispatch to ensure smooth processing."
            ]
          },
          {
            heading: "Order Processing",
            list: [
              "Once confirmed, COD orders are processed and dispatched within 24–48 hours. In some cases, processing may begin only after confirmation is completed."
            ]
          },
          {
            heading: "Delivery",
            list: [
              "Please ensure availability at the provided address to receive your order. Missed deliveries may lead to delays or cancellation by the courier partner."
            ]
          },
          {
            heading: "Exchanges",
            list: [
              "COD orders are eligible for exchange only in case of damaged or defective items, as per our Return & Exchange Policy. We do not offer returns."
            ]
          },
          {
            heading: "Policy Note",
            list: [
              "The COD fee helps us maintain secure order handling and ensure a reliable delivery experience."
            ]
          },
          {
            heading: "Contact Us",
            list: [(
              <>
              For any queries, please reach out to us via{" "}
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black underline underline-offset-4">
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
            )]
          }
        ]
    }
  ]
  return (
    <InfoPage
      pages={Pages}
    />
  );
}
