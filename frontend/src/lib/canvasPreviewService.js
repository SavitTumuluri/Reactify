import { toPng } from "html-to-image";
import { authService } from './authService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

class CanvasPreviewService {
  async getAuthHeaders() {
    const accessToken = authService.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Capture a preview of the canvas and upload it to S3
   * @param {HTMLElement} canvasElement - The canvas DOM element to capture
   * @param {string} canvasId - The canvas ID for naming the preview
   * @returns {Promise<string>} - The public URL of the uploaded preview
   */
  async captureAndUploadPreview(canvasElement, canvasId) {
    try {
      
      if (!canvasElement) {
        throw new Error('Canvas element is required');
      }

      // Get the actual background color from the canvas element
      const computedStyle = window.getComputedStyle(canvasElement);
      const backgroundColor = computedStyle.backgroundColor || computedStyle.background || '#ffffff';

      // Try to find the canvas viewport container for better capture
      const canvasViewport = canvasElement.closest('#canvas-viewport');
      const captureElement = canvasViewport || canvasElement;

      // Use the viewport or canvas element with better capture options
      const captureOptions = {
        quality: 0.95,
        pixelRatio: 2, // Higher resolution for better quality
        backgroundColor: backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent' ? '#ffffff' : backgroundColor,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'center center',
        },
        filter: (node) => {
          // Include all nodes, don't filter anything
          return true;
        }
      };

      // Capture the canvas as PNG
      let dataUrl;
      try {
        dataUrl = await toPng(captureElement, captureOptions);
      } catch (error) {
        // Fallback: try with simpler options
        const fallbackOptions = {
          quality: 0.8,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
        };
        
        dataUrl = await toPng(captureElement, fallbackOptions);
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Get presigned URL for upload with simpler structure
      const headers = await this.getAuthHeaders();
      
      const presignResponse = await fetch(`${BACKEND_URL}/api/s3/presign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filename: `${canvasId}.png`,
          contentType: 'image/png',
          prefix: 'canvas-previews/'
        })
      });

      if (!presignResponse.ok) {
        const errorText = await presignResponse.text();
        throw new Error('Failed to get presigned URL');
      }

      const responseData = await presignResponse.json();
      const { url: uploadUrl, publicUrl } = responseData;

      // Upload the image to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/png'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload preview to S3');
      }

      // Store the preview URL in the database
      await this.updateCanvasPreviewUrl(canvasId, publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Error capturing and uploading canvas preview:', error);
      throw error;
    }
  }

  /**
   * Update the canvas with the preview URL in the database
   * @param {string} canvasId - The canvas ID
   * @param {string} previewUrl - The S3 preview URL
   */
  async updateCanvasPreviewUrl(canvasId, previewUrl) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/canvas/${canvasId}/preview`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ previewUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to update canvas preview URL');
      }

    } catch (error) {
      console.error('Error updating canvas preview URL:', error);
      throw error;
    }
  }

  /**
   * Get all canvas previews for the current user
   * @returns {Promise<Array>} - Array of preview objects with key, url, etc.
   */
  async getCanvasPreviews() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/s3/images?prefix=canvas-previews/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch canvas previews');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching canvas previews:', error);
      throw error;
    }
  }

  /**
   * Delete a canvas preview from S3
   * @param {string} key - The S3 key of the preview to delete
   */
  async deleteCanvasPreview(key) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/s3/file`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        throw new Error('Failed to delete canvas preview');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting canvas preview:', error);
      throw error;
    }
  }

  /**
   * Generate a preview URL for a canvas ID
   * @param {string} canvasId - The canvas ID
   * @returns {string} - The expected preview URL
   */
  getPreviewUrl(canvasId) {
    const bucket = import.meta.env.VITE_S3_BUCKET || 'reactify-canvas-previews';
    const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
    const userId = authService.getUserId();
    return `https://${bucket}.s3.${region}.amazonaws.com/canvas-previews/users/${userId}/${canvasId}.png`;
  }
}

export const canvasPreviewService = new CanvasPreviewService();
