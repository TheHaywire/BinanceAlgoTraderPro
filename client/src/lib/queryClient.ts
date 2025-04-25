import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error handling for responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const jsonError = await res.json();
        const errorMessage = jsonError.error || jsonError.message || JSON.stringify(jsonError);
        throw new Error(`${res.status}: ${errorMessage}`);
      } else {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes(`${res.status}:`)) {
        throw parseError;
      }
      throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
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
  
  if (data) {
    console.log('Request payload:', data);
  }
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(customHeaders || {})
  };
  
  // Add a unique request ID to help with debugging
  const requestId = Math.random().toString(36).substring(2, 12);
  headers["X-Request-ID"] = requestId;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
      cache: "no-cache",
    });
    
    clearTimeout(timeoutId);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`API request timeout for ${method} ${url} after 30 seconds`);
      throw new Error('Request timeout: The server took too long to respond');
    }
    
    console.error(`API request failed for ${method} ${url}:`, error);
    throw error;
  }
}

// Core mutations for CRUD operations
export const apiMutations = {
  post: async <T>(url: string, data: any): Promise<T> => {
    try {
      const res = await apiRequest(url, 'POST', data);
      const responseData = await res.json();
      console.log(`POST response for ${url}:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`POST mutation failed for ${url}:`, error);
      throw error;
    }
  },
  
  put: async <T>(url: string, data: any): Promise<T> => {
    try {
      const res = await apiRequest(url, 'PUT', data);
      return await res.json();
    } catch (error) {
      console.error(`PUT mutation failed for ${url}:`, error);
      throw error;
    }
  },
  
  patch: async <T>(url: string, data: any): Promise<T> => {
    try {
      const res = await apiRequest(url, 'PATCH', data);
      return await res.json();
    } catch (error) {
      console.error(`PATCH mutation failed for ${url}:`, error);
      throw error;
    }
  },
  
  delete: async <T>(url: string): Promise<T> => {
    try {
      const res = await apiRequest(url, 'DELETE');
      return await res.json();
    } catch (error) {
      console.error(`DELETE mutation failed for ${url}:`, error);
      throw error;
    }
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`Query timeout for ${queryKey[0]} after 30 seconds`);
        throw new Error('Request timeout: The server took too long to respond');
      }
      
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
      // Better error handling with useful messages
      onError: (error: any) => {
        console.error("Query error:", error?.message || error);
      }
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: 1000, // Wait 1 second before retrying
      onError: (error: any) => {
        console.error("Mutation error:", error?.message || error);
      }
    },
  },
});
