import { Navigate, Route, Routes } from "react-router-dom";
import { CANONICAL_ROLES, useAuth } from "../context/AuthContext";
import AdminLayout from "../layouts/AdminLayout";
import StaffLayout from "../layouts/StaffLayout";
import Login from "../pages/auth/Login";
import NotFound from "../pages/shared/NotFound";

// Police Super Admin
import PoliceSuperAdminDashboard from "../pages/policeSuperAdmin/Dashboard";
import PoliceSuperAdminMainDivision from "../pages/policeSuperAdmin/MainDivision";
import PoliceSuperAdminAddMainDivision from "../pages/policeSuperAdmin/AddMainDivision";
import PoliceSuperAdminServices from "../pages/policeSuperAdmin/Services";
import PoliceSuperAdminAddService from "../pages/policeSuperAdmin/AddService";
import PoliceSuperAdminBranches from "../pages/policeSuperAdmin/Branches";
import PoliceSuperAdminAddBranch from "../pages/policeSuperAdmin/AddBranch";
import PoliceSuperAdminBranchAdmins from "../pages/policeSuperAdmin/BranchAdmins";
import PoliceSuperAdminBranchRequests from "../pages/policeSuperAdmin/PoliceSuperAdminBranchRequests";

// Hospital Super Admin
import HospitalSuperAdminDashboard from "../pages/hospitalSuperAdmin/Dashboard";
import HospitalSuperAdminHospitals from "../pages/hospitalSuperAdmin/Hospitals";
import HospitalSuperAdminAddMainCategory from "../pages/hospitalSuperAdmin/AddMainCategory";
import HospitalSuperAdminServices from "../pages/hospitalSuperAdmin/Services";
import HospitalSuperAdminAddService from "../pages/hospitalSuperAdmin/AddService";
import HospitalSuperAdminRegisteredHospitals from "../pages/hospitalSuperAdmin/RegisteredHospitals";
import HospitalSuperAdminAddHospital from "../pages/hospitalSuperAdmin/AddHospital";
import HospitalSuperAdminHospitalAdmins from "../pages/hospitalSuperAdmin/HospitalAdmins";
import HospitalSuperAdminBranchRequests from "../pages/hospitalSuperAdmin/BranchRequests";

// Company Super Admin
import CompanySuperAdminDashboard from "../pages/companySuperAdmin/Dashboard";
import CompanySuperAdminOrganizations from "../pages/companySuperAdmin/Organizations";
import CompanySuperAdminBranches from "../pages/companySuperAdmin/Branches";
import CompanySuperAdminAddBank from "../pages/companySuperAdmin/AddBank";
import CompanySuperAdminAddSupermarket from "../pages/companySuperAdmin/AddSupermarket";
import CompanySuperAdminAddBankBranch from "../pages/companySuperAdmin/AddBankBranch";
import CompanySuperAdminAddSupermarketBranch from "../pages/companySuperAdmin/AddSupermarketBranch";
import CompanySuperAdminOrganizationAdmins from "../pages/companySuperAdmin/OrganizationAdmins";
import CompanySuperAdminBranchRequests from "../pages/companySuperAdmin/BranchRequests";
import CompanySuperAdminSystemBuilder from "../pages/companySuperAdmin/SystemBuilder";

// Shared Organization Admin
import SharedOrganizationAdminDashboard from "../pages/organizationAdmin/Dashboard";
import SharedOrganizationAdminBranches from "../pages/organizationAdmin/Branches";
import AddBranch from "../pages/organizationAdmin/AddBranch";
import AddService from "../pages/organizationAdmin/AddService";
import SharedOrganizationAdminBranchAdmins from "../pages/organizationAdmin/BranchAdmins";
import SharedOrganizationAdminServices from "../pages/organizationAdmin/Services";

// Branch Admin
import BranchAdminDashboard from "../pages/branchAdmin/Dashboard";
import BranchAdminStaff from "../pages/branchAdmin/Staff";
import BranchAdminAddStaff from "../pages/branchAdmin/AddStaff";
import BranchAdminOperations from "../pages/branchAdmin/Operations";
import BranchAdminDetails from "../pages/branchAdmin/BranchDetails";

// Staff
import StaffDashboard from "../pages/staff/Dashboard";
import StaffProfile from "../pages/staff/Profile";
import StaffTasks from "../pages/staff/Tasks";

import { getDefaultDashboardPath } from "../utils/permissions";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  const { role } = useAuth();

  return (
    {/* DEDICATED STAFF LAYOUT */}
      <Route
        element={
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        {/* STAFF ROUTES */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={[CANONICAL_ROLES.STAFF]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute allowedRoles={[CANONICAL_ROLES.STAFF]}>
              <StaffProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/tasks"
          element={
            <ProtectedRoute allowedRoles={[CANONICAL_ROLES.STAFF]}>
              <StaffTasks />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
