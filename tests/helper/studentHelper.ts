export const fetchStudentIdByMobileAndEmail = async ({
  mobileNumber,
  email,
  apiKey,
  baseUrl,
}: {
  mobileNumber: string;
  email: string;
  apiKey: string;
  baseUrl: string;
}): Promise<number | null> => {
  const url = `${baseUrl}/api/v2/students?filter[mobileNumber][0]=${encodeURIComponent(
    mobileNumber
  )}&filter[email][0]=${encodeURIComponent(email)}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  const data = await res.json();

  if (!Array.isArray(data.docs) || data.docs.length === 0) {
    console.error("No students found for mobile/email:", {
      mobileNumber,
      email,
    });
    return null;
  }

  // Find the student with the matching email
  const exactMatch = data.docs.find(
    (doc) => doc.email?.toLowerCase() === email.toLowerCase()
  );

  if (exactMatch) {
    console.log("Matched student:", exactMatch.id);
    return exactMatch.id;
  }

  console.error(
    "No exact student matched email:",
    email,
    "in docs:",
    data.docs
  );
  return null;
};
