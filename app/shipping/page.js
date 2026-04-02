'use client';

export default function ShippingPage() {
    return (
        <div className="container-custom py-12">
            <h1 className="text-3xl font-display font-bold mb-8 text-center bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent">Shipping Policy</h1>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-neutral-100">
                <div className="prose prose-neutral max-w-none text-neutral-600">
                    <p>
                        At <strong>Yellowstone Jewellery</strong>, we’re excited to offer free shipping on all orders, anywhere in India.
                        We want your shopping experience with us to be as smooth and delightful as possible. Here are a few details about our shipping process:
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">1. Free Shipping</h2>
                    <p>
                        Yes, you heard it right! We offer <strong>free standard shipping on all orders across India</strong>. No minimum purchase required.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">2. Order Processing</h2>
                    <p>
                        We aim to dispatch orders within <strong>4 business days</strong> for items that are in stock.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">3. Shipping Methods</h2>
                    <p>
                        We use various courier services to ensure the best possible delivery time. This allows us to get your order to you quickly and reliably.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">4. Tracking</h2>
                    <p>
                        Once your order is shipped, you will receive a notification from us or our courier partner, which may be through email, SMS, or WhatsApp.
                        This notification will include a tracking number so you can keep an eye on your package until it reaches you.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">5. Returns and Exchanges Pickup</h2>
                    <p>
                        If you wish to return or exchange a product, you must first initiate a request. To do this:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Log in to your account on our website.</li>
                        <li>Select the order containing the item you want to return or exchange.</li>
                        <li>Click "Request Refund/Exchange" and choose a valid reason.</li>
                        <li>Submit the request, and our team will review it and guide you through the next steps.</li>
                    </ul>
                    <p className="mt-2">
                        Once your return or exchange is approved, we will arrange the pickup. Our courier partners will contact you to schedule a convenient time.
                        Please ensure that the product is ready for collection with the box it was shipped in and the invoice.
                    </p>
                    <p>
                        For details on when returns and exchanges are applicable, please refer to our <a href="/returns" className="text-primary-600 hover:underline">Returns and Refund Policy</a>.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">6. Damage/Loss in Transit</h2>
                    <p>
                        In the rare event that your order is damaged or lost during transit, please contact us immediately.
                        We take such matters very seriously and will promptly address any issues, which might include sending a replacement item or issuing a refund.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">7. Delays</h2>
                    <p>
                        While we always aim to meet our delivery times, occasionally, there might be some delays due to unforeseen circumstances with our courier partners.
                        Rest assured, in such cases, we will proactively reach out to you, inform you of the issue, and work on the best possible solution.
                        We appreciate your understanding and patience in such situations. Your satisfaction is our utmost priority.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">Contact Us</h2>
                    <p>If you have any questions or concerns, feel free to get in touch with us at:</p>
                    <ul className="list-none pl-0 space-y-1 mt-2">
                        <li><strong>Email:</strong> jewellery.yellowstone@gmail.com</li>
                        <li><strong>WhatsApp:</strong> 9891263806</li>
                    </ul>
                    <h2 className="font-display text-neutral-800 mt-8">Shipping Policy Delivery Time Frame</h2>
                    <p>
                        Shipping Policy: Products are processed on the same date of placing the order and that order will get delivered to your end within 5 to 7 working days.
                    </p>

                    <p className="text-sm text-neutral-500 mt-4">
                        This policy was last updated on January 2026.
                    </p>
                </div>
            </div>
        </div>
    );
}
