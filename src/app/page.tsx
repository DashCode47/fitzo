import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import AppScreens from "@/components/sections/AppScreens";
import VideoDemo from "@/components/sections/VideoDemo";
import Customization from "@/components/sections/Customization";
import HowItWorks from "@/components/sections/HowItWorks";
import Rankings from "@/components/sections/Rankings";
import Nutrition from "@/components/sections/Nutrition";
import Notifications from "@/components/sections/Notifications";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/sections/Footer";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <AppScreens />
      <VideoDemo />
      <Customization />
      <HowItWorks />
      <Rankings />
      <Nutrition />
      <Notifications />
      <CTA />
      <Footer />
    </main>
  );
}
