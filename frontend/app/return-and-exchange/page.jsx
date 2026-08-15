// app/jewellery-care/page.jsx
import InfoPage from "@/components/footer/InfoPage";

export default function ReturnAndExchange() {
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const message = encodeURIComponent('Hi Tvisaa!');
    const href = `https://wa.me/${phoneNumber}?text=${message}`;
    const Pages = [
        {
            eyebrow: "Customer Care",
            title: "Return and Exchange",
            intro: "At Tvisaa for You, every piece is carefully inspected and securely packaged to meet our quality standards.",
            sections: [
                {
                    heading: "Returns & Exchanges",
                    list: [
                        "We do not offer returns or general exchanges once a product is delivered. All sales are final."
                    ],
                },
                {
                    heading: "Damaged or Defective Items",
                    list: [
                        "We offer exchange only in case the product is received damaged or defective."
                    ],
                },
                {
                    heading: "To be eligible for an exchange:",
                    list: [
                        "A request must be raised within 48 hours of delivery",
                        "A complete unboxing video is required (from sealed package to clearly showing the issue)"
                    ],
                },
                { list: ["This helps us ensure a fair and transparent resolution process."] },
                {
                    heading: "Exchange Conditions",
                    list: [
                        "Exchanges are subject to product availability",
                        "You may select a product of equal or higher value",
                        "If a higher-value item is chosen, the price difference must be paid"
                    ],
                },
                {
                    heading: "Cancellations",
                    list: [
                        "Orders can only be cancelled before they are shipped. Once dispatched, cancellations are not possible."
                    ],
                },
                {
                    heading: "Important Note",
                    list: [
                        "We strongly recommend recording an unboxing video for all orders, as it is required to process any damage-related claims."
                    ]
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
            ]
        }
    ]
    return (
        <InfoPage
            pages={Pages}
        />
    );
}