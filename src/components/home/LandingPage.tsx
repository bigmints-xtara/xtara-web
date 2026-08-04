'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
    ArrowRight,
    Compass,
    Layers,
    BookOpen,
    Globe,
    Target as TargetIcon,
    Users,
    Shield,
    Plus,
    Minus
} from "lucide-react";

// FAQ data
const faqs = [
    {
        question: "Is xtara.ai free to use?",
        answer: "Yes! The basic assessment and career recommendations are completely free. Premium features include detailed learning plans and personalized mentorship."
    },
    {
        question: "How accurate are the recommendations?",
        answer: "Our discovery activity organizes the answers you provide into early signals and explains why an area appeared. It is guidance to investigate, not a validated psychometric verdict or perfect-career score."
    },
    {
        question: "Will I get college or course suggestions too?",
        answer: "Absolutely! After your assessment, you'll receive personalized recommendations for colleges, courses, and specific programs that align with your career goals and location preferences."
    },
    {
        question: "Can I use this if I'm unsure about my stream or marks?",
        answer: "Yes! Our assessment is designed to help you discover your interests and strengths regardless of your current academic situation. We'll guide you towards the best path based on your unique profile."
    },
    {
        question: "Do parents or teachers get access?",
        answer: "Yes! We offer separate dashboards for parents and teachers to monitor progress and provide guidance, while keeping student data private."
    }
];

