import { doctorsData } from "../data/dummyData";

const includesText = (value, searchText) => {
  if (!searchText.trim()) {
    return true;
  }

  return value.toLowerCase().includes(searchText.trim().toLowerCase());
};

export const getDoctors = () => [...doctorsData];

export const searchDoctors = (filters = {}) => {
  if (typeof filters === "string") {
    const searchText = filters;

    return doctorsData.filter((doctor) => {
      return (
        includesText(doctor.name, searchText) ||
        includesText(doctor.specialization, searchText) ||
        includesText(doctor.branch, searchText)
      );
    });
  }

  const { name = "", specialization = "", branch = "" } = filters;

  return doctorsData.filter((doctor) => {
    const matchesName = includesText(doctor.name, name);
    const matchesSpecialization = includesText(doctor.specialization, specialization);
    const matchesBranch = includesText(doctor.branch, branch);

    return matchesName && matchesSpecialization && matchesBranch;
  });
};