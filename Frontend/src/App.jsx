import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import SelectOrganization from "./pages/tenant/SelectOrganization";
import SelectHospitalService from "./pages/tenant/SelectHospitalService";
import TenantLayout from "./layout/TenantLayout";
import TenantHome from "./pages/tenant/tenantHome";
import BranchSelection from "./pages/tenant/branchSelection";
import ServiceSelection from "./pages/tenant/serviceSelection";
import BookToken from "./pages/tenant/bookToken";
import BookAppointment from "./pages/tenant/doctor/bookAppointment";
import FindDoctor from "./pages/tenant/doctor/FindDoctor";
import DoctorChannelingHome from "./pages/tenant/doctor/DoctorChannelingHome";
import DoctorDetails from "./pages/tenant/doctor/DoctorDetails";
import CompleteBooking from "./pages/tenant/doctor/CompleteBooking";
import BookingSuccess from "./pages/tenant/pharmacy/BookingSuccess";
import MyAppointment from "./pages/tenant/doctor/MyAppointment";
import QueueStatus from "./pages/tenant/queueStatus";
import PharmacyQueueHome from "./pages/tenant/pharmacy/PharmacyQueueHome";
import PharmacyDetails from "./pages/tenant/pharmacy/PharmacyDetails";
import PharmacyBookingSuccess from "./pages/tenant/pharmacy/PharmacyBookingSuccess";
import NotFound from "./pages/notFound";
import CheckIn from "./pages/tenant/checkIn";
import Notifications from "./pages/tenant/notifications";
import MyBooking from "./pages/tenant/myBooking";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:tenantType/select-organization" element={<SelectOrganization />} />
        <Route path="/hospital/select-service" element={<SelectHospitalService />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/user/register" element={<Register />} />

        <Route path="/:tenantType" element={<TenantLayout />}>
          <Route index element={<TenantHome />} />
          <Route path="branches" element={<BranchSelection />} />
          <Route path="services" element={<ServiceSelection />} />
          <Route path="book-token" element={<BookToken />} />
          <Route path="doctor-channeling" element={<DoctorChannelingHome />} />
          <Route path="find-doctor" element={<FindDoctor />} />
          <Route path="doctor-details" element={<DoctorDetails />} />
          <Route path="complete-booking" element={<CompleteBooking />} />
          <Route path="booking-success" element={<BookingSuccess />} />
          <Route path="my-appointment" element={<MyAppointment />} />
          <Route path="book-appointment" element={<BookAppointment />} />
          <Route path="pharmacy" element={<PharmacyQueueHome />} />
          <Route path="pharmacy/details" element={<PharmacyDetails />} />
          <Route path="pharmacy/success" element={<PharmacyBookingSuccess />} />
          <Route path="queue-status/:tokenId?" element={<QueueStatus />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="my-booking" element={<MyBooking />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;