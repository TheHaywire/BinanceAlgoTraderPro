import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error handling for responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const jsonError = await res.json();
        throw new Error(`${res.status}: ${jsonError.message || JSON.stringify(jsonError)}`);
      } else {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes(`${res.status}:`)) {
        throw parseError;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

/**
 * Universal API request function
 * 
 * @param url The API endpoint URL
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param data Optional request body data
 * @returns Response object
 */
export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
  customHeaders?: Record<string, string>
): Promise<Response> {
  console.log(`Making API request to ${url} with method ${method}${data ? ' and data' : ''}`);
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(customHeaders || {})
  };
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed for ${method} ${url}:`, error);
    throw error;
  }
}

// Core mutations for CRUD operations
export const apiMutations = {
  post: async <T>(url: string, data: any): Promise<T> => {
    const res = await apiRequest(url, 'POST', data);
    return await res.json();
  },
  
  put: async <T>(url: string, data: any): Promise<T> => {
    const res = await apiRequest(url, 'PUT', data);
    return await res.json();
  },
  
  patch: async <T>(url: string, data: any): Promise<T> => {
    const res = await apiRequest(url, 'PATCH', data);
    return await res.json();
  },
  
  delete: async <T>(url: string): Promise<T> => {
    const res = await apiRequest(url, 'DELETE');
    return await res.json();
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 15000, // Refresh data every 15 seconds
      refetchOnWindowFocus: true, // Refresh when returning to the page
      staleTime: 10000, // Data is considered fresh for 10 seconds
      retry: 2, // Retry failed queries up to 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      onError: (error) => {
        console.error("Mutation error:", error);
      }
    },
  },
});
