import { Phone } from "lucide-react";

export default function EmergencyCallButton({ name, number }) {
  return (
    <a
      href={`tel:${number}`}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <Phone size={20} className="flex-shrink-0" />
      <div className="flex flex-col">
        <span className="font-semibold leading-tight text-xs md:text-sm">
          {name}
        </span>
        <span className="text-xs opacity-90 leading-tight">
          {number}
        </span>
      </div>
    </a>
  );
}
