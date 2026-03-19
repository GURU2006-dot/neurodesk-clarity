const API_BASE = "http://127.0.0.1:8000"

const getToken = () => localStorage.getItem("nd_token") || ""

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`)
  return res.json()
}

export async function simplifyTask(data: { task: string }): Promise<{ steps: string[] }> {
  const res = await fetch(`${API_BASE}/api/simplify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ task: data.task }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error)
  }

  return res.json()
}