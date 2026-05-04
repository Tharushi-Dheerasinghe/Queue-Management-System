import { Pill, Stethoscope, Ticket } from "lucide-react";

export const notificationsData = [
  {
    id: 1,
    type: "token",
    module: "bank",
    title: "Token Generated",
    message: "Your banking token has been created successfully.",
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "queue",
    module: "bank",
    title: "Queue Update",
    message: "Your turn is getting closer. Please be ready at the counter.",
    time: "10 mins ago",
  },
  {
    id: 3,
    type: "success",
    module: "bank",
    title: "Transaction Complete",
    message: "Your banking transaction has been completed successfully.",
    time: "30 mins ago",
  },
  {
    id: 4,
    type: "reminder",
    module: "police",
    title: "Document Verification",
    message: "Your document verification appointment is scheduled. Please bring all required documents.",
    time: "1 hour ago",
  },
  {
    id: 5,
    type: "queue",
    module: "police",
    title: "Position Update",
    message: "You are next in the queue. Please proceed to the counter.",
    time: "45 mins ago",
  },
  {
    id: 6,
    type: "success",
    module: "police",
    title: "Service Complete",
    message: "Your service has been processed successfully.",
    time: "2 hours ago",
  },
  {
    id: 7,
    type: "token",
    module: "supermarket",
    title: "Token Generated",
    message: "Your checkout token has been generated.",
    time: "5 mins ago",
  },
  {
    id: 8,
    type: "queue",
    module: "supermarket",
    title: "Queue Status",
    message: "2 customers ahead of you. Your wait time is approximately 5 minutes.",
    time: "3 mins ago",
  },
  {
    id: 9,
    type: "success",
    module: "supermarket",
    title: "Payment Confirmed",
    message: "Your payment has been processed. Thank you for shopping!",
    time: "20 mins ago",
  },
  {
    id: 10,
    type: "token",
    module: "hospital-token",
    title: "Token Generated",
    message: "Your hospital token has been created successfully.",
    time: "2 mins ago",
  },
  {
    id: 11,
    type: "queue",
    module: "hospital-token",
    title: "Queue Update",
    message: "Your turn is getting closer. Please be ready.",
    time: "10 mins ago",
  },
  {
    id: 12,
    type: "reminder",
    module: "hospital-channeling",
    title: "Appointment Reminder",
    message: "Your doctor channeling slot is coming up. Please arrive on time.",
    time: "20 mins ago",
  },
  {
    id: 13,
    type: "success",
    module: "hospital-channeling",
    title: "Booking Confirmed",
    message: "Your doctor appointment details were saved successfully.",
    time: "1 hour ago",
  },
  {
    id: 14,
    type: "success",
    module: "hospital-pharmacy",
    title: "Pharmacy Token Generated",
    message: "Your pharmacy token has been created successfully.",
    time: "5 mins ago",
  },
  {
    id: 15,
    type: "reminder",
    module: "hospital-pharmacy",
    title: "Pharmacy Queue Update",
    message: "Your pharmacy queue position has been updated. Please check your token.",
    time: "15 mins ago",
  },
];

export const notificationTypeConfig = {
  token: {
    emoji: "🎟️",
    color: "blue",
  },
  queue: {
    emoji: "🔜",
    color: "blue",
  },
  called: {
    emoji: "🔔",
    color: "amber",
  },
  skipped: {
    emoji: "⏭️",
    color: "orange",
  },
  completed: {
    emoji: "✅",
    color: "green",
  },
  reminder: {
    emoji: "🔔",
    color: "indigo",
  },
  success: {
    emoji: "✅",
    color: "green",
  },
  warning: {
    emoji: "⚠️",
    color: "orange",
  },
  cancelled: {
    emoji: "❌",
    color: "red",
  },
};

export const statusConfig = {
  Waiting: {
    label: "Waiting",
    color: "amber",
  },
  Called: {
    label: "Called",
    color: "blue",
  },
  Skipped: {
    label: "Skipped",
    color: "orange",
  },
  Completed: {
    label: "Completed",
    color: "green",
  },
  Cancelled: {
    label: "Cancelled",
    color: "red",
  },
};

