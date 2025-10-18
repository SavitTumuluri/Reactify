import { authService } from './authService'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'

class CanvasService {
  async getAuthHeaders() {
    const accessToken = authService.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async getAllCanvases() {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${BACKEND_URL}/api/canvas/all`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch canvases: ${response.statusText}`)
      }

      const data = await response.json()
      return data.canvases || []
    } catch (error) {
      console.error('Error fetching canvases:', error)
      throw error
    }
  }

  async createCanvas(name) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${BACKEND_URL}/api/canvas/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create canvas: ${response.statusText}`)
      }

      const data = await response.json()
      return data.canvas
    } catch (error) {
      console.error('Error creating canvas:', error)
      throw error
    }
  }

  async deleteCanvas(canvasId) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${BACKEND_URL}/api/canvas/${canvasId}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to delete canvas: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting canvas:', error)
      throw error
    }
  }

  async getCanvas(canvasId) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${BACKEND_URL}/api/canvas/${canvasId}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to get canvas: ${response.statusText}`)
      }

      const data = await response.json()
      return data.canvas
    } catch (error) {
      console.error('Error getting canvas:', error)
      throw error
    }
  }

  async updateCanvas(canvasId, canvasData, name) {
    try {
      const headers = await this.getAuthHeaders()
      const body = {}
      if (canvasData !== undefined) body.canvasData = canvasData
      if (name !== undefined) body.name = name

      const response = await fetch(`${BACKEND_URL}/api/canvas/${canvasId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Failed to update canvas: ${response.statusText}`)
      }

      const data = await response.json()
      return data.canvas
    } catch (error) {
      console.error('Error updating canvas:', error)
      throw error
    }
  }
}

export const canvasService = new CanvasService()
