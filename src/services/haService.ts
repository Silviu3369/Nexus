export class HomeAssistantService {
  private static instance: HomeAssistantService;
  
  private constructor() {}

  public static getInstance(): HomeAssistantService {
    if (!HomeAssistantService.instance) {
      HomeAssistantService.instance = new HomeAssistantService();
    }
    return HomeAssistantService.instance;
  }

  public getConfig() {
    return {
      url: localStorage.getItem('ha_url') || '',
      token: localStorage.getItem('ha_token') || '',
      entityId: localStorage.getItem('ha_entity_id') || '',
    };
  }

  public saveConfig(url: string, token: string, entityId: string) {
    // Remove trailing slash from URL
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    localStorage.setItem('ha_url', cleanUrl);
    localStorage.setItem('ha_token', token);
    localStorage.setItem('ha_entity_id', entityId);
  }

  public hasConfig(): boolean {
    const config = this.getConfig();
    return !!(config.url && config.token && config.entityId);
  }

  public async getEntityState() {
    const config = this.getConfig();
    if (!this.hasConfig()) throw new Error('Home Assistant not configured');

    try {
      const response = await fetch(`${config.url}/api/states/${config.entityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Home Assistant entity state:', error);
      throw error;
    }
  }

  public async toggleEntity(state?: 'on' | 'off') {
    const config = this.getConfig();
    if (!this.hasConfig()) throw new Error('Home Assistant not configured');

    const domain = config.entityId.split('.')[0]; // e.g., 'light', 'switch'
    
    // Determine the service to call
    let service = 'toggle';
    if (state === 'on') service = 'turn_on';
    if (state === 'off') service = 'turn_off';

    try {
      const response = await fetch(`${config.url}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: config.entityId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to toggle Home Assistant entity:', error);
      throw error;
    }
  }
}

export const haService = HomeAssistantService.getInstance();
