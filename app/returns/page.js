'use client';

export default function ReturnsPage() {
    return (
        <div className="container-custom py-12">
            <h1 className="text-3xl font-display font-bold mb-8 text-center bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent">Refund & Return Policy</h1>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-neutral-100">
                <div className="prose prose-neutral max-w-none text-neutral-600">

                    {/* PhonePe Mandatory Requirements */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
                        <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <span className="text-xl">⚠️</span>
                            Important Policy Information
                        </h3>
                        <ul className="space-y-3 text-neutral-700">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span><strong>Product Type:</strong> We sell <strong>artificial/imitation jewellery</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span><strong>Hygiene Policy:</strong> Used jewellery is <strong>non-returnable due to hygiene reasons</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span><strong>Refund Eligibility:</strong> Refunds are provided <strong>only in case of damaged or wrong product</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span><strong>Refund Timeline:</strong> <strong>5-7 working days</strong> after we receive and verify the returned item</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span><strong>Refund Method:</strong> Refunds will be processed to your <strong>original payment method</strong></span>
                            </li>
                        </ul>
                    </div>

                    <h2 className="font-display text-neutral-800">What's your standard return policy?</h2>
                    <p>
                        We offer <strong>7-day returns and exchanges</strong> for customers across India, starting from the day the shipment is delivered. Shipping and return fees may apply.
                    </p>

                    <h2 className="font-display text-neutral-800 mt-8">How do I pack the return correctly?</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Items must be in new, unworn condition and returned in the original box/packaging, sealed with tape, allowing with the invoice.</li>
                        <li>Returns sent without original packaging or in loose/unsealed packaging will not be accepted.</li>
                        <li>If your order included any free gifts, they must also be returned.</li>
                        <li>Items that do not meet these conditions will not be eligible for return or exchange.</li>
                        <li>
                            <strong>Please record a video of the entire process</strong>—showing the parcel contents, packing the parcel, and handing it over to our delivery partner.
                        </li>
                        <li>
                            If this video is not recorded, Yellowstone Jewellery will not be liable for any claims related to missing items, tampering, or pilferage in return or exchange parcels.
                        </li>
                        <li><strong>Return Shipping Fee:</strong> ₹150 (This charge does not apply to exchanges).</li>
                        <li>Please note: If your location falls under an unserviceable zone, you can ship the product to us, and we’ll waive the ₹150 deduction to make the process easier for you.</li>
                    </ul>

                    <h2 className="font-display text-neutral-800 mt-8">What items can I not return or exchange?</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Items that have been altered, resized, or personalised</li>
                        <li>Items purchased during sale events (eligible for exchange only)</li>
                        <li>Nose pins (for hygiene reasons)</li>
                        <li>Rakhis</li>
                    </ul>

                    <h2 className="font-display text-neutral-800 mt-8">How do I return or exchange my purchase?</h2>
                    <p>
                        You can request a return or exchange within 7 days of receiving your order. After 7 days, returns are not accepted, but exchanges can be made as per policy.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>In exchange for products, we provide store credit or a coupon of the same amount you paid at the time of purchase.</li>
                        <li><strong>Please note:</strong> Exchanges are done on the amount you paid and not on the current market rate if applicable.</li>
                        <li><strong>Please note:</strong> Exchange orders will not be treated as new orders. Therefore, refunds, exchanges, or returns will not be applicable on exchange orders.</li>
                        <li>Products purchased using store credits or coupons are NOT eligible for the 7-day exchange or return window.</li>
                    </ul>

                    <h2 className="font-display text-neutral-800 mt-8">What is the timeline for the return or exchange process?</h2>
                    <p>The entire process usually takes <strong>15–17 days</strong>:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>2 days – Request review & approval (Day 1–2)</li>
                        <li>+4 days – Product pickup by courier (Day 3–6)</li>
                        <li>+6 days – Product reaches us (Day 7–12)</li>
                        <li>+5 days – Refund initiated or exchange shipped (Day 13–17)</li>
                    </ul>
                    <h2 className="font-display text-neutral-800 mt-8">Replacement Time Frame</h2>
                    <p>
                        If replacements and exchange are accepted, then it will get delivered to you within 5-7 working days.
                    </p>

                    <p class="mt-2 text-sm italic">We try to move faster whenever possible, but timelines may vary slightly due to courier delays.</p>

                    <h2 className="font-display text-neutral-800 mt-8">What should I do if I receive a damaged or tampered package?</h2>
                    <p>
                        If your order arrives damaged, defective, or tampered with, please <strong>do not accept the package</strong>. Hand it back to the delivery person for RTO (Return to Origin).
                    </p>
                    <p className="mt-2">
                        Once done, contact us immediately on <strong>9891263806</strong>. We’ll resolve the issue and send you a brand-new replacement at no extra cost.
                    </p>
                    <div className="bg-amber-50 p-4 rounded-lg mt-4 border border-amber-100">
                        <p className="font-semibold text-amber-800">Important:</p>
                        <p className="text-amber-700">We cannot process the return or replacement without the unboxing/tampering video that was originally requested.</p>
                    </div>

                    <h2 className="font-display text-neutral-800 mt-8">Customer Support</h2>
                    <p>
                        If you have any questions or concerns about your return, exchange, or refund, our customer support team is here to help!
                        <br />We’re available Monday to Friday, from 10:30 AM to 6:30 PM.
                    </p>

                    <div className="mt-12 pt-8 border-t border-neutral-200">
                        <h3 className="font-bold text-lg mb-4">Contact Us</h3>
                        <p className="mb-2"><strong>WhatsApp:</strong> 9891263806</p>
                        <p className="mb-2"><strong>Email:</strong> jewellery.yellowstone@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
