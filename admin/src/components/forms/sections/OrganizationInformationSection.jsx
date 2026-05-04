export default function OrganizationInformationSection({
  sectionTitle,
  form,
  onChange,
  nameField,
  nameLabel,
  namePlaceholder,
  categoryField,
  categoryLabel,
  categoryOptions,
  shortNamePlaceholder,
  cityPlaceholder,
  addressPlaceholder,
  contactPlaceholder,
  emailPlaceholder,
  provinces,
  districts,
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{sectionTitle}</h2>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={nameField} className="mb-1.5 block text-sm font-medium text-gray-700">
            {nameLabel}
          </label>
          <input
            id={nameField}
            name={nameField}
            value={form[nameField]}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={namePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="shortName" className="mb-1.5 block text-sm font-medium text-gray-700">
            Short Name
          </label>
          <input
            id="shortName"
            name="shortName"
            value={form.shortName}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={shortNamePlaceholder}
          />
        </div>

        <div>
          <label htmlFor={categoryField} className="mb-1.5 block text-sm font-medium text-gray-700">
            {categoryLabel}
          </label>
          <select
            id={categoryField}
            name={categoryField}
            value={form[categoryField]}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="province" className="mb-1.5 block text-sm font-medium text-gray-700">
            Province
          </label>
          <select
            id="province"
            name="province"
            value={form.province}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          >
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="district" className="mb-1.5 block text-sm font-medium text-gray-700">
            District
          </label>
          <select
            id="district"
            name="district"
            value={form.district}
            onChange={onChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
          >
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={cityPlaceholder}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={form.address}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={addressPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="contactNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            id="contactNumber"
            name="contactNumber"
            value={form.contactNumber}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={contactPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-sky-100"
            placeholder={emailPlaceholder}
          />
        </div>
      </div>
    </section>
  );
}
