export const metadata = {
    title: 'Store Policies — Tvisaa',
    description: 'Read our store policies including shipping, returns, and exchanges.'
};

export default function PoliciesPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16 lg:py-24">
            <h1 className="font-cormorant text-4xl lg:text-5xl text-noir mb-8 text-center">Store Policies</h1>

            <div className="space-y-12 text-noir/80 font-jost font-light leading-relaxed">
                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">1. Shipping Policy</h2>
                    <p className="mb-4">
                        We offer free express shipping on all orders within India. All orders are processed within 1-2 business days.
                        Delivery typically takes 3-5 business days depending on your location. Once your order is dispatched, you will receive a tracking link via email.
                    </p>
                    <p>
                        For international orders, shipping times vary from 7-14 business days. Customs duties and taxes for international shipments are the responsibility of the customer.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">2. Returns & Exchange</h2>
                    <p className="mb-4">
                        We want you to love your jewelry. If you are not completely satisfied with your purchase, you may return or exchange it within 30 days of delivery.
                        The item must be unused, in its original packaging, and with all tags intact.
                    </p>
                    <p>
                        Please note that custom-made or engraved items are not eligible for returns unless they arrive damaged or defective.
                        To initiate a return, please contact our support team at hello@tvisaa.com.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">3. Lifetime Exchange Policy</h2>
                    <p>
                        We stand by the quality of our jewelry. Gold and diamond jewelry purchased from Tvisaa is eligible for our Lifetime Exchange Policy.
                        You can exchange your jewelry at the prevailing market rate of gold/diamonds, subject to a minor deduction for making charges.
                        Please ensure you retain your original invoice and certificates for seamless exchange processing.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">4. Refunds</h2>
                    <p>
                        Once your returned item is received and inspected, we will notify you of the approval or rejection of your refund.
                        If approved, the refund will be processed to your original method of payment within 7-10 business days.
                    </p>
                </section>
            </div>
        </div>
    );
}