export const sampleQueueStatus = {
  tokenNumber: "A102",
  currentToken: "A096",
  peopleAhead: 6,
  estimatedWait: "12 mins",
  status: "Waiting",
};

export const sampleBookingDetails = {
  fullName: "Nisindu Nubasara",
  mobile: "0712345678",
  note: "General service request",
  branch: "Negombo Branch",
  service: "Cash Deposit",
  tokenNumber: "A102",
};

export const sampleTokenData = {
  tokenNumber: "A102",
  branch: "Negombo Branch",
  service: "Cash Deposit",
  fullName: "Nisindu Nubasara",
  mobile: "0712345678",
  note: "General service request",
  estimatedWait: "12 mins",
  peopleAhead: 6,
  currentToken: "A096",
  status: "Waiting",
};

export const doctorsData = [
  {
    id: 1,
    name: "Dr. Nimal Perera",
    specialization: "Cardiology",
    branch: "Main Hospital",
    availability: "Mon - Fri, 9:00 AM - 1:00 PM",
  },
  {
    id: 2,
    name: "Dr. Anusha Silva",
    specialization: "Dermatology",
    branch: "Branch Clinic",
    availability: "Tue - Sat, 10:00 AM - 2:00 PM",
  },
  {
    id: 3,
    name: "Dr. Kasun Fernando",
    specialization: "Pediatrics",
    branch: "Emergency Unit",
    availability: "Mon - Sun, 8:00 AM - 4:00 PM",
  },
  {
    id: 4,
    name: "Dr. Ishara Jayasinghe",
    specialization: "Neurology",
    branch: "Main Hospital",
    availability: "Mon - Wed, 9:00 AM - 12:00 PM",
  },
  {
    id: 5,
    name: "Dr. Sahan Wickramasinghe",
    specialization: "Orthopedics",
    branch: "Branch Clinic",
    availability: "Thu - Sat, 11:00 AM - 3:00 PM",
  },
  {
    id: 6,
    name: "Dr. Malini Gunawardena",
    specialization: "ENT",
    branch: "Emergency Unit",
    availability: "Mon - Fri, 8:00 AM - 12:00 PM",
  },
  {
    id: 7,
    name: "Dr. Ruwan Senanayake",
    specialization: "General Surgery",
    branch: "Main Hospital",
    availability: "Mon - Fri, 1:00 PM - 5:00 PM",
  },
  {
    id: 8,
    name: "Dr. Chamari Fernando",
    specialization: "Gynecology & Obstetrics",
    branch: "Branch Clinic",
    availability: "Mon - Thu, 9:00 AM - 1:00 PM",
  },
  {
    id: 9,
    name: "Dr. Dinesh Kumara",
    specialization: "Ophthalmology",
    branch: "Main Hospital",
    availability: "Tue - Fri, 10:00 AM - 2:00 PM",
  },
  {
    id: 10,
    name: "Dr. Tharindu Rajapaksha",
    specialization: "Psychiatry",
    branch: "Emergency Unit",
    availability: "Mon - Sat, 12:00 PM - 4:00 PM",
  },
  {
    id: 11,
    name: "Dr. Sanduni Peris",
    specialization: "Physiotherapy",
    branch: "Branch Clinic",
    availability: "Mon - Fri, 8:00 AM - 11:00 AM",
  },
  {
    id: 12,
    name: "Dr. Lakshan De Silva",
    specialization: "Radiology",
    branch: "Main Hospital",
    availability: "Mon - Fri, 2:00 PM - 6:00 PM",
  },
];

export const hospitalModules = [
  {
    title: "Token Management",
    description: "Manage OPD and general patient token flow with live queue tracking.",
    icon: Ticket,
    moduleKey: "token-management",
    route: "/hospital",
  },
  {
    title: "Doctor Channeling",
    description: "Book doctor channeling appointments with an organized service flow.",
    icon: Stethoscope,
    moduleKey: "doctor-channeling",
    route: "/hospital/doctor-channeling",
  },
  {
    title: "Pharmacy Queue",
    description: "Join the pharmacy queue quickly for prescription and medicine pickup.",
    icon: Pill,
    moduleKey: "pharmacy-queue",
    route: "/hospital/pharmacy",
  },
];