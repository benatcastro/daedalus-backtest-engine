import axios from './axios';

function resolveBaseUrl(endpoint: string) {
  let baseUrl = process.env.NEXT_PUBLIC_NEXT_API_URL
  if (endpoint.includes('/backtest/')) {
    baseUrl = process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL
  }
  return baseUrl
}

export const fetcher = (url: string | string[]) => {
  if (Array.isArray(url)) {
    return asyncFetcher(url)
  }
  else {
    return baseFetcher(url)
  }
}

export const baseFetcher = (endpoint: string) => {
  const baseUrl = resolveBaseUrl(endpoint)
  console.log(`baseUrl -> ${baseUrl} url -> ${endpoint}`)
  console.warn(`fetching to: ${baseUrl}${endpoint}`)
  return axios.get(`${baseUrl}${endpoint}`).then(res => res.data);
}

// Define the fetcher function to handle multiple requests
export const asyncFetcher = async (endpoints: string[]) => {
  // Map over the URLs and send requests concurrently
  const requests = endpoints.map((endpoint) => {
    const baseUrl = resolveBaseUrl(endpoint);

    const fetchUrl = `${baseUrl}${endpoint}`
    console.warn(`fetching -> ${fetchUrl}`)
    return axios.get(fetchUrl).then((res) => res.data);
  });

  // Use Promise.all to fetch all resources in parallel and return their results
  const results = Promise.all(requests);
  return results; // This will return an array of responses
};

export const basePost = (endpoint: string) => {
  const baseUrl = resolveBaseUrl(endpoint)
  console.log(`baseUrl -> ${baseUrl} url -> ${endpoint}`)
  console.warn(`posting to: ${baseUrl}${endpoint}`)
  return axios.post(`${baseUrl}${endpoint}`).then(res => res.data);
}
