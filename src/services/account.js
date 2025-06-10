export const loginApi = async (email, password) => {
  const response = await fetch("https://localhost:7243/api/Account/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: email,
      password_hash: password,
    }),
  });
  return response;
};

export const registerAPI = async (formData) => {
  const response = await fetch("https://localhost:7243/api/Account/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: formData.username,
      password_hash: formData.password,
      email: formData.email,
      full_name: formData.fullName,
      gender: formData.gender,
      phone: formData.phone,
      birthdate: formData.birthdate,
      role: "Patient",
      address: formData.address,
    }),
  });
  return response;
};
