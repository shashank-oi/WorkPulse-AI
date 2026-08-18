import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  Cloud,
  FileText,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Users,
    title: "Employee Management",
    text: "Add and manage employees from your company workspace.",
  },
  {
    icon: Mail,
    title: "Employee Invitations",
    text: "Invite employees by email with a secure activation link.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    text: "Protected access for admins and employees.",
  },
  {
    icon: Building2,
    title: "Company Management",
    text: "Keep company workforce data separate and organized.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Management",
    text: "Track employee attendance and daily workforce records.",
  },
  {
    icon: FileText,
    title: "Leave Management",
    text: "Employees can request leave and admins can manage requests.",
  },
];

const UPCOMING_FEATURES = [
  {
    icon: Cloud,
    title: "Cloud Attendance",
    text: "Access and manage attendance data securely from anywhere.",
  },
  {
    icon: BarChart3,
    title: "Workforce Analytics",
    text: "View attendance trends, employee statistics, and workforce insights.",
  },
  {
    icon: FileText,
    title: "Reports & Insights",
    text: "Generate useful reports for attendance, leave, and employee activity.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your company",
    text: "Create your company workspace and become the administrator.",
  },
  {
    n: "02",
    title: "Invite employees",
    text: "Add employees using their email address and send an invitation.",
  },
  {
    n: "03",
    title: "Activate account",
    text: "Employees open the email, set their password, and activate their account.",
  },
  {
    n: "04",
    title: "Manage your workforce",
    text: "Admins and employees access the features available for their role.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          <Link to="/" aria-label="WorkPulse AI home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#features" className="hover:text-primary">
              Features
            </a>

            <a href="#upcoming" className="hover:text-primary">
              Coming Soon
            </a>

            <a href="#how" className="hover:text-primary">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="hidden sm:inline-flex"
            >
              <Link to="/auth">Login</Link>
            </Button>

            <Button asChild>
              <Link to="/auth">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

        </div>
      </header>


      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-foreground">

        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.08]" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >

            <Badge variant="secondary" className="mb-5 gap-1.5">
              <span className="size-2 bg-primary" />
              Smart workforce management
            </Badge>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">

              One pulse for{" "}

              <span className="bg-primary px-2 text-primary-foreground">
                every
              </span>{" "}

              workforce you run.

            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              WorkPulse AI helps companies manage employees, attendance,
              and leave from one secure workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">

              <Button size="lg" asChild>
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="size-5" />
                </Link>
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">
                  Login
                </Link>
              </Button>

            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium text-muted-foreground">

              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Secure access
              </span>

              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Employee control
              </span>

              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Company data isolation
              </span>

            </div>

          </motion.div>


          {/* SIMPLE IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center justify-center"
          >

            <div className="relative w-full max-w-xl">

              <div className="absolute -right-3 -top-3 h-full w-full border-2 border-foreground bg-primary" />

              <div className="relative border-2 border-foreground bg-card p-4 shadow-brutal-lg">

                <img
                  src="/workforce-illustration.png"
                  alt="WorkPulse AI workforce management"
                  className="h-auto w-full object-contain"
                />

              </div>

            </div>

          </motion.div>

        </div>
      </section>


      {/* FEATURES */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
      >

        <motion.div {...fadeUp} className="mb-12 max-w-2xl">

          <Badge variant="outline" className="mb-4">
            Features
          </Badge>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Everything your workforce needs.
          </h2>

          <p className="mt-3 text-muted-foreground">
            Simple tools for managing employees, attendance, leave,
            and company access.
          </p>

        </motion.div>


        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {FEATURES.map((feature, index) => (

            <motion.div
              key={feature.title}
              {...fadeUp}
              transition={{
                duration: 0.45,
                delay: index * 0.08,
              }}
              className="border-2 border-foreground bg-card p-5 shadow-brutal transition-transform hover:-translate-y-1"
            >

              <div className="mb-4 flex size-11 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-brutal-sm">
                <feature.icon
                  className="size-5"
                  strokeWidth={2.5}
                />
              </div>

              <h3 className="text-lg font-black tracking-tight">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.text}
              </p>

            </motion.div>

          ))}

        </div>

      </section>


      {/* UPCOMING */}
      <section
        id="upcoming"
        className="border-y-2 border-foreground bg-secondary"
      >

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

          <motion.div {...fadeUp} className="mb-12 max-w-2xl">

            <Badge className="mb-4">
              Coming Soon
            </Badge>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              More powerful tools are on the way.
            </h2>

            <p className="mt-3 text-muted-foreground">
              New features designed to make workforce management
              smarter and more accessible.
            </p>

          </motion.div>


          <div className="grid gap-6 md:grid-cols-3">

            {UPCOMING_FEATURES.map((feature, index) => (

              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="border-2 border-foreground bg-background p-6 shadow-brutal"
              >

                <div className="mb-4 flex size-11 items-center justify-center border-2 border-foreground bg-primary shadow-brutal-sm">

                  <feature.icon
                    className="size-5"
                    strokeWidth={2.5}
                  />

                </div>

                <h3 className="text-lg font-black">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.text}
                </p>

                <span className="mt-5 inline-block border-2 border-foreground bg-secondary px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                  Coming Soon
                </span>

              </motion.div>

            ))}

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section id="how">

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

          <motion.div {...fadeUp} className="mb-12 max-w-2xl">

            <Badge variant="outline" className="mb-4">
              How it works
            </Badge>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Get your workforce started in minutes.
            </h2>

          </motion.div>


          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {STEPS.map((step, index) => (

              <motion.div
                key={step.n}
                {...fadeUp}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="relative border-2 border-foreground bg-background p-6 shadow-brutal"
              >

                <span className="absolute -top-5 left-6 border-2 border-foreground bg-primary px-2.5 py-1 text-sm font-black text-primary-foreground shadow-brutal-sm">
                  {step.n}
                </span>

                <h3 className="mt-4 text-xl font-black tracking-tight">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>

              </motion.div>

            ))}

          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

        <motion.div
          {...fadeUp}
          className="relative border-2 border-foreground bg-primary p-8 text-primary-foreground shadow-brutal-lg sm:p-12"
        >

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">

            <div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Ready to manage your workforce?
              </h2>

              <p className="mt-2 max-w-md font-semibold opacity-80">
                Create your company, invite your employees, and manage
                your workforce from one secure workspace.
              </p>

            </div>

            <Button
              size="lg"
              className="border-2 border-foreground bg-background text-foreground shadow-brutal hover:bg-accent"
              asChild
            >
              <Link to="/auth">
                Get Started
                <ArrowRight className="size-5" />
              </Link>
            </Button>

          </div>

        </motion.div>

      </section>


      {/* FOOTER */}
      <footer className="border-t-2 border-foreground">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">

          <Logo />

          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} WorkPulse AI. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm font-semibold">

            <Link
              to="/auth"
              className="hover:text-primary"
            >
              Login
            </Link>

            <Link
              to="/auth"
              className="hover:text-primary"
            >
              Get Started
            </Link>

          </div>

        </div>

      </footer>

    </div>
  );
}