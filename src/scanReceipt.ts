export async function scanReceipt(
  formData: FormData,
  options?: { 
    url?: string; 
    credentials?: RequestCredentials; 
    headers?: Record<string, string> 
  }
): Promise<any> {
  if (!(formData instanceof FormData)) {
    throw new Error('scanReceipt requires a FormData instance as the first argument.');
  }

  const url = options?.url || '/api/scan-receipt';
  const credentials = options?.credentials ?? 'same-origin';

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {})
      },
      credentials
    });
  } catch (err: any) {
    console.error('Network error when calling', url, err);
    throw new Error(
      `Network error: Could not connect to ${url}. Is the backend running? (${err?.message || err})`
    );
  }

  // Always read as text first to avoid abrupt JSON parsing crashes on empty responses
  const responseText = await response.text();
  const trimmedText = responseText.trim();
  let data: any = null;

  if (trimmedText) {
    const looksLikeJson = trimmedText.startsWith('{') || trimmedText.startsWith('[');
    
    try {
      data = JSON.parse(trimmedText);
    } catch (e) {
      console.error('Server returned malformed response text:', responseText);
      throw new Error(`Server returned invalid data format (status ${response.status}).`);
    }
  } else {
    // Handles the exact "Unexpected end of JSON input" scenario gracefully
    console.warn(`Server returned an empty response body with status ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      data?.message || 
      data?.error || 
      (`Server failed with status ${response.status} ${response.statusText}`.trim())
    );
  }

  // Fallback if response was successful (e.g. 200 OK) but body was blank
  return data || { success: true };
}

export default scanReceipt;
