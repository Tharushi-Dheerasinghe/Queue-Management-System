import { useState, useEffect } from "react";
import TenantCard from "../components/home/TenantCard";
import { getActiveTenantTypes } from "../services/tenantSelectionService";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import Navbar from "../components/common/NavBar";

import slide1 from "../assets/slide1.jpg";
import slide2 from "../assets/slide2.jpg";
import slide3 from "../assets/slide3.jpg";

const slides = [
  { id: 1, image: slide1, title: "Smart Healthcare", desc: "Efficient queue management for hospitals" },
  { id: 2, image: slide2, title: "Banking Made Easy", desc: "Reduce wait times at your branch" },
  { id: 3, image: slide3, title: "Seamless Retail", desc: "Smooth checkout experiences" },
];

export default function Home() {
  const [tenantTypes, setTenantTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTypes = async () => {
      const types = await getActiveTenantTypes();
      setTenantTypes(types);
      setLoading(false);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Slideshow */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden rounded-b-[40px] shadow-2xl">
        {slides.map((slide, idx) => (
          <div 
            key={slide.id} 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
          >
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/80 z-10"></div>
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80' }}
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg transform transition-transform duration-700 translate-y-0">
                {t(slide.title)}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-slate-200 max-w-2xl drop-shadow-md">
                {t(slide.desc)}
              </p>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t("Select a Service Domain")}</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">{t("Choose a domain below")}</p>
        </div>

        {loading ? (
          <div className="mt-10 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-blue-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 !clip-rect(0,0,0,0)">Loading...</span>
            </div>
          </div>
        ) : tenantTypes.length === 0 ? (
          <div className="mt-10 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mx-auto max-w-2xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t("No Services Available")}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t("No active organizations")}</p>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-6xl grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {tenantTypes.map((type) => (
              <TenantCard
                key={type}
                routeKey={type}
                entryPath={`/${type}/select-organization`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}