import CompanyOrganizationForm from "../../components/forms/CompanyOrganizationForm";

export default function CompanySuperAdminAddSupermarket() {
  return (
    <CompanyOrganizationForm
      tenantType="supermarket"
      title="Add Supermarket Organization"
      subtitle="Register a supermarket and create organization admin access"
      organizationSectionTitle="Supermarket Information"
      organizationNameLabel="Supermarket Name"
    />
  );
}
