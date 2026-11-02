export async function api(path, options = {}) {
  const response = await fetch(
    (import.meta.env.VITE_API_BASE || "/api/cms") + path,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CMS-Request": "1",
        ...options.headers,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("cms:unauthorized"));
    const error = new Error(
      data.message || "The request could not be completed.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
