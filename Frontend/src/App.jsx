import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import TenantHome from "./pages/tenant/tenantHome";
import SelectOrganization from "./pages/tenant/SelectOrganization";
import TenantLayout from "./layout/TenantLayout";
import OrganizationDetails from "./pages/tenant/OrganizationDetails";
import TrackQueue from "./pages/tenant/TrackQueue";
import DisplayScreen from "./pages/tenant/DisplayScreen";
import NotFound from "./pages/notFound";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import ChatbotWidget from "./components/common/ChatbotWidget";
import About from "./pages/About";
import Contact from "./pages/Contact";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/user/register" element={<Register />} />

        <Route path="/:tenantType" element={<TenantLayout />}>
          <Route index element={<TenantHome />} />
          <Route path="select-organization" element={<SelectOrganization />} />
          <Route path="org/:organizationId" element={<OrganizationDetails />} />
          <Route path="track" element={<TrackQueue />} />
        </Route>

        <Route path="/:tenantType/display/:branchId" element={<DisplayScreen />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatbotWidget />
    </BrowserRouter>
  );
}

export default App;