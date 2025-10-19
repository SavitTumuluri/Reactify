export class AuthService {
  constructor() {
    this.domain = import.meta.env.VITE_AUTH0_DOMAIN;
    this.clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_AUTH0_CLIENT_SECRET;
    this.redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI;
    this.audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  }

  // Generate Auth0 login URL
  getLoginUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
    });

    if (this.audience) {
      params.append('audience', this.audience);
    }

    return `https://${this.domain}/authorize?${params.toString()}`;
  }

  // Generate Auth0 signup URL
  getSignupUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      prompt: 'signup',
    });

    if (this.audience) {
      params.append('audience', this.audience);
    }

    return `https://${this.domain}/authorize?${params.toString()}`;
  }

  // Generate Auth0 logout URL
  getLogoutUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      returnTo: this.redirectUri,
    });

    return `https://${this.domain}/v2/logout?${params.toString()}`;
  }

  // Handle the callback after Auth0 redirect
  async handleCallback(code) {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(`https://${this.domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.access_token) {
        const userResponse = await fetch(`https://${this.domain}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });

        const userInfo = await userResponse.json();

        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL;
          const backendResponse = await fetch(`${backendUrl}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth0Id: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture
            })
          });

          const backendData = await backendResponse.json();
          console.log('User created in backend:', backendData);
        } catch (error) {
          console.error('Error creating user in backend:', error);
        }

        const sessionData = { user: userInfo, tokens };
        localStorage.setItem('auth0_session', JSON.stringify(sessionData));

        return { user: userInfo, tokens };
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  isAuthenticated() {
    const sessionData = localStorage.getItem('auth0_session');
    return !!sessionData;
  }

  getCurrentUser() {
    const sessionData = localStorage.getItem('auth0_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.user;
    }
    return null;
  }

  getAccessToken() {
    const sessionData = localStorage.getItem('auth0_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.tokens?.access_token;
    }
    return null;
  }

  getUserId() {
    const user = this.getCurrentUser();
    return user?.sub;
  }

  logout() {
    localStorage.removeItem('auth0_session');
    window.location.href = this.getLogoutUrl();
  }
}

export const authService = new AuthService();