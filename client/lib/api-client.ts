import toast from "react-hot-toast";

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("API Error:", error);
    toast.error(error.message || "Failed to connect to the server. Please try again later.");
    return null; 
  }
}