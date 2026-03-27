/**
 * Document proxy API route
 * Fetches a document from the backend (or any allowed URL) server-side and streams it back.
 * Avoids CORS and mixed-content issues when the frontend needs to fetch PDF/image from the API.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url query parameter' });
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url encoding' });
  }

  // Only allow proxying to our backend (same origin as NEXT_PUBLIC_API_URL) to prevent open redirect
  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const allowedHost = new URL(baseApiUrl).host;
  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid target URL' });
  }
  if (parsedTarget.host !== allowedHost) {
    return res.status(403).json({ error: 'Proxy only allowed to backend host' });
  }

  const authHeader = req.headers.authorization;

  try {
    const headers = {
      Accept: req.headers.accept || '*/*',
      ...(authHeader && { Authorization: authHeader })
    };
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).send(response.statusText || 'Upstream error');
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Document proxy error:', err.message);
    res.status(502).json({ error: 'Failed to fetch document', message: err.message });
  }
}
