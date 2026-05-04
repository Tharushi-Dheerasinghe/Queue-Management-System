import { assets } from "../assets/assets.js";

export const tenantConfig = {
  bank: {
    name: "ABC Bank",
    shortName: "Bank",
    description: "Manage customer service queues for banks.",
    bookingType: "token",

    organizations: [
      {
        name: "Bank of Ceylon",
        branches: ["Negombo Branch", "Colombo Fort Branch", "Gampaha Branch", "Kandy Branch"],
      },
      {
        name: "Commercial Bank",
        branches: ["Negombo Branch", "Colombo Branch", "Jaffna Branch", "Galle Branch"],
      },
      {
        name: "Sampath Bank",
        branches: ["Negombo Branch", "Colombo Branch", "Kandy Branch", "Matara Branch"],
      },
      {
        name: "Hatton National Bank",
        branches: ["Colombo Branch", "Gampaha Branch", "Kandy Branch", "Anuradhapura Branch"],
      },
      {
        name: "People's Bank",
        branches: ["Negombo Branch", "Colombo Branch", "Batticaloa Branch", "Trincomalee Branch"],
      },
      {
        name: "NDB Bank",
        branches: ["Colombo Branch", "Kandy Branch", "Galle Branch"],
      },
      {
        name: "DFCC Bank",
        branches: ["Colombo Branch", "Negombo Branch", "Matara Branch"],
      },
      {
        name: "Pan Asia Bank",
        branches: ["Colombo Branch", "Gampaha Branch", "Kandy Branch"],
      },
      {
        name: "Seylan Bank",
        branches: ["Negombo Branch", "Colombo Branch", "Jaffna Branch"],
      },
      {
        name: "Union Bank",
        branches: ["Colombo Branch", "Galle Branch", "Kandy Branch"],
      },
    ],

    services: [
      "Cash Transactions",
      "Account Services",
      "Card Services",
      "Fund Transfers",
      "Loan Services",
      "Business Banking",
      "Investment Services",
      "Customer Support",
      "Priority Services",
      "Foreign Exchange",
    ],

    icon: assets.bank_icon,

    theme: {
      primary: "bg-blue-600",
      primaryHover: "hover:bg-blue-700",
      light: "bg-blue-50",
      soft: "bg-blue-100",
      text: "text-blue-700",
      darkText: "text-blue-900",
      border: "border-blue-200",
      ring: "ring-blue-100",
      gradient: "from-blue-600 to-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  },

  hospital: {
    name: "The National Hospital",
    shortName: "Hospital",
    description: "Handle patient appointments and queue flow.",
    bookingType: "token",
    organizations: [
      {
        name: "Teaching Hospital",
        branches: ["Kandy", "Karapitiya", "Ragama", "Anuradhapura"],
      },
      {
        name: "National Hospital",
        branches: ["Colombo"],
      },
      {
        name: "Provincial General Hospital",
        branches: ["Kurunegala", "Ratnapura", "Badulla"],
      },
      {
        name: "District General Hospital",
        branches: ["Hambantota", "Matale", "Polonnaruwa"],
      },
      {
        name: "Base Hospital",
        branches: ["Panadura", "Homagama", "Horana"],
      },
      {
        name: "Divisional Hospital",
        branches: ["Kuliyapitiya", "Galgamuwa", "Tangalle"],
      },
      {
        name: "Specialized Hospital",
        branches: ["Lady Ridgeway", "Castle Street", "De Soysa", "Eye Hospital"],
      },
    ],
    services: [
      "OPD Consultation",
      "Radiology / Scans",
      "Laboratory Tests",
      "Dental Clinic",
      "Eye Clinic",
      "ENT Clinic",
      "Maternity Clinic",
      "Pediatric Clinic",
      "Cardiology Clinic",
      "General Customer Service",
    ],
    icon: assets.hospital_icon,
    theme: {
      primary: "bg-green-600",
      primaryHover: "hover:bg-green-700",
      light: "bg-green-50",
      soft: "bg-green-100",
      text: "text-green-700",
      darkText: "text-green-900",
      border: "border-green-200",
      ring: "ring-green-100",
      gradient: "from-green-600 to-emerald-400",
      button: "bg-green-600 hover:bg-green-700 text-white",
    },
  },

  police: {
    name: "Police Service Center",
    shortName: "Police",
    description: "Manage complaint and public service desk queues.",
    bookingType: "token",
    organizations: [
      {
        name: "Negombo Police",
        branches: ["Police Station", "Traffic Division", "CID"],
      },
      {
        name: "Colombo Police",
        branches: ["Police Station", "Traffic Division", "Women & Children Bureau"],
      },
      {
        name: "Gampaha Police",
        branches: ["Police Station", "CID", "Community Policing Unit"],
      },
      {
        name: "Jaffna Police",
        branches: ["Police Station", "Tourist Police", "Traffic Division"],
      },
      {
        name: "Kandy Police",
        branches: ["Police Station", "CID", "Women & Children Bureau"],
      },
      {
        name: "Galle Police",
        branches: ["Police Station", "Tourist Police", "Community Policing Unit"],
      },
      {
        name: "Anuradhapura Police",
        branches: ["Police Station", "Traffic Division", "CID"],
      },
      {
        name: "Matara Police",
        branches: ["Police Station", "Women & Children Bureau", "Community Policing Unit"],
      },
      {
        name: "Kurunegala Police",
        branches: ["Police Station", "Traffic Division", "Tourist Police"],
      },
      {
        name: "Ratnapura Police",
        branches: ["Police Station", "CID", "Community Policing Unit"],
      },
    ],
    services: [
      "Complaint Entry",
      "Document Verification",
      "Public Inquiry",
      "Emergency Desk",
      "Traffic Services",
      "Community Services",
      "Tourist Assistance",
      "Crime Reporting",
      "Lost & Found",
      "General Customer Service",
    ],
    icon: assets.police_icon,
    theme: {
      primary: "bg-indigo-700",
      primaryHover: "hover:bg-indigo-800",
      light: "bg-indigo-50",
      soft: "bg-indigo-100",
      text: "text-indigo-700",
      darkText: "text-indigo-900",
      border: "border-indigo-200",
      ring: "ring-indigo-100",
      gradient: "from-indigo-700 to-blue-500",
      button: "bg-indigo-700 hover:bg-indigo-800 text-white",
    },
  },

  supermarket: {
    name: "Smart Supermarket",
    shortName: "Supermarket",
    description: "Control billing and express checkout queues.",
    bookingType: "token",
    organizations: [
      {
        name: "Keells",
        branches: ["Colombo Branch", "Kandy Branch", "Galle Branch"],
      },
      {
        name: "Cargills",
        branches: ["Matara Branch", "Kurunegala Branch", "Negombo Branch"],
      },
      {
        name: "Arpico",
        branches: ["Ratnapura Branch", "Anuradhapura Branch", "Jaffna Branch"],
      },
      {
        name: "SPAR Sri Lanka",
        branches: ["Colombo Branch", "Trincomalee Branch", "Kandy Branch"],
      },
      {
        name: "Glomark",
        branches: ["Galle Branch", "Matara Branch", "Negombo Branch"],
      },
      {
        name: "Laugfs Supermarket",
        branches: ["Colombo Branch", "Kurunegala Branch", "Ratnapura Branch"],
      },
      {
        name: "Sathosa",
        branches: ["Jaffna Branch", "Anuradhapura Branch", "Galle Branch"],
      },
      {
        name: "Abans",
        branches: ["Colombo Branch", "Kandy Branch", "Matara Branch"],
      },
      {
        name: "Softlogic",
        branches: ["Negombo Branch", "Ratnapura Branch", "Trincomalee Branch"],
      },
      {
        name: "Harvey Norman",
        branches: ["Colombo Branch", "Kurunegala Branch", "Jaffna Branch"],
      },
    ],
    services: ["Billing Counter", "Express Checkout", "Returns Desk", "Customer Service"],
    icon: assets.supermarket_icon,
    theme: {
      primary: "bg-orange-600",
      primaryHover: "hover:bg-orange-700",
      light: "bg-orange-50",
      soft: "bg-orange-100",
      text: "text-orange-700",
      darkText: "text-orange-900",
      border: "border-orange-200",
      ring: "ring-orange-100",
      gradient: "from-orange-600 to-amber-400",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  },
};