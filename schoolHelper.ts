export const fetchSchoolIdByName = async ({
  cityId,
  schoolName,
  apiKey,
  baseUrl,
}: {
  cityId: number;
  schoolName: string;
  apiKey: string;
  baseUrl: string;
}): Promise<number | null> => {
  const res = await fetch(
    `${baseUrl}/api/v2/utilities/live-schools/${cityId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  const data = await res.json();
  const schools = data?.data?.docs;

  if (!Array.isArray(schools)) {
    console.error("No schools found in response");
    return null;
  }

  const matchedSchool = schools.find((school: any) =>
    school.schoolName?.toLowerCase().includes(schoolName.toLowerCase())
  );

  if (matchedSchool) {
    console.log("Matched school ID:", matchedSchool.schoolId);
    return matchedSchool.schoolId;
  }

  console.error("School not found:", schoolName);
  return null;
};