// Benefit section component
function BenefitSection({
    benefit,
    imageAtRight
}: {
    benefit: {
        title: string;
        description: string;
        bullets: Array<{
            icon: React.ReactNode;
            title: string;
            description: string;
        }>;
        imageSrc: string;
    };
    imageAtRight: boolean;
}) {
    return (
        <section className="benefit-section py-12 lg:py-24">
            <div className={`flex flex-wrap flex-col items-center justify-center gap-8 lg:flex-row lg:gap-20 lg:flex-nowrap ${imageAtRight ? '' : 'lg:flex-row-reverse'}`}>
                {/* Content */}
                <div className={`flex flex-wrap items-center w-full max-w-lg ${imageAtRight ? 'lg:order-1' : ''} justify-start`}>
                    <div className="w-full text-center lg:text-left">
                        <div className="flex flex-col w-full">
                            <h3 className="lg:max-w-2xl text-3xl lg:text-5xl lg:leading-tight font-bold text-foreground">
                                {benefit.title}
                            </h3>
                            <p className="mt-1.5 mx-auto lg:ml-0 leading-normal text-muted-foreground">
                                {benefit.description}
                            </p>
                        </div>
                        <div className="mx-auto lg:ml-0 w-full">
                            {benefit.bullets.map((bullet, index) => (
                                <div key={index} className="flex flex-col items-center mt-8 gap-3 lg:gap-5 lg:flex-row lg:items-start">
                                    <div className="flex justify-center mx-auto lg:mx-0 flex-shrink-0 mt-3 w-fit text-foreground">
                                        {bullet.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-foreground">{bullet.title}</h4>
                                        <p className="text-base text-muted-foreground">{bullet.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div className={`mt-5 lg:mt-0 ${imageAtRight ? '' : 'lg:order-2'}`}>
                    <div className="w-fit flex justify-end">
                        <Image
                            src={benefit.imageSrc}
                            alt={benefit.title}
                            width={500}
                            height={600}
                            className="lg:ml-0 rounded-3xl object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

// FAQ Item component
function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-7">
            <button
                className="flex items-center justify-between w-full px-4 pt-7 text-lg text-left border-t border-gray-300"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="text-2xl font-semibold text-foreground">{question}</span>
                {isOpen ? (
                    <Minus className="w-5 h-5 text-foreground flex-shrink-0" />
                ) : (
                    <Plus className="w-5 h-5 text-foreground flex-shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 pt-4 pb-2">
                    <p className="text-muted-foreground">{answer}</p>
                </div>
            )}
        </div>
    );
}

export default function LandingPage() {

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Hero Section */}
            <section id="hero" className="relative flex items-center justify-center pb-16 pt-28 px-5 bg-primary">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl md:leading-tight font-bold text-white max-w-lg md:max-w-2xl mx-auto">
                            Discover the right path for every learner.
                        </h1>
                        <p className="mt-4 text-gray-200 max-w-lg mx-auto">
                            Xtara helps students find their true calling through personalized assessments, step-by-step learning plans, and location-based career recommendations.
                        </p>
                        <div className="mt-6 mb-8 flex flex-col sm:flex-row items-center sm:gap-4 w-fit mx-auto">
                            <Link href="/assessment">
                                <button
                                    type="button"
                                    className="flex items-center justify-center min-w-[205px] mt-3 px-8 h-14 rounded-full w-full sm:w-fit text-black bg-amber-500 hover:bg-amber-500/80 font-semibold transition-colors"
                                >
                                    Take an Assessment
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                            </Link>
                            <Link href="/login">
                                <button
                                    type="button"
                                    className="flex items-center justify-center min-w-[205px] mt-3 px-8 h-14 rounded-full w-full sm:w-fit text-white bg-transparent border-2 border-white hover:bg-white/10 font-semibold transition-colors"
                                >
                                    Login to Account
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-10 lg:py-20 px-5 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-10">
                        <div className="lg:w-1/3">
                            <p className="hidden lg:block text-muted-foreground">FAQ'S</p>
                            <h2 className="my-3 !leading-snug lg:max-w-sm text-center lg:text-left text-3xl lg:text-5xl lg:leading-tight font-bold text-foreground">
                                Frequently Asked Questions
                            </h2>
                            <p className="lg:mt-10 text-muted-foreground text-center lg:text-left">
                                Ask us anything!
                            </p>
                            <a
                                href="mailto:help@xtara.ai"
                                className="mt-3 block text-xl lg:text-4xl text-foreground font-semibold hover:underline text-center lg:text-left"
                            >
                                help@xtara.ai
                            </a>
                        </div>
                        <div className="w-full lg:max-w-2xl mx-auto border-b border-gray-300">
                            {faqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* App Download CTA Section */}
            <section id="cta" className="mt-10 mb-5 lg:my-20 px-5">
                <div className="max-w-7xl mx-auto">
                    <div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
                        <div className="h-full w-full">
                            <div className="rounded-3xl opacity-95 absolute inset-0 -z-10 h-full w-full bg-primary"></div>
                            <div className="h-full flex flex-col items-center justify-center text-white text-center px-5">
                                <h2 className="text-2xl sm:text-3xl md:text-5xl md:leading-tight font-semibold mb-4 max-w-2xl">
                                    Download the App and Start Exploring
                                </h2>
                                <p className="mx-auto max-w-xl md:px-5">
                                    Available for Android and iOS — for students, parents, schools, and companies.
                                </p>
                                <div className="mt-4 flex flex-col sm:flex-row items-center sm:gap-4">
                                    <a href="https://apps.apple.com/app/xtara-career-guidance/id1234567890">
                                        <button
                                            type="button"
                                            className="flex items-center justify-center min-w-[205px] mt-3 px-6 h-14 rounded-full w-full sm:w-fit text-foreground bg-white hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="mr-3">
                                                <svg viewBox="0 0 384 512" width="30">
                                                    <path
                                                        fill="currentColor"
                                                        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-xs text-left">Download on the</div>
                                                <div className="-mt-1 font-sans text-xl font-semibold">App Store</div>
                                            </div>
                                        </button>
                                    </a>
                                    <a href="https://play.google.com/store/apps/details?id=com.bigmints.xtara">
                                        <button
                                            type="button"
                                            className="flex items-center justify-center min-w-[205px] mt-3 px-6 h-14 rounded-full w-full sm:w-fit text-foreground bg-white hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="mr-3">
                                                <svg viewBox="30 336.7 120.9 129.2" width="30">
                                                    <path fill="#FFD400" d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7  c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z" />
                                                    <path fill="#FF3333" d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3  c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z" />
                                                    <path fill="#48FF48" d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1  c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z" />
                                                    <path fill="#3BCCFF" d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6  c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-xs text-left">GET IT ON</div>
                                                <div className="-mt-1 font-sans text-xl font-semibold">Google Play</div>
                                            </div>
                                        </button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
