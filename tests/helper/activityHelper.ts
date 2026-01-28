export const verifyActivityLog = async ({
  studentId,
  name,
  grade,
  schoolIncludes,
  apiKey,
  baseUrl,
}: {
  studentId: number;
  name: string;
  grade: string;
  schoolIncludes?: string;
  apiKey: string;
  baseUrl: string;
}) => {
  const res = await fetch(
    `${baseUrl}/api/v2/activities/students/${studentId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    }
  );

  const data = await res.json();

  const matchedDocs = data.docs.filter((doc) => {
    const isNewLead = doc.activityDetails?.name === "New Lead Enquiry";

    const hasName = doc.fields?.some(
      (f) => f.name.toLowerCase() === "name" && f.value === name
    );

    const hasGrade = doc.fields?.some(
      (f) => f.name.toLowerCase() === "grade" && f.value === grade
    );

    const hasSchool = schoolIncludes
      ? doc.fields?.some(
          (f) =>
            f.name.toLowerCase() === "school" &&
            f.value.toLowerCase().includes(schoolIncludes.toLowerCase())
        )
      : true;

    const matches = isNewLead && hasName && hasGrade && hasSchool;

    if (!matches) {
      console.log("Mismatch:", {
        isNewLead,
        hasName,
        hasGrade,
        hasSchool,
        fields: doc.fields,
      });
    }

    return matches;
  });

  return matchedDocs[0];
};
