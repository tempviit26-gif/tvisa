export const metadata = {
    title: 'Terms & Conditions — Tvisaa',
    description: 'Read the legal terms and conditions for using the Tvisaa website.'
};

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16 lg:py-24">
            <h1 className="font-cormorant text-4xl lg:text-5xl text-noir mb-8 text-center">Terms & Conditions</h1>

            <div className="space-y-12 text-noir/80 font-jost font-light leading-relaxed">
                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">1. Introduction</h2>
                    <p>
                        Welcome to Tvisaa. These Terms & Conditions govern your use of our website and the purchase of products from us.
                        By accessing our website or placing an order, you agree to be bound by these terms. If you do not agree with any part of these terms, please do not use our website.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">2. Products & Pricing</h2>
                    <p className="mb-4">
                        We make every effort to display the colors and details of our jewelry as accurately as possible. However, due to natural variations in gemstones and screen displays, the actual product may differ slightly from the image.
                    </p>
                    <p>
                        All prices are subject to change without notice due to fluctuations in precious metal rates. The price applicable to your order is the price confirmed at the time of checkout.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">3. Intellectual Property</h2>
                    <p>
                        All content on this website, including product designs, images, logos, text, and graphics, is the exclusive property of Tvisaa and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or use any content without our prior written consent.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">4. User Accounts</h2>
                    <p className="mb-4">
                        To access certain features of the website, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and password.
                        You agree to accept responsibility for all activities that occur under your account.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">5. Limitation of Liability</h2>
                    <p>
                        Tvisaa shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our website or products, even if we have been advised of the possibility of such damages.
                    </p>
                </section>

                <section>
                    <h2 className="font-cormorant text-2xl text-noir mb-4 font-medium">6. Governing Law</h2>
                    <p>
                        These terms and conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the courts in your local jurisdiction.
                    </p>
                </section>
            </div>
        </div>
    );
}
