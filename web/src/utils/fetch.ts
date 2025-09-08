const baseUrl = "/api";
const tryJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
export const baseGet = async (
  url: string,
  headers: Record<string, string> = {}
) => {
  const response = await fetch(`${baseUrl}${url}`, {
    headers,
  });
  return tryJson(response);
};
export const basePost = async (url: string, data: Record<string, unknown>) => {
  const response = await fetch(`${baseUrl}${url}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return tryJson(response);
};
