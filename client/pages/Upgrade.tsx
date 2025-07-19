import { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Check,
  X,
  Star,
  Zap,
  Crown,
  Shield,
  CreditCard,
  RefreshCw,
  Users,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const features = [
  {
    name: "XP Multiplier",
    free: "1x",
    premium: "2x Bonus XP",
    description: "Earn double XP for all activities",
  },
  {
    name: "Exclusive Content",
    free: false,
    premium: true,
    description: "Access premium courses and study materials",
  },
  {
    name: "Public Groups",
    free: "3 groups max",
    premium: "Unlimited",
    description: "Join as many study groups as you want",
  },
  {
    name: "Daily Challenges",
    free: "Basic only",
    premium: "Advanced + Rewards",
    description: "Unlock advanced challenges with better rewards",
  },
  {
    name: "Badge Collection",
    free: "Standard badges",
    premium: "Exclusive + Animated",
    description: "Collect rare badges and animated achievements",
  },
  {
    name: "Priority Support",
    free: false,
    premium: true,
    description: "Get faster response times for help requests",
  },
  {
    name: "Ad-Free Experience",
    free: false,
    premium: true,
    description: "Learn without interruptions",
  },
  {
    name: "Profile Customization",
    free: "Basic themes",
    premium: "Premium themes + Effects",
    description: "Customize your profile with exclusive themes",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for getting started",
    features: [
      "Basic XP tracking",
      "Join 3 study groups",
      "Standard notes sharing",
      "Basic achievements",
      "Community support",
    ],
    buttonText: "Current Plan",
    popular: false,
    disabled: true,
  },
  {
    name: "Premium Monthly",
    price: { monthly: 9.99, yearly: 0 },
    description: "Full access to all features",
    features: [
      "2x XP multiplier",
      "Unlimited study groups",
      "Premium content library",
      "Advanced challenges",
      "Exclusive badges & themes",
      "Priority support",
      "Ad-free experience",
    ],
    buttonText: "Upgrade Now",
    popular: true,
    disabled: false,
  },
  {
    name: "Premium Yearly",
    price: { monthly: 0, yearly: 79.99 },
    originalPrice: 119.88,
    description: "Best value - 2 months free!",
    features: [
      "Everything in Monthly",
      "2 months FREE",
      "Early access to features",
      "Annual exclusive rewards",
      "VIP community access",
    ],
    buttonText: "Get Best Deal",
    popular: false,
    disabled: false,
    savings: "Save 33%",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Computer Science Student",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face",
    quote:
      "Premium transformed my learning experience. The 2x XP multiplier and exclusive content helped me level up so much faster!",
    rating: 5,
  },
  {
    name: "Mike Johnson",
    role: "Data Science Learner",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
    quote:
      "The premium study groups are amazing. Being able to join unlimited groups opened up so many learning opportunities.",
    rating: 5,
  },
  {
    name: "Ana Rodriguez",
    role: "Language Enthusiast",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
    quote:
      "Worth every penny! The exclusive badges and ad-free experience make studying so much more enjoyable.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes! You can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your billing period.",
  },
  {
    question: "Will my progress and data be saved?",
    answer:
      "Absolutely! All your XP, achievements, notes, and group memberships are permanently saved. Even if you downgrade, your data remains secure.",
  },
  {
    question: "What happens to my exclusive badges if I downgrade?",
    answer:
      "You'll keep all badges you've earned, but you won't be able to earn new premium-exclusive badges until you upgrade again.",
  },
  {
    question: "Is there a student discount available?",
    answer:
      "Yes! We offer a 20% student discount on all premium plans. Contact support with your student ID to apply the discount.",
  },
  {
    question: "How does the 2x XP multiplier work?",
    answer:
      "The XP multiplier applies to all activities - uploading notes, completing challenges, and participating in groups. You'll see 2x XP added to your account instantly.",
  },
];

export function Upgrade() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <Layout>
      <div className="space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 py-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                  <Crown className="w-12 h-12 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-purple-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
                Unlock the{" "}
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Full Experience
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Level up faster, access premium content, and get exclusive
                rewards that accelerate your learning journey.
              </p>
            </div>

            <button
              onClick={() => navigate("/profile/upgrade")}
              className="group lettrblack-button text-lg px-8 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-primary/25"
            >
              <span className="flex items-center gap-3">
                <Crown className="w-6 h-6 group-hover:animate-bounce" />
                Upgrade to Premium
                <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              Cancel Anytime
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              No Hidden Fees
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="lettrblack-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Free vs Premium
            </h2>
            <p className="text-muted-foreground">
              See what you unlock with premium access
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">
                    Features
                  </th>
                  <th className="text-center p-4 font-semibold text-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Free
                    </div>
                  </th>
                  <th className="text-center p-4 font-semibold">
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Crown className="w-4 h-4" />
                      Premium
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {feature.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          {feature.free}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.premium === "boolean" ? (
                        feature.premium ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-primary font-medium">
                          {feature.premium}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground mb-6">
              Start learning faster with premium features
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  billingPeriod === "monthly"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingPeriod(
                    billingPeriod === "monthly" ? "yearly" : "monthly",
                  )
                }
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  billingPeriod === "yearly" ? "bg-primary" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    billingPeriod === "yearly"
                      ? "translate-x-7"
                      : "translate-x-1",
                  )}
                />
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    billingPeriod === "yearly"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Yearly
                </span>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                  Save 33%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={cn(
                  "lettrblack-card relative overflow-hidden transition-all duration-300",
                  plan.popular &&
                    "ring-2 ring-primary scale-105 shadow-2xl shadow-primary/25",
                  !plan.disabled && "hover:scale-105",
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-purple-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {plan.savings}
                  </div>
                )}

                <div className={cn("p-6", plan.popular && "pt-12")}>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>

                    <div className="space-y-2">
                      {billingPeriod === "monthly" ? (
                        <div className="text-3xl font-bold text-foreground">
                          {plan.price.monthly === 0 ? (
                            "Free"
                          ) : (
                            <>
                              ${plan.price.monthly}
                              <span className="text-lg text-muted-foreground font-normal">
                                /month
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-3xl font-bold text-foreground">
                            {plan.price.yearly === 0 ? (
                              "Free"
                            ) : (
                              <>
                                ${plan.price.yearly}
                                <span className="text-lg text-muted-foreground font-normal">
                                  /year
                                </span>
                              </>
                            )}
                          </div>
                          {plan.originalPrice && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${plan.originalPrice}/year
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={plan.disabled}
                    onClick={() => navigate("/checkout")}
                    className={cn(
                      "w-full py-3 rounded-lg font-semibold transition-all duration-300",
                      plan.disabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : plan.popular
                          ? "lettrblack-button bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="lettrblack-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What Our Premium Users Say
            </h2>
            <p className="text-muted-foreground">
              Join thousands of learners accelerating their progress
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-muted/30 p-6 rounded-xl border border-border"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <blockquote className="text-foreground mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="lettrblack-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about premium
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-12 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-2xl border border-primary/20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Accelerate Your Learning?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join thousands of premium learners and unlock your full potential
              today.
            </p>
            <button
              onClick={() => navigate("/profile/upgrade")}
              className="lettrblack-button text-lg px-8 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-primary/25"
            >
              Start Premium Now
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
