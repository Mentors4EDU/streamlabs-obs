import { PersistentStatefulService } from 'services';
import { Inject } from 'services/core';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import { authorizedHeaders } from 'util/requests';
import { TPlatform, getPlatformService } from './platforms';
import { TwitchService } from 'app-services';

interface IRestreamState {}

interface IUserSettingsResponse {
  // Not sure what effect this has
  enabled: boolean;

  streamKey: string;
}

export class RestreamService extends PersistentStatefulService<IRestreamState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  settings: IUserSettingsResponse;

  async init() {
    super.init();
    this.settings = await this.fetchUserSettings();

    console.log(this.settings);

    const targets = await this.fetchTargets();

    console.log(targets);

    console.log(await this.fetchIngest());
  }

  fetchUserSettings() {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/api/v1/rst/user/settings`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  fetchTargets() {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/api/v1/rst/targets`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  fetchIngest() {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/api/v1/rst/ingest`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  enableUser() {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${host}/api/v1/rst/user/settings`;
    const body = JSON.stringify({
      enabled: true,
      dcProtection: false,
      idleTimeout: 30,
    });
    const request = new Request(url, { headers, body, method: 'PUT' });

    return fetch(request).then(res => res.json());
  }

  async ensureStreamTarget(platform: TPlatform) {
    if (platform !== 'twitch') throw new Error('Only Twitch is supported currently');

    const service = getPlatformService(platform);

    if (service instanceof TwitchService) {
      const streamKey = await service.fetchStreamKey();

      await this.createTarget(platform, streamKey);
    }
  }

  createTarget(platform: TPlatform, streamKey: string) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${host}/api/v1/rst/targets`;
    const body = JSON.stringify([{
      platform,
      streamKey,
      enabled: true,
      dcProtection: false,
      idleTimeout: 30,
      label: `${platform} target`,
    }]);
    const request = new Request(url, { headers, body, method: 'POST' });

    return fetch(request).then(res => res.json());
  }
}