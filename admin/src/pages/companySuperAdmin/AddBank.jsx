import CompanyOrganizationForm from "../../components/forms/CompanyOrganizationForm";

export default function CompanySuperAdminAddBank() {
  return (
    <CompanyOrganizationForm
      tenantType="bank"
      title="Add Bank Organization"
      subtitle="Register a bank and create organization admin access"
      organizationSectionTitle="Bank Information"
      organizationNameLabel="Bank Name"
    />
  );
}
